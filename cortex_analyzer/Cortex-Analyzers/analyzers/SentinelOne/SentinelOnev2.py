#!/usr/bin/env python3

import re
import time
from datetime import datetime, timedelta, timezone

import requests
from cortexutils.analyzer import Analyzer

AGENT_NAME_RE = re.compile(r'"agentName":"([^"]+)"')
DNS_REQUEST_RE = re.compile(r'"DNSRequest":"([^"]+)"')
DATETIME_FORMAT_DV = "%Y-%m-%dT%H:%M:%S.%fZ"
DATETIME_FORMAT_SDL = "%Y-%m-%dT%H:%M:%SZ"
DEFAULT_CHECK_QUERY_SECONDS = 5
DEFAULT_EVENT_COUNT = 200
DEFAULT_HOURS_AGO = 2
NEXT_CURSOR_NONE = '"nextCursor":null,'
NEXT_CURSOR_RE = re.compile(r'"nextCursor":"([^"]+)"')

S1_API_ENDPOINTS_DV = {
    "create-query-and-get-id": "/web/api/v2.1/dv/init-query",
    "check-query-status": "/web/api/v2.1/dv/query-status",
    "get-events": "/web/api/v2.1/dv/events",
}

SDL_QUERY_PATH = "/api/powerQuery"

SERVICES = ("dns-lookups", "dns-reverse-lookup")
URL_RE = re.compile(r"^[^:]+:\/{2}([\w\d\-\.]+).+$")
USER_AGENT = "strangebee-thehive/1.0"


