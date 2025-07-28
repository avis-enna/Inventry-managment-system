from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/Inventory"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # API Settings
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "Inventory ML Service"
    
    # Environment
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    
    # ML Model Settings
    MODEL_PATH: str = "./models/trained"
    DATA_PATH: str = "./data"
    
    # Prediction Settings
    PREDICTION_CONFIDENCE_THRESHOLD: float = 0.7
    BATCH_SIZE: int = 32
    
    # Cache Settings
    CACHE_TTL: int = 3600  # 1 hour
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
