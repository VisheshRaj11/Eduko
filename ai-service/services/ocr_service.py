"""
OCR service using Tesseract (free, local).
Extracts text from student-uploaded handwritten/printed images.
"""

import pytesseract
from PIL import Image
import io
import os
import logging
from pydantic_settings import BaseSettings
from functools import lru_cache

logger = logging.getLogger(__name__)


class OCRSettings(BaseSettings):
    tesseract_cmd: str = "tesseract"
    class Config: env_file = ".env"


@lru_cache()
def configure_tesseract():
    settings = OCRSettings()
    if settings.tesseract_cmd != "tesseract":
        pytesseract.pytesseract.tesseract_cmd = settings.tesseract_cmd


# Language map: Tesseract lang codes
TESS_LANGS = {
    "en": "eng",
    "hi": "hin",
    "pa": "pan",
}


async def extract_text(image_bytes: bytes, language: str = "hi") -> str:
    """Extract text from image bytes using Tesseract OCR."""
    try:
        configure_tesseract()
        lang  = TESS_LANGS.get(language, "hin")
        image = Image.open(io.BytesIO(image_bytes))

        # Pre-process: convert to grayscale for better accuracy
        image = image.convert("L")

        text = pytesseract.image_to_string(image, lang=lang)
        return text.strip()

    except Exception as e:
        logger.error(f"OCR error: {e}")
        return ""