class SentinelOne(Analyzer):
    def __init__(self):
        Analyzer.__init__(self)

        self.s1_console_url = self.get_param(
            "config.s1_console_url", None, "S1 console URL is missing!"
        ).rstrip("/")

        # API mode: 'sdl' (new) or 'dv' (legacy Deep Visibility)
        self.api_mode = self.get_param("config.api_mode", "sdl").lower()

        if self.api_mode == "sdl":
            # SDL uses a Log Access Read Key directly as Bearer token
            self.sdl_token = self.get_param(
                "config.sdl_token", None,
                "SDL Log Access Read Key is required for SDL mode"
            )
            # SDL URL may differ from console URL (defaults to console URL)
            self.sdl_url = self.get_param(
                "config.sdl_url", self.s1_console_url
            ).rstrip("/")
        else:  # dv
            self.s1_api_key = self.get_param(
                "config.s1_api_key", None,
                "S1 API key is required for Deep Visibility mode"
            )
            self.s1_account_id = self.get_param(
                "config.s1_account_id", None,
                "Account ID is required for Deep Visibility mode"
            )

        self.service = self.get_param(
            "config.service", None, "SentinelOne service is missing"
        )
        if self.service not in SERVICES:
            self.error(
                "Unknown service '{}'. Supported: {}".format(
                    self.service, ", ".join(SERVICES)
                )
            )

        self.data = self.get_data()

        self.hours_ago = int(
            self.get_param("config.s1_hours_ago", DEFAULT_HOURS_AGO)
        )
        if self.hours_ago < 1:
            self.error("hours_ago must be greater than 0")

    def _get_headers_dv(self):
        return {
            "Authorization": "ApiToken " + self.s1_api_key,
            "User-Agent": USER_AGENT,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def _get_headers_sdl(self):
        return {
            "Authorization": "Bearer " + self.sdl_token,
            "User-Agent": USER_AGENT,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    # Deep Visibility (legacy) helpers

    def _check_query_status(self, query_id):
        response = requests.get(
            self.s1_console_url + S1_API_ENDPOINTS_DV["check-query-status"],
            headers=self._get_headers_dv(),
            params={"queryId": query_id},
        )
        if response.status_code == requests.codes.ok:
            state = response.json()["data"]["responseState"]
            if state == "RUNNING":
                return False, False
            elif state == "FINISHED":
                return True, False
            else:
                self.error(state)
                return False, True
        else:
            self.error(self._errors_to_string(response))
            return False, True

    def _create_query_and_get_id(self, query):
        to_date = datetime.now(timezone.utc)
        response = requests.post(
            self.s1_console_url
            + S1_API_ENDPOINTS_DV["create-query-and-get-id"],
            headers=self._get_headers_dv(),
            json={
                "fromDate": self._get_from_date(to_date).strftime(
                    DATETIME_FORMAT_DV
                ),
                "toDate": to_date.strftime(DATETIME_FORMAT_DV),
                "query": query,
                "accountIds": [self.s1_account_id],
                "queryType": ["events"],
            },
        )
        if response.status_code == requests.codes.ok:
            return response.json()["data"]["queryId"]
        self.error(self._errors_to_string(response))
        return None

    def _wait_for_dv_query(self, query_id):
        done, errored = False, False
        while not (done or errored):
            time.sleep(DEFAULT_CHECK_QUERY_SECONDS)
            done, errored = self._check_query_status(query_id)
        return not errored

    def _dv_event_pages(self, query_id, next_cursor=None):
        done, errored = False, False
        params = {"queryId": query_id, "limit": DEFAULT_EVENT_COUNT}
        while not (done or errored):
            if next_cursor:
                params["cursor"] = next_cursor

            response = requests.get(
                self.s1_console_url + S1_API_ENDPOINTS_DV["get-events"],
                headers=self._get_headers_dv(),
                params=params,
            )

            if response.status_code != requests.codes.ok:
                self.error(self._errors_to_string(response))
                return

            data = response.text

            if NEXT_CURSOR_NONE in data:
                done = True
            else:
                match_obj = NEXT_CURSOR_RE.search(data)
                if match_obj is not None:
                    next_cursor = match_obj.group(1)
                else:
                    done = True

            yield data

    def _extract_from_dv_pages(self, query_id, *regexes):
        result_sets = [set() for _ in regexes]
        for page in self._dv_event_pages(query_id):
            for i, regex in enumerate(regexes):
                result_sets[i].update(regex.findall(page))
        return result_sets

    # SDL (PowerQuery) helpers

    def _sdl_query(self, s1ql_query):
        to_date = datetime.now(timezone.utc)
        from_date = self._get_from_date(to_date)

        response = requests.post(
            self.sdl_url + SDL_QUERY_PATH,
            headers=self._get_headers_sdl(),
            json={
                "query": s1ql_query,
                "startTime": from_date.strftime(DATETIME_FORMAT_SDL),
                "endTime": to_date.strftime(DATETIME_FORMAT_SDL),
            },
        )
        if response.status_code != 200:
            self.error(
                "SDL query failed (HTTP {}): {}".format(
                    response.status_code, response.text[:500]
                )
            )

        data = response.json()

        # PowerQuery returns columnar: {columns: [{name: ...}], values: [[...], ...]}
        columns = [col.get("name", "") for col in data.get("columns", [])]
        rows = data.get("values", [])
        return [dict(zip(columns, row)) for row in rows]

    def _extract_from_sdl(self, rows, *field_names):
        result_sets = [set() for _ in field_names]
        for row in rows:
            for i, field in enumerate(field_names):
                val = row.get(field)
                if val:
                    result_sets[i].add(val)
        return result_sets

    def _errors_to_string(self, response):
        try:
            data = response.json()
            return "\n".join(
                [
                    "{}: {} ({})".format(e["title"], e["detail"], e["code"])
                    for e in data["errors"]
                ]
            )
        except (ValueError, KeyError):
            return "Received {} from SentinelOne.".format(
                response.status_code
            )

    def _get_from_date(self, to_date):
        return to_date - timedelta(hours=self.hours_ago)

    def _run_dns_lookups_sdl(self, search_data):
        filter_query = (
            "event.type == 'DNS Resolved' "
            "&& event.dns.request contains '{}'".format(search_data)
        )
        result = self._sdl_query(filter_query)
        (agent_names,) = self._extract_from_sdl(result, "endpoint.name")
        self.report({"agent_names": sorted(agent_names)})

    def _run_dns_lookups_dv(self, search_data):
        query = (
            'EventType = "DNS Resolved" '
            'AND DNSRequest contains "{}"'.format(search_data)
        )
        query_id = self._create_query_and_get_id(query)
        if query_id is None:
            return

        if not self._wait_for_dv_query(query_id):
            return

        (agent_names,) = self._extract_from_dv_pages(
            query_id, AGENT_NAME_RE
        )
        self.report({"agent_names": sorted(agent_names)})

    def _run_dns_reverse_lookup_sdl(self, ip):
        filter_query = (
            "event.type == 'DNS Resolved' "
            "&& event.dns.response contains '{}'".format(ip)
        )
        result = self._sdl_query(filter_query)
        dns_names, agent_names = self._extract_from_sdl(
            result, "event.dns.request", "endpoint.name"
        )
        self.report({
            "dns_names": sorted(dns_names),
            "agent_names": sorted(agent_names),
        })

    def _run_dns_reverse_lookup_dv(self, ip):
        query = (
            'EventType = "DNS Resolved" '
            'AND DNSResponse contains "{}"'.format(ip)
        )
        query_id = self._create_query_and_get_id(query)
        if query_id is None:
            return

        if not self._wait_for_dv_query(query_id):
            return

        dns_names, agent_names = self._extract_from_dv_pages(
            query_id, DNS_REQUEST_RE, AGENT_NAME_RE
        )
        self.report({
            "dns_names": sorted(dns_names),
            "agent_names": sorted(agent_names),
        })

    def run(self):
        if self.service == "dns-lookups":
            if self.data_type not in ("domain", "fqdn", "url"):
                self.not_supported()

            search_data = self.get_data()
            if self.data_type == "url":
                match_obj = URL_RE.match(search_data)
                if match_obj is not None:
                    search_data = match_obj.group(1)
                else:
                    self.not_supported()

            if self.api_mode == "sdl":
                self._run_dns_lookups_sdl(search_data)
            else:
                self._run_dns_lookups_dv(search_data)

        elif self.service == "dns-reverse-lookup":
            if self.data_type != "ip":
                self.not_supported()

            ip = self.get_data()
            if self.api_mode == "sdl":
                self._run_dns_reverse_lookup_sdl(ip)
            else:
                self._run_dns_reverse_lookup_dv(ip)

    def summary(self, raw):
        if self.service == "dns-lookups":
            count = len(raw.get("agent_names", []))
            level = "safe" if count == 0 else "suspicious"
            return {
                "taxonomies": [
                    self.build_taxonomy(level, "S1", "host_count", count)
                ]
            }

        elif self.service == "dns-reverse-lookup":
            dns_count = len(raw.get("dns_names", []))
            host_count = len(raw.get("agent_names", []))
            level = "safe" if (dns_count == 0 and host_count == 0) else "suspicious"
            return {
                "taxonomies": [
                    self.build_taxonomy(level, "S1", "domains", dns_count),
                    self.build_taxonomy(level, "S1", "hosts", host_count),
                ]
            }

        return {}

    def artifacts(self, raw):
        artifacts = []
        for name in raw.get("agent_names", []):
            artifacts.append({"dataType": "hostname", "data": name})
        for name in raw.get("dns_names", []):
            artifacts.append({"dataType": "fqdn", "data": name})
        return artifacts


if __name__ == "__main__":
    SentinelOne().run()
