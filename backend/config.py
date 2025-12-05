# backend/config.py
from pydantic_settings import BaseSettings
from pathlib import Path

BASE_DIR = Path(__file__).parent

class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:postgres@postgres:5432/house_tasks_db"
    jwt_secret: str = "your_super_secret_jwt_key_change_in_production"
    
    class Config:
        env_file = BASE_DIR / ".env"
        case_sensitive = False

# Создаем глобальный экземпляр
settings = Settings()

# Для обратной совместимости оставляем функцию
def get_settings():
    return settings