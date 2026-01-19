from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    groq_api_key: str = ""
    mongodb_uri: str = "mongodb://mongodb:27017/leblebbot"
    redis_url: str = "redis://redis:6379"
    chroma_host: str = "chromadb"
    chroma_port: int = 8000
    evolution_api_url: str = "http://evolution-api:8080"
    evolution_api_key: str = ""
    jwt_secret: str = ""
    api_key: str = ""

    class Config:
        env_file = [".env", "env.example"]
        case_sensitive = False


def get_settings() -> Settings:
    return Settings()
