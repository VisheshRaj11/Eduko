"""
content_service.py — Content Translation and Simplification Service
Provides translation, exercise generation, and content simplification
using Gemini 2.5 Flash via LangChain.

Functions:
- translate_content: Translate + simplify text for a grade level
- generate_exercises: Generate practice questions for a topic
- simplify_for_grade: Rewrite content at a given grade level
"""

import json
import logging
from functools import lru_cache

from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)

LANGUAGE_NAMES = {"en": "English", "hi": "Hindi", "pa": "Punjabi"}

LANGUAGE_SCRIPT_NOTES = {
    "hi": "Hindi written in Devanagari script",
    "pa": "Punjabi written in Gurmukhi script",
    "en": "English",
}


# ── Settings ──────────────────────────────────────────────────────────────────

class _Settings(BaseSettings):
    gemini_api_key: str = ""

    class Config:
        env_file = ".env"


@lru_cache()
def _get_settings() -> _Settings:
    return _Settings()


def _get_llm() -> ChatGoogleGenerativeAI:
    s = _get_settings()
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash-preview-04-17",
        google_api_key=s.gemini_api_key,
        temperature=0.3,
        max_tokens=2048,
    )


# ── Helpers ───────────────────────────────────────────────────────────────────

def _clean_json(raw: str) -> str:
    """Strip markdown code fences from LLM output."""
    raw = raw.strip()
    if raw.startswith("```"):
        lines = raw.split("\n")
        inner = lines[1:] if lines[0].startswith("```") else lines
        if inner and inner[-1].strip() == "```":
            inner = inner[:-1]
        raw = "\n".join(inner).strip()
    return raw


def _grade_reading_level(grade_level: int) -> str:
    if grade_level <= 6:
        return "very simple words that a 10-12 year old in a rural Indian village would understand"
    if grade_level <= 8:
        return "clear and simple words appropriate for a Class 7-8 student"
    if grade_level <= 10:
        return "standard language suitable for a Class 9-10 student"
    return "academic language appropriate for Class 11-12"


# ── Public API ────────────────────────────────────────────────────────────────

def translate_content(text: str, target_lang: str, grade_level: int) -> str:
    """
    Translate and simplify educational content for a given grade level.

    Args:
        text: Source text to translate (any language).
        target_lang: Target language code ("hi", "pa", "en").
        grade_level: Grade level integer (5–12).

    Returns:
        Translated and simplified string.
    """
    lang_full = LANGUAGE_SCRIPT_NOTES.get(target_lang, "Hindi written in Devanagari script")
    reading_level = _grade_reading_level(grade_level)

    prompt = f"""You are a bilingual educational content specialist for Indian schools.

TASK: Translate and simplify the following text into {lang_full} for a Grade {grade_level} student.

SIMPLIFICATION RULES:
- Use {reading_level}.
- Replace technical jargon with everyday language.
- Keep sentences short (max 15 words each).
- Use examples from rural Indian life (farming, rivers, village markets, festivals) where helpful.
- Preserve all numbers and proper nouns (transliterate names if needed).
- Do NOT skip any part of the original meaning.

Return ONLY the translated text. No explanations, no labels, no markdown.

TEXT TO TRANSLATE:
{text}

TRANSLATED TEXT:"""

    try:
        llm = _get_llm()
        result = llm.invoke(prompt)
        return (result.content if hasattr(result, "content") else str(result)).strip()
    except Exception as e:
        logger.error(f"translate_content error: {e}")
        raise RuntimeError(f"Translation failed: {e}") from e


