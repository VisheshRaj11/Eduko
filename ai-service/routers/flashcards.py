from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import google.generativeai as genai
import json
import logging

from services.rag_service import retrieve_context, get_settings, CHAT_MODEL

router = APIRouter()
logger = logging.getLogger(__name__)

class GenerateFlashcardsRequest(BaseModel):
    lesson_id: Optional[str] = None
    subject: Optional[str] = None
    count: int = 10
    prompt: Optional[str] = ""

@router.post("/flashcards/generate")
async def generate_flashcards(req: GenerateFlashcardsRequest):
    try:
        genai.configure(api_key=get_settings().gemini_api_key)

        # Retrieve context if lesson_id or subject is provided
        docs = retrieve_context(req.prompt or req.subject or "flashcards", subject=req.subject, lesson_id=req.lesson_id, k=5)
        context = "\n\n".join(d.page_content for d in docs) if docs else ""
        
        context_block = f"Use this lesson context to generate the flashcards:\n{context}\n\n" if context else ""
        
        prompt = (
            f"Generate a set of educational flashcards. "
            f"Number of flashcards: {req.count}. "
            f"Specific Topic/Prompt: {req.prompt}\n\n"
            f"{context_block}"
            f"Respond EXACTLY in this JSON format. No markdown blocks, just raw JSON:\n"
            """
            {
                "flashcards": [
                    {
                        "front": "Question, concept, or term here.",
                        "back": "Answer, definition, or explanation here."
                    }
                ]
            }
            """
        )

        model = genai.GenerativeModel(
            model_name=CHAT_MODEL,
            generation_config={"response_mime_type": "application/json"}
        )
        
        response = model.generate_content(prompt)
        result_json = json.loads(response.text)
        
        return result_json
    except Exception as e:
        logger.error(f"Flashcards generate error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
