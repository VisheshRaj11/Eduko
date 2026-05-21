"""
ocr.py — Handwritten OCR Router using Gemini Vision
Extracts text and equations from handwritten or printed images.
Supports multipart uploads and base64 JSON input.
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

OCR_PROMPT = """Extract all text from this handwritten or printed image.

Instructions:
1. Read every word carefully, including faint or unclear handwriting.
2. If there are mathematical equations or expressions, format them clearly using standard notation (e.g., x^2 + 3x - 5 = 0).
3. Preserve the original order of content (top to bottom, left to right).
4. Separate different sections clearly.

Return your response in EXACTLY this format (no extra text before or after):
TEXT: [all extracted text here, preserving line breaks]
EQUATIONS: [list each equation on a separate line, or write "None" if no equations found]"""

SUPPORTED_IMAGE_MIME_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/tiff",
}


# ── Settings ──────────────────────────────────────────────────────────────────

class _Settings(BaseSettings):
    gemini_api_key: str = ""

    class Config:
        env_file = ".env"


def _get_api_key() -> str:
    s = _Settings()
    key = s.gemini_api_key or os.getenv("GEMINI_API_KEY", "")
    if not key:
        raise RuntimeError("GEMINI_API_KEY not configured")
    return key


# ── Pydantic models ───────────────────────────────────────────────────────────

class OCRResponse(BaseModel):
    text: str
    language: str
    confidence: str = "high"
    structured: bool = True


class OCRJsonRequest(BaseModel):
    image_base64: str
    mime_type: str = "image/jpeg"


class OCRJsonResponse(BaseModel):
    text: str
    equations: list[str]
    answers: list[str]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _detect_language_from_text(text: str) -> str:
    """Heuristic language detection from OCR output."""
    devanagari = sum(1 for c in text if "\u0900" <= c <= "\u097f")
    gurmukhi = sum(1 for c in text if "\u0a00" <= c <= "\u0a7f")
    if gurmukhi > devanagari and gurmukhi > 0:
        return "pa"
    if devanagari > 0:
        return "hi"
    return "en"


def _parse_ocr_response(raw: str) -> dict:
    """
    Parse the structured OCR response from Gemini.
    Expected format:
        TEXT: ...
        EQUATIONS: ...
    """
    text_part = ""
    equations_part = ""

    raw = raw.strip()

    # Split on EQUATIONS: marker
    if "EQUATIONS:" in raw:
        parts = raw.split("EQUATIONS:", 1)
        text_section = parts[0]
        equations_section = parts[1].strip()
    else:
        text_section = raw
        equations_section = "None"

    # Extract text content
    if "TEXT:" in text_section:
        text_part = text_section.split("TEXT:", 1)[1].strip()
    else:
        text_part = text_section.strip()

    # Parse equations list
    equations: list[str] = []
    if equations_section.lower() not in ("none", "none.", "", "-", "n/a"):
        for line in equations_section.split("\n"):
            line = line.strip().lstrip("-•*0123456789.) ")
            if line:
                equations.append(line)

    # Extract answers from the text (look for = ... patterns in equations)
    answers: list[str] = []
    for eq in equations:
        if "=" in eq:
            rhs = eq.split("=")[-1].strip()
            if rhs and rhs not in ("0", ""):
                answers.append(rhs)

    return {
        "text": text_part,
        "equations": equations,
        "answers": answers,
    }


def _run_ocr_on_bytes(image_bytes: bytes, mime_type: str) -> str:
    """
    Upload image to Gemini File API and run OCR.
    Returns raw Gemini response text.
    """
    api_key = _get_api_key()
    genai.configure(api_key=api_key)

    ext_map = {
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/png": ".png",
        "image/gif": ".gif",
        "image/webp": ".webp",
        "image/bmp": ".bmp",
        "image/tiff": ".tiff",
    }
    ext = ext_map.get(mime_type.lower(), ".jpg")
    # Normalise to a supported MIME type for the API
    canonical = "image/jpeg" if mime_type in ("image/jpg",) else mime_type

    tmp_path = None
    uploaded_file = None
    try:
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp.write(image_bytes)
            tmp_path = tmp.name

        uploaded_file = genai.upload_file(path=tmp_path, mime_type=canonical)

        model = genai.GenerativeModel("gemini-2.5-flash-preview-04-17")
        response = model.generate_content([OCR_PROMPT, uploaded_file])
        return response.text.strip()

    finally:
        if uploaded_file:
            try:
                genai.delete_file(uploaded_file.name)
            except Exception:
                pass
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/ocr", response_model=OCRResponse)
async def ocr(image: UploadFile = File(...)):
    """
    Extract text from a handwritten or printed image using Gemini Vision.
    Returns extracted text, detected language, and whether structure was found.
    """
    content_type = (image.content_type or "image/jpeg").lower()
    if content_type not in SUPPORTED_IMAGE_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported image type '{content_type}'. "
                   f"Supported: {sorted(SUPPORTED_IMAGE_MIME_TYPES)}",
        )

    try:
        image_bytes = await image.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Uploaded image file is empty")

        raw_response = _run_ocr_on_bytes(image_bytes, content_type)

        if not raw_response:
            raise HTTPException(status_code=422, detail="No text detected in the image")

        parsed = _parse_ocr_response(raw_response)
        detected_lang = _detect_language_from_text(parsed["text"])

        return OCRResponse(
            text=parsed["text"],
            language=detected_lang,
            confidence="high",
            structured=bool(parsed["equations"]),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OCR error: {e}")
        raise HTTPException(status_code=500, detail=f"OCR failed: {str(e)}")


@router.post("/ocr-json", response_model=OCRJsonResponse)
async def ocr_json(req: OCRJsonRequest):
    """
    Extract text and equations from a base64-encoded image.
    Returns structured output with text, equations list, and derived answers.
    """
    if not req.image_base64.strip():
        raise HTTPException(status_code=400, detail="image_base64 cannot be empty")

    try:
        try:
            image_bytes = base64.b64decode(req.image_base64)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid base64 image data: {e}")

        raw_response = _run_ocr_on_bytes(image_bytes, req.mime_type)

        if not raw_response:
            raise HTTPException(status_code=422, detail="No text detected in the image")

        parsed = _parse_ocr_response(raw_response)
        return OCRJsonResponse(
            text=parsed["text"],
            equations=parsed["equations"],
            answers=parsed["answers"],
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OCR-JSON error: {e}")
        raise HTTPException(status_code=500, detail=f"OCR failed: {str(e)}")
