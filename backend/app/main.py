from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import health, alerts, rules, dashboards, soc

app = FastAPI(title="SOC Central Dashboard", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(alerts.router)
app.include_router(rules.router)
app.include_router(dashboards.router)
app.include_router(soc.router)
