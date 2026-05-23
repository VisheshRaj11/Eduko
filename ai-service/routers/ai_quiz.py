from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import google.generativeai as genai
import json
import logging

from services.rag_service import retrieve_context, get_settings, CHAT_MODEL

router = APIRouter()
logger = logging.getLogger(__name__)

class GenerateQuizRequest(BaseModel):
    subject: str
    count: int = 5
    type: str = "mcq" # mcq or subjective
    difficulty: str = "medium"
    prompt: Optional[str] = ""

class AnswerItem(BaseModel):
    question: str
    answer: str
    correct_answer: Optional[str] = ""

class EvaluateQuizRequest(BaseModel):
    subject: str
    type: str = "mcq"
    qa_pairs: List[AnswerItem]

@router.post("/quiz/generate")
async def generate_quiz(req: GenerateQuizRequest):
    try:
        genai.configure(api_key=get_settings().gemini_api_key)
        
        # Retrieve context if subject is provided
        docs = retrieve_context(req.prompt or req.subject, subject=req.subject, k=3)
        context = "\n\n".join(d.page_content for d in docs) if docs else ""
        
        context_block = f"Use this context if relevant:\n{context}\n\n" if context else ""
        
        prompt = (
            f"Generate a quiz for {req.subject} subject. "
            f"Number of questions: {req.count}. "
            f"Type: {req.type}. "
            f"Difficulty: {req.difficulty}. "
            f"User Prompt/Topic: {req.prompt}\n\n"
            f"{context_block}"
            f"Respond EXACTLY in this JSON format. No markdown blocks, just raw JSON.\n"
        )

        if req.type == "mcq":
            prompt += """
            {
                "questions": [
                    {
                        "question": "Question text here",
                        "options": ["Option A", "Option B", "Option C", "Option D"],
                        "answer": "Option A"
                    }
                ]
            }
            """
        else:
            prompt += """
            {
                "questions": [
                    {
                        "question": "Subjective question text here"
                    }
                ]
            }
            """

        model = genai.GenerativeModel(
            model_name=CHAT_MODEL,
            generation_config={"response_mime_type": "application/json"}
        )
        
        response = model.generate_content(prompt)
        result_json = json.loads(response.text)
        
        return result_json
    except Exception as e:
        logger.error(f"Quiz generate error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/quiz/evaluate")
async def evaluate_quiz(req: EvaluateQuizRequest):
    try:
        genai.configure(api_key=get_settings().gemini_api_key)
        
        qa_data = [{"question": q.question, "student_answer": q.answer, "reference_answer": q.correct_answer} for q in req.qa_pairs]
        
        prompt = (
            f"You are evaluating a student's {req.type} quiz for the subject '{req.subject}'.\n"
            f"Here are the questions, the student's answers, and reference correct answers (if applicable):\n"
            f"{json.dumps(qa_data, indent=2)}\n\n"
            f"Evaluate the student's performance. For each question, decide if it is correct or incorrect (or give partial credit for subjective).\n"
            f"Calculate a total score out of 100.\n"
            f"Determine an overall rating from: 'weak', 'avg', or 'good'.\n"
            f"Provide brief overall feedback.\n"
            f"Respond EXACTLY in this JSON format. No markdown blocks, just raw JSON:\n"
            """
            {
                "score": 85,
                "rating": "good",
                "feedback": "Great job on the basic concepts, but review X and Y."
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
        logger.error(f"Quiz evaluate error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
