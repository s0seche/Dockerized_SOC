from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    elastic_url: str = "http://elasticsearch:9200"
    kibana_url: str = "http://kibana:5601"
    thehive_url: str = "http://thehive:9000"
    cortex_url: str = "http://cortex:9001"

    thehive_username: str = "admin@thehive.local"
    thehive_password: str = "secret"

    kibana_api_key: str = ""
    thehive_api_key: str = ""
    cortex_api_key: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
