"""
translate.py — Multilingual Content Engine
Translates and simplifies educational content using Gemini 2.5 Flash.
Supports English, Hindi, and Punjabi with grade-appropriate simplification
and rural Indian context examples.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from services.rag_service import LANGUAGE_NAMES
import google.generativeai as genai
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Full language names for script guidance
LANGUAGE_SCRIPT_NOTES = {
    "hi": "Hindi (Devanagari script)",
    "pa": "Punjabi (Gurmukhi script)",
    "en": "English (Latin script)",
}


# ── Pydantic models ───────────────────────────────────────────────────────────

class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    target_language: str = Field(default="hi", pattern="^(hi|pa|en)$")
    grade_level: int = Field(default=8, ge=5, le=12)
    simplify: bool = True


class TranslateResponse(BaseModel):
    translated_text: str
    language: str
    grade_level: int


class TranslateLessonRequest(BaseModel):
    title: str = Field(..., min_length=1)
    content: str = Field(..., min_length=1, max_length=10000)
    target_language: str = Field(default="hi", pattern="^(hi|pa|en)$")
    grade_level: int = Field(default=8, ge=5, le=12)


class TranslateLessonResponse(BaseModel):
    title: str
    content: str
    language: str


# ── Shared helper ─────────────────────────────────────────────────────────────

def _build_translate_prompt(
    text: str,
    target_language: str,
    grade_level: int,
    simplify: bool,
    is_title: bool = False,
) -> str:
    lang_full = LANGUAGE_SCRIPT_NOTES.get(target_language, "Hindi (Devanagari script)")
    lang_name = LANGUAGE_NAMES.get(target_language, "Hindi")

    reading_level = "simple words a Class 5-6 student understands" if grade_level <= 7 \
        else "clear words a Class 8-10 student can follow" if grade_level <= 10 \
        else "standard academic language for Class 11-12"

    simplify_block = f"""
SIMPLIFICATION RULES (apply all):
- Use {reading_level}.
- Replace technical jargon with common everyday words.
- Keep sentences short (under 15 words each).
- Use relatable examples from rural Indian life (e.g., farming, village markets, rivers, crops, festivals).
- Break long sentences into two shorter ones.
- Maintain the educational meaning exactly.
""" if simplify else ""

    item_type = "title" if is_title else "educational text"

    return f"""You are an expert multilingual educational translator for Indian school students (Grade {grade_level}).

TASK: Translate the following {item_type} to {lang_full}.
{simplify_block}
CRITICAL RULES:
- Return ONLY the translated {item_type}. No explanations, no notes, no "Translation:" prefix.
- Write in proper {lang_name} using the correct script ({lang_full}).
- Preserve all numbers and proper nouns (names of places, people) as-is or transliterate them.
- Do NOT skip any part of the text.
- Do NOT add markdown formatting.

{item_type.upper()} TO TRANSLATE:
{text}

TRANSLATED {item_type.upper()}:"""


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/translate", response_model=TranslateResponse)
async def translate(req: TranslateRequest):
    """
    Translate and optionally simplify educational text.
    Supports hi (Hindi), pa (Punjabi), en (English).
    Automatically adapts vocabulary to the given grade level.
    """
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="text cannot be empty")

    prompt = _build_translate_prompt(
        text=req.text,
        target_language=req.target_language,
        grade_level=req.grade_level,
        simplify=req.simplify,
    )

    try:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))
        model = genai.GenerativeModel(model_name="gemini-flash-lite-latest")
        result = model.generate_content(prompt)
        translated = result.text.strip()
    except Exception as e:
        logger.error(f"Translation error: {e}")
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")

    return TranslateResponse(
        translated_text=translated,
        language=req.target_language,
        grade_level=req.grade_level,
    )


@router.post("/translate-lesson", response_model=TranslateLessonResponse)
async def translate_lesson(req: TranslateLessonRequest):
    """
    Translate a full lesson (title + content) to the target language.
    Simplifies content to be grade-appropriate with rural Indian context.
    """
    if not req.content.strip():
        raise HTTPException(status_code=400, detail="content cannot be empty")

    try:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))
        model = genai.GenerativeModel(model_name="gemini-flash-lite-latest")

        # Translate title
        title_prompt = _build_translate_prompt(
            text=req.title,
            target_language=req.target_language,
            grade_level=req.grade_level,
            simplify=True,
            is_title=True,
        )
        title_result = model.generate_content(title_prompt)
        translated_title = title_result.text.strip()

        # Translate content
        content_prompt = _build_translate_prompt(
            text=req.content,
            target_language=req.target_language,
            grade_level=req.grade_level,
            simplify=True,
            is_title=False,
        )
        content_result = model.generate_content(content_prompt)
        translated_content = content_result.text.strip()

    except Exception as e:
        logger.error(f"Lesson translation error: {e}")
        raise HTTPException(status_code=500, detail=f"Lesson translation failed: {str(e)}")

    return TranslateLessonResponse(
        title=translated_title,
        content=translated_content,
        language=req.target_language,
    )
