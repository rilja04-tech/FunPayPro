"""
Конфигурация приложения
Загружает переменные из .env файла
"""
from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    """Настройки приложения"""

    # Database — SQLite по умолчанию, не нужен Docker!
    DATABASE_URL: str = "sqlite:///./funpay.db"

    # Security
    SECRET_KEY: str = "change-this-secret-key-in-production-minimum-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ENCRYPTION_KEY: str = "change-this-encryption-key-in-production-32b"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8001
    DEBUG: bool = True

    # External APIs
    FUNPAY_BASE_URL: str = "https://funpay.com"
    FUNPAY_TIMEOUT: int = 15

    # Logging
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

# Глобальный объект настроек
settings = Settings()
