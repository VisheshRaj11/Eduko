from fastapi import APIRouter, UploadFile, File, Form
from pydantic import BaseModel
from services.whisper_service import transcribe_audio

router = APIRouter()


class SpeechResponse(BaseModel):
    text: str
    language: str


@router.post("/speech-to-text", response_model=SpeechResponse)
async def speech_to_text(
    audio: UploadFile = File(...),
    language: str = Form(default="hi"),
):
    """Convert speech audio to text using Whisper (local, free)."""
    file_bytes = await audio.read()
    text = await transcribe_audio(file_bytes, language)
    return SpeechResponse(text=text, language=language)
