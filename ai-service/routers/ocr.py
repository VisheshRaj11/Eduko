from fastapi import APIRouter, UploadFile, File, Form
from pydantic import BaseModel
from services.ocr_service import extract_text

router = APIRouter()


class OCRResponse(BaseModel):
    text: str
    language: str


@router.post("/ocr", response_model=OCRResponse)
async def ocr(
    image: UploadFile = File(...),
    language: str = Form(default="hi"),
):
    """Extract text from uploaded image (handwritten/printed) using Tesseract OCR."""
    file_bytes = await image.read()
    text = await extract_text(file_bytes, language)
    return OCRResponse(text=text, language=language)
