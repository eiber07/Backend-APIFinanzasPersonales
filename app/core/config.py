from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL") # Cargo la variable de entorno DATABASE_URL desde el archivo .env