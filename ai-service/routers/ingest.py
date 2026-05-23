"""
ingest_router.py — PDF text extraction + subjects listing endpoints
"""
import os
import tempfile
import logging

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List

import google.generativeai as genai
from services.rag_service import get_collection, _configure_genai

logger = logging.getLogger(__name__)
router = APIRouter()

PDF_EXTRACT_PROMPT = (
    "You are a document OCR engine. Extract ALL text from this PDF document exactly as it appears. "
    "Preserve headings, paragraphs, lists, and tables. "
    "Output ONLY the raw extracted text — no commentary, no markdown, no extra formatting."
)


@router.post("/extract-pdf-text")
async def extract_pdf_text(image: UploadFile = File(...)):
    """
    Accept a PDF file and return its extracted plain text using Gemini Vision.
    Called internally by IngestLessonJob to process PDF lessons.
    """
    try:
        _configure_genai()

        contents = await image.read()
        suffix = os.path.splitext(image.filename or "upload.pdf")[1] or ".pdf"

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        mime = "application/pdf" if suffix.lower() == ".pdf" else "image/jpeg"
        uploaded_file = genai.upload_file(path=tmp_path, mime_type=mime)

        model = genai.GenerativeModel("gemini-flash-lite-latest")
        response = model.generate_content([PDF_EXTRACT_PROMPT, uploaded_file])

        os.unlink(tmp_path)
        return {"text": response.text.strip()}

    except Exception as e:
        logger.error(f"PDF text extraction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/subjects")
async def list_subjects():
    """
    Return the list of unique subjects currently stored in the ChromaDB vector store.
    Used by the frontend to populate the subject selector in the AI chat.
    """
    try:
        collection = get_collection()
        # Fetch all metadata (limit to 1000 entries to extract unique subjects)
        result = collection.get(include=["metadatas"], limit=1000)
        subjects = set()
        for meta in (result.get("metadatas") or []):
            subj = meta.get("subject", "").strip()
            if subj:
                subjects.add(subj)
        return {"subjects": sorted(subjects)}
    except Exception as e:
        logger.error(f"subjects list error: {e}")
        return {"subjects": []}

@router.delete("/{lesson_id}")
async def delete_lesson(lesson_id: str):
    """
    Remove all document chunks associated with a specific lesson_id from ChromaDB.
    Called by the Laravel backend when a teacher deletes a lesson.
    """
    try:
        collection = get_collection()
        collection.delete(where={"lesson_id": lesson_id})
        return {"message": f"Successfully deleted vectors for lesson {lesson_id}"}
    except Exception as e:
        logger.error(f"Error deleting lesson {lesson_id} from ChromaDB: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{lesson_id}")
async def get_lesson_content(lesson_id: str):
    """
    Fetch all document chunks associated with a specific lesson_id and format them as beautiful Markdown.
    """
    try:
        collection = get_collection()
        results = collection.get(where={"lesson_id": lesson_id})
        documents = results.get("documents", [])
        if not documents:
            return {"content": "No content found in the AI database for this lesson."}
        
        # Join chunks together
        combined_text = "\n\n".join(documents)
        
        # Use Gemini to format the raw text into beautiful Markdown
        _configure_genai()
        model = genai.GenerativeModel("gemini-flash-lite-latest")
        prompt = (
            "You are an expert educational content designer. Take the following raw lesson text and format it into a "
            "beautiful, highly readable Markdown document. Add clear headings (##), use bullet points, and highlight "
            "**important terms and concepts** in bold so they stand out. Do not change the factual meaning, just make "
            "it visually structured and easy for a student to study.\n\n"
            f"TEXT:\n{combined_text}"
        )
        response = model.generate_content(prompt)
        formatted_markdown = response.text.strip()
        
        return {"content": formatted_markdown}
    except Exception as e:
        logger.error(f"Error fetching lesson {lesson_id} from ChromaDB: {e}")
        raise HTTPException(status_code=500, detail=str(e))
