import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Base directory for the project root and OCR folder
BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent

# Load .env file from project root or ocr directory
load_dotenv(PROJECT_ROOT / ".env")
load_dotenv(BASE_DIR / ".env")

# API Keys
GEMINI_API_KEY = os.getenv("VITE_GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY") or ""

# Settings
DEFAULT_PROMO_TYPE = "JSM"
DEFAULT_CATEGORY = "Katalog Promo"
DEFAULT_STOCK_STATUS = "Tersedia"
