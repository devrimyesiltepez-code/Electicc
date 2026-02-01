from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./data/app.db"
    app_password: str | None = None
    cors_origin: str = "http://localhost:5173"


settings = Settings()
