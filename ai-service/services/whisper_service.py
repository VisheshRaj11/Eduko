"""
Whisper speech-to-text service.
Uses faster-whisper (CTranslate2 backend) — free, local, Python 3.13 compatible.
Much faster than openai-whisper and uses less memory.
"""

from faster_whisper import WhisperModel
import tempfile
import os
import logging
from pydantic_settings import BaseSettings
from functools import lru_cache

logger = logging.getLogger(__name__)


class WhisperSettings(BaseSettings):
    whisper_model: str = "base"  # tiny | base | small | medium | large-v3
    whisper_device: str = "cpu"  # cpu | cuda
    whisper_compute: str = "int8"  # int8 | float16 | float32

    class Config:
        env_file = ".env"


@lru_cache()
def get_model() -> WhisperModel:
    settings = WhisperSettings()
    logger.info(f"Loading faster-whisper model: {settings.whisper_model} on {settings.whisper_device}")
    return WhisperModel(
        settings.whisper_model,
        device=settings.whisper_device,
        compute_type=settings.whisper_compute,
    )


# faster-whisper language codes
LANG_CODES = {"hi": "hi", "pa": "pa", "en": "en"}


async def transcribe_audio(file_bytes: bytes, language: str = "hi") -> str:
    """Transcribe audio bytes using faster-whisper."""
    try:
        model = get_model()
        lang  = LANG_CODES.get(language, "hi")

        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        # faster-whisper returns (segments, info) — we join all segment texts
        segments, info = model.transcribe(tmp_path, language=lang, task="transcribe")
        text = " ".join(seg.text.strip() for seg in segments)

        os.unlink(tmp_path)
        return text.strip()

    except Exception as e:
        logger.error(f"Whisper transcription error: {e}")
        return ""
