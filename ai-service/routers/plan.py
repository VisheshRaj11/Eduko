from fastapi import APIRouter
from pydantic import BaseModel
from services.rag_service import get_llm, LANGUAGE_NAMES
from typing import Optional
import json

router = APIRouter()

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

SUBJECTS_BY_GRADE = {
    "primary":   ["Mathematics", "Science", "Hindi", "English", "Social Studies"],
    "secondary": ["Mathematics", "Science", "Hindi", "English", "Social Studies", "Computer"],
    "higher":    ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Hindi"],
}


class PlanRequest(BaseModel):
    student_id: str
    grade_level: str = "Class 6"
    language: str = "hi"
    progress: list[dict] = []


class PlanResponse(BaseModel):
    student_id: str
    generated_at: str
    weekly_plan: list[dict]


@router.post("/generate-plan", response_model=PlanResponse)
async def generate_plan(req: PlanRequest):
    """Generate a personalised weekly study plan using Gemini 2.5."""

    from datetime import datetime

    grade_num = int(''.join(filter(str.isdigit, req.grade_level)) or '6')
    if grade_num <= 5:
        tier = "primary"
    elif grade_num <= 10:
        tier = "secondary"
    else:
        tier = "higher"

    lang_name = LANGUAGE_NAMES.get(req.language, "Hindi")
    subjects  = SUBJECTS_BY_GRADE[tier]

    prompt = f"""You are an educational AI. Generate a detailed 7-day study plan for an Indian school student.

Student details:
- Grade: {req.grade_level}
- Language preference: {lang_name}
- Subjects: {', '.join(subjects)}

Return ONLY valid JSON (no markdown, no extra text) in this exact format:
{{
  "weekly_plan": [
    {{
      "day": "Monday",
      "tasks": [
        {{"subject": "Mathematics", "topic": "specific topic", "duration": "30 mins", "type": "lesson"}},
        {{"subject": "Science", "topic": "specific topic", "duration": "25 mins", "type": "lesson"}},
        {{"subject": "Quiz", "topic": "Practice", "duration": "15 mins", "type": "quiz"}}
      ]
    }}
  ]
}}

Make topics specific and grade-appropriate for {req.grade_level}. Include weekends as revision days."""

    llm = get_llm()
    result = llm.invoke(prompt)
    content = result.content if hasattr(result, "content") else str(result)

    try:
        # Strip markdown code fences if present
        content = content.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]

        parsed     = json.loads(content)
        weekly     = parsed.get("weekly_plan", [])
    except Exception:
        # Fallback plan
        weekly = _fallback_plan(subjects)

    return PlanResponse(
        student_id=req.student_id,
        generated_at=datetime.utcnow().isoformat(),
        weekly_plan=weekly,
    )


def _fallback_plan(subjects: list[str]) -> list[dict]:
    """Generate a basic plan without LLM if parsing fails."""
    plan = []
    for i, day in enumerate(DAYS):
        if i < 5:
            tasks = [
                {"subject": subjects[i % len(subjects)], "topic": "Chapter Review", "duration": "30 mins", "type": "lesson"},
                {"subject": subjects[(i + 1) % len(subjects)], "topic": "Practice Problems", "duration": "25 mins", "type": "lesson"},
                {"subject": "Quiz", "topic": "Daily Quiz", "duration": "15 mins", "type": "quiz"},
            ]
        else:
            tasks = [{"subject": "Revision", "topic": "Weekly Review", "duration": "45 mins", "type": "revision"}]
        plan.append({"day": day, "tasks": tasks})
    return plan
