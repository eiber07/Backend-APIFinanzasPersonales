from dotenv import load_dotenv
import os
from pydantic_settings import BaseSettings

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL") # Cargo la variable de entorno DATABASE_URL desde el archivo .env

class Settings(BaseSettings):
    DATABASE_URL: str
    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: str
    MAIL_PORT: int
    MAIL_SERVER: str
    MAIL_FROM_NAME: str
    FORGET_PWD_SECRET_KEY: str
    ALGORITHM: str
    FORGET_PASSWORD_LINK_EXPIRE_MINUTES: int
    APP_HOST: str
    FRONTEND_URL: str


    class Config:
        env_file = ".env"

settings = Settings()