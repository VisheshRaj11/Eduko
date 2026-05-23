"""
speech.py — Speech-to-Text Router using Gemini Multimodal
Accepts audio files (wav/mp3/webm) and transcribes them via Gemini 2.5 Flash.
Supports Hindi (Devanagari), Punjabi (Gurmukhi), and English.
"""

import os
import base64
import logging
import tempfile
from typing import Optional

import google.generativeai as genai
from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel
from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)

router = APIRouter()

TRANSCRIPTION_PROMPT = (
    "Transcribe this audio accurately. "
    "Return ONLY the transcribed text in the original language spoken. "
    "If the speaker is using Hindi, return text in Devanagari script (हिन्दी). "
    "If the speaker is using Punjabi, return text in Gurmukhi script (ਪੰਜਾਬੀ). "
    "If the speaker is using English, return in English. "
    "Do NOT add any explanation, translation, or commentary — only the transcription."
)

SUPPORTED_AUDIO_MIME_TYPES = {
    "audio/wav": "audio/wav",
    "audio/x-wav": "audio/wav",
    "audio/wave": "audio/wav",
    "audio/mpeg": "audio/mpeg",
    "audio/mp3": "audio/mpeg",
    "audio/webm": "audio/webm",
    "audio/ogg": "audio/ogg",
    "audio/flac": "audio/flac",
    "audio/m4a": "audio/mp4",
    "audio/mp4": "audio/mp4",
}


# ── Settings ──────────────────────────────────────────────────────────────────

class _Settings(BaseSettings):
    gemini_api_key: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


def _get_api_key() -> str:
    s = _Settings()
    key = s.gemini_api_key or os.getenv("GEMINI_API_KEY", "")
    if not key:
        raise RuntimeError("GEMINI_API_KEY not configured")
    return key


# ── Pydantic models ───────────────────────────────────────────────────────────

class SpeechToTextResponse(BaseModel):
    text: str
    language: str
    confidence: str = "high"          # Gemini doesn't expose raw confidence scores


class SpeechJSONRequest(BaseModel):
    audio_base64: str
    mime_type: str = "audio/wav"
    language_hint: Optional[str] = None   # hi | pa | en (informational only)


class SpeechJSONResponse(BaseModel):
    text: str
    language: str


# ── Core Gemini transcription ─────────────────────────────────────────────────

def _detect_language_from_text(text: str) -> str:
    """Heuristic language detection from transcription output."""
    # Devanagari Unicode range: 0900–097F
    devanagari = sum(1 for c in text if "\u0900" <= c <= "\u097f")
    # Gurmukhi Unicode range: 0A00–0A7F
    gurmukhi = sum(1 for c in text if "\u0a00" <= c <= "\u0a7f")
    if gurmukhi > devanagari and gurmukhi > 0:
        return "pa"
    if devanagari > 0:
        return "hi"
    return "en"


def _transcribe_bytes(audio_bytes: bytes, mime_type: str) -> str:
    """
    Upload audio bytes to Gemini File API and transcribe.
    Uses a temporary file because Gemini SDK requires a file path or file-like object.
    """
    api_key = _get_api_key()
    genai.configure(api_key=api_key)

    # Normalise MIME type
    canonical_mime = SUPPORTED_AUDIO_MIME_TYPES.get(mime_type, mime_type)

    # Determine file extension
    ext_map = {
        "audio/wav": ".wav",
        "audio/mpeg": ".mp3",
        "audio/webm": ".webm",
        "audio/ogg": ".ogg",
        "audio/flac": ".flac",
        "audio/mp4": ".m4a",
    }
    ext = ext_map.get(canonical_mime, ".wav")

    # Write to a temp file, upload, then clean up
    tmp_path = None
    uploaded_file = None
    try:
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        uploaded_file = genai.upload_file(path=tmp_path, mime_type=canonical_mime)

        model = genai.GenerativeModel("gemini-flash-lite-latest")
        response = model.generate_content([TRANSCRIPTION_PROMPT, uploaded_file])
        return response.text.strip()

    finally:
        if uploaded_file:
            try:
                genai.delete_file(uploaded_file.name)
            except Exception:
                pass
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)


def _transcribe_base64(audio_base64: str, mime_type: str) -> str:
    """Decode base64 audio and transcribe."""
    try:
        audio_bytes = base64.b64decode(audio_base64)
    except Exception as e:
        raise ValueError(f"Invalid base64 audio data: {e}")
    return _transcribe_bytes(audio_bytes, mime_type)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/speech-to-text", response_model=SpeechToTextResponse)
async def speech_to_text(audio: UploadFile = File(...)):
    """
    Transcribe uploaded audio file (wav/mp3/webm) using Gemini multimodal.
    Returns transcription with detected language code.
    """
    # Validate file type
    content_type = (audio.content_type or "audio/wav").lower()
    if content_type not in SUPPORTED_AUDIO_MIME_TYPES and not content_type.startswith("audio/"):
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported media type '{content_type}'. "
                   f"Supported: {list(SUPPORTED_AUDIO_MIME_TYPES.keys())}",
        )

    try:
        audio_bytes = await audio.read()
        if not audio_bytes:
            raise HTTPException(status_code=400, detail="Uploaded audio file is empty")

        transcript = _transcribe_bytes(audio_bytes, content_type)

        if not transcript:
            raise HTTPException(status_code=422, detail="No speech detected in the audio")

        detected_lang = _detect_language_from_text(transcript)
        return SpeechToTextResponse(
            text=transcript,
            language=detected_lang,
            confidence="high",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Speech-to-text error: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


@router.post("/speech-json", response_model=SpeechJSONResponse)
async def speech_json(req: SpeechJSONRequest):
    """
    Transcribe audio provided as a base64-encoded string.
    Useful when the client cannot send multipart form data.
    """
    if not req.audio_base64.strip():
        raise HTTPException(status_code=400, detail="audio_base64 cannot be empty")

    try:
        transcript = _transcribe_base64(req.audio_base64, req.mime_type)

        if not transcript:
            raise HTTPException(status_code=422, detail="No speech detected in the audio")

        detected_lang = _detect_language_from_text(transcript)
        return SpeechJSONResponse(text=transcript, language=detected_lang)

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Speech-JSON error: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
