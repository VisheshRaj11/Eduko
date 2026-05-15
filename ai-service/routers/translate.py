from fastapi import APIRouter
from pydantic import BaseModel
from services.rag_service import get_llm, LANGUAGE_NAMES

router = APIRouter()


class TranslateRequest(BaseModel):
    text: str
    target: str = "hi"  # en | hi | pa
    simplify: bool = False


class TranslateResponse(BaseModel):
    translated: str
    target: str


@router.post("/translate", response_model=TranslateResponse)
async def translate(req: TranslateRequest):
    """Translate and optionally simplify educational content."""

    lang_name = LANGUAGE_NAMES.get(req.target, "Hindi")
    simplify_note = "Also simplify the language for a school student. Use simple words." if req.simplify else ""

    prompt = f"""Translate the following educational text to {lang_name}.
{simplify_note}
Only return the translated text, nothing else.

Text: {req.text}"""

    llm    = get_llm()
    result = llm.invoke(prompt)
    translated = result.content if hasattr(result, "content") else str(result)

    return TranslateResponse(translated=translated.strip(), target=req.target)
