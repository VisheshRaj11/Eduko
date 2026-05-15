from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.rag_service import answer_question, ingest_lesson
from services import rag_service
from typing import Optional

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    language: str = "hi"
    user_id: str = "anonymous"
    history: list[dict] = []


class ChatResponse(BaseModel):
    response: str
    language: str


class IngestRequest(BaseModel):
    lesson_id: str
    title: str
    content: str
    subject: Optional[str] = None
    language: Optional[str] = "hi"


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """AI Tutor chat endpoint with RAG pipeline."""
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    response = await answer_question(
        message=req.message,
        language=req.language,
        user_id=req.user_id,
        history=req.history,
    )

    return ChatResponse(response=response, language=req.language)


@router.post("/ingest")
async def ingest(req: IngestRequest):
    """Ingest a lesson into the vector store for RAG."""
    count = await ingest_lesson(
        lesson_id=req.lesson_id,
        title=req.title,
        content=req.content,
        metadata={"subject": req.subject or "", "language": req.language or "hi"},
    )
    return {"chunks_ingested": count, "lesson_id": req.lesson_id}