def generate_exercises(
    topic: str,
    grade_level: int,
    language: str,
    count: int = 5,
) -> list:
    """
    Generate practice questions for a given topic and grade level.

    Args:
        topic: Subject topic (e.g. "Linear Equations", "Photosynthesis").
        grade_level: Grade level integer (5–12).
        language: Language code ("hi", "pa", "en").
        count: Number of questions to generate (default 5).

    Returns:
        List of question dicts:
        [{"question": str, "type": str, "options": list[str] | None, "answer": str, "explanation": str}]
    """
    lang_name = LANGUAGE_NAMES.get(language, "Hindi")
    reading_level = _grade_reading_level(grade_level)
    count = max(1, min(count, 20))  # clamp between 1 and 20

    prompt = f"""You are a skilled Indian school teacher creating practice questions.

TOPIC: {topic}
GRADE LEVEL: Class {grade_level}
LANGUAGE: {lang_name}
NUMBER OF QUESTIONS: {count}

Create exactly {count} practice questions. Mix question types:
- "mcq": Multiple-choice with 4 options (A, B, C, D). Provide the correct answer letter.
- "short": Short answer question (1-2 sentence answer expected).
- "fill": Fill-in-the-blank sentence.

Rules:
- Use {reading_level}.
- Questions must be directly relevant to {topic}.
- Use examples from rural Indian life where possible (farming, daily life, local scenarios).
- For MCQ, make sure only ONE option is clearly correct.
- Provide a brief explanation (1-2 sentences) for each answer.
- All output must be in {lang_name}.

Return ONLY valid JSON array (no markdown):
[
  {{
    "question": "...",
    "type": "mcq",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "answer": "A",
    "explanation": "..."
  }},
  {{
    "question": "...",
    "type": "short",
    "options": null,
    "answer": "...",
    "explanation": "..."
  }}
]"""

    try:
        llm = _get_llm()
        result = llm.invoke(prompt)
        content = result.content if hasattr(result, "content") else str(result)
        content = _clean_json(content)
        exercises = json.loads(content)

        if not isinstance(exercises, list):
            raise ValueError("Expected JSON array of exercises")

        # Normalise each exercise dict
        normalised = []
        for ex in exercises:
            normalised.append({
                "question": ex.get("question", ""),
                "type": ex.get("type", "short"),
                "options": ex.get("options"),
                "answer": ex.get("answer", ""),
                "explanation": ex.get("explanation", ""),
            })
        return normalised

    except (json.JSONDecodeError, ValueError, Exception) as e:
        logger.error(f"generate_exercises error: {e}")
        # Fallback: return generic placeholder questions
        return [
            {
                "question": f"What is the main concept of {topic}?",
                "type": "short",
                "options": None,
                "answer": f"The main concept relates to the core principles of {topic}.",
                "explanation": "Review your textbook chapter on this topic for the full answer.",
            }
            for _ in range(min(count, 3))
        ]


def simplify_for_grade(text: str, grade_level: int, language: str) -> str:
    """
    Rewrite existing content to be appropriate for a specific grade level
    without translating — stays in the same language.

    Args:
        text: Original educational text.
        grade_level: Target grade level (5–12).
        language: Language code ("hi", "pa", "en").

    Returns:
        Simplified string in the same language.
    """
    lang_name = LANGUAGE_NAMES.get(language, "English")
    reading_level = _grade_reading_level(grade_level)

    prompt = f"""You are an expert at simplifying educational content for Indian school students.

TASK: Rewrite the following text in {lang_name} so it is easy to understand for a Grade {grade_level} student.

RULES:
- Keep the SAME language ({lang_name}) — do NOT translate to another language.
- Use {reading_level}.
- Break long sentences into shorter ones (max 15 words each).
- Replace difficult words with simpler synonyms.
- Use relatable examples from everyday rural Indian life where helpful.
- Preserve all facts, data, and key concepts — do NOT omit important information.
- Keep the same structure (paragraphs, lists, etc.) as the original.
- Do NOT add markdown formatting.

Return ONLY the simplified text. No labels or explanations.

ORIGINAL TEXT:
{text}

SIMPLIFIED TEXT:"""

    try:
        llm = _get_llm()
        result = llm.invoke(prompt)
        return (result.content if hasattr(result, "content") else str(result)).strip()
    except Exception as e:
        logger.error(f"simplify_for_grade error: {e}")
        raise RuntimeError(f"Simplification failed: {e}") from e
