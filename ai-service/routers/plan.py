"""
plan.py — Adaptive 7-day Learning Plan Router
Generates personalised weekly study plans using Gemini 2.5 Flash.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from services.rag_service import LANGUAGE_NAMES
import google.generativeai as genai
import json
import logging
import os
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

router = APIRouter()

# ── In-memory plan cache keyed by user_id ────────────────────────────────────
_plan_cache: dict[str, dict] = {}

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


# ── Pydantic models ───────────────────────────────────────────────────────────

class QuizScore(BaseModel):
    subject: str
    score: float
    total: float = 100.0


class PlanRequest(BaseModel):
    user_id: str
    quiz_scores: list[QuizScore] = []
    attendance_rate: float = Field(default=0.75, ge=0.0, le=1.0)
    grade_level: str = "Class 8"
    language: str = "hi"          # hi | pa | en


class TaskItem(BaseModel):
    subject: str
    topic: str
    type: str                     # lesson | practice | quiz | revision
    duration_mins: int
    resources: list[str] = []


class DayPlan(BaseModel):
    day: str
    date: str
    tasks: list[TaskItem]


class WeekPlan(BaseModel):
    week_start: str
    days: list[DayPlan]
    goals: list[str]
    tips: list[str]


class PlanResponse(BaseModel):
    user_id: str
    generated_at: str
    plan: WeekPlan


# ── Helper: analyse quiz scores to find weak subjects ────────────────────────

def _analyse_scores(quiz_scores: list[QuizScore]) -> dict:
    weak, strong = [], []
    for qs in quiz_scores:
        pct = (qs.score / qs.total) * 100 if qs.total > 0 else 0
        if pct < 60:
            weak.append({"subject": qs.subject, "percentage": round(pct, 1)})
        else:
            strong.append({"subject": qs.subject, "percentage": round(pct, 1)})
    return {"weak": weak, "strong": strong}


# ── Helper: strip markdown fences from LLM output ────────────────────────────

def _clean_json(raw: str) -> str:
    raw = raw.strip()
    if raw.startswith("```"):
        lines = raw.split("\n")
        # Drop first fence line and last fence line
        inner = lines[1:] if lines[0].startswith("```") else lines
        if inner and inner[-1].strip() == "```":
            inner = inner[:-1]
        raw = "\n".join(inner)
    return raw.strip()


# ── Fallback plan (used when LLM JSON cannot be parsed) ─────────────────────

def _fallback_plan(grade_level: str, weak_subjects: list) -> dict:
    today = datetime.utcnow()
    monday = today - timedelta(days=today.weekday())
    week_start = monday.strftime("%Y-%m-%d")

    focus = [w["subject"] for w in weak_subjects] if weak_subjects else ["Mathematics", "Science"]
    days_out = []
    for i, day in enumerate(DAYS):
        date_str = (monday + timedelta(days=i)).strftime("%Y-%m-%d")
        if i < 5:
            tasks = [
                TaskItem(subject=focus[0] if focus else "Mathematics",
                         topic="Concept Review", type="lesson",
                         duration_mins=40, resources=["Textbook Chapter", "NCERT Notes"]),
                TaskItem(subject=focus[1] if len(focus) > 1 else "Science",
                         topic="Practice Problems", type="practice",
                         duration_mins=30, resources=["Exercise Set"]),
                TaskItem(subject="General", topic="Daily Quiz",
                         type="quiz", duration_mins=15, resources=[]),
            ]
        else:
            tasks = [
                TaskItem(subject="All Subjects", topic="Weekly Revision",
                         type="revision", duration_mins=60,
                         resources=["Class Notes", "Previous Tests"]),
            ]
        days_out.append(DayPlan(day=day, date=date_str, tasks=tasks))

    return {
        "week_start": week_start,
        "days": [d.model_dump() for d in days_out],
        "goals": [f"Improve understanding in {', '.join(focus)}", "Complete all daily tasks"],
        "tips": ["Study in a quiet place", "Take short breaks every 45 minutes",
                 "Review notes before sleeping"],
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/generate-plan", response_model=PlanResponse)
async def generate_plan(req: PlanRequest):
    """
    Generate a personalised adaptive 7-day learning plan.
    Analyses quiz scores to detect weak subjects and tailors the plan.
    """
    analysis = _analyse_scores(req.quiz_scores)
    lang_name = LANGUAGE_NAMES.get(req.language, "Hindi")

    today = datetime.utcnow()
    monday = today - timedelta(days=today.weekday())
    week_start = monday.strftime("%Y-%m-%d")

    # Build date list for 7 days
    dates = [(monday + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(7)]

    weak_summary = (
        ", ".join(f"{w['subject']} ({w['percentage']}%)" for w in analysis["weak"])
        if analysis["weak"] else "None identified"
    )
    strong_summary = (
        ", ".join(f"{s['subject']} ({s['percentage']}%)" for s in analysis["strong"])
        if analysis["strong"] else "None identified"
    )

    prompt = f"""You are an expert Indian school educator creating a personalised 7-day adaptive study plan.

STUDENT PROFILE:
- Grade: {req.grade_level}
- Language preference: {lang_name}
- Attendance rate: {round(req.attendance_rate * 100)}%
- Weak subjects (need more attention): {weak_summary}
- Strong subjects: {strong_summary}

WEEK DATES: {', '.join(f'{DAYS[i]} ({dates[i]})' for i in range(7))}

RULES:
1. Allocate MORE time to weak subjects (extra 15-20 mins per session).
2. Monday-Friday: 3-4 tasks per day mixing lesson, practice, and quiz types.
3. Saturday: light revision day (2 tasks).
4. Sunday: rest + light revision (1 task only).
5. Each task must have 1-3 specific resource suggestions (e.g., "NCERT Class 8 Math Ch.4", "Khan Academy video").
6. goals: 3-5 weekly learning goals (specific, measurable).
7. tips: 3-5 motivational study tips relevant to rural Indian students.
8. All text for topics/resources should be in English for consistency.
9. Keep duration_mins between 20 and 60.

Return ONLY valid JSON (no markdown fences, no extra text) matching this EXACT schema:
{{
  "week_start": "{week_start}",
  "days": [
    {{
      "day": "Monday",
      "date": "{dates[0]}",
      "tasks": [
        {{
          "subject": "Mathematics",
          "topic": "Linear Equations - Solving One Variable",
          "type": "lesson",
          "duration_mins": 45,
          "resources": ["NCERT Class 8 Math Ch.2", "Example problems pg 25"]
        }}
      ]
    }}
  ],
  "goals": ["Master linear equations by end of week", "Score above 70% in next Math quiz"],
  "tips": ["Practice problems every morning", "Use diagrams to understand Science concepts"]
}}

Generate the complete 7-day plan now:"""

    try:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))
        model = genai.GenerativeModel(model_name="gemini-flash-lite-latest")
        result = model.generate_content(prompt)
        content = _clean_json(result.text)
        parsed = json.loads(content)

        # Validate / normalise structure
        if "days" not in parsed or not isinstance(parsed["days"], list):
            raise ValueError("Missing 'days' array in LLM response")

        # Ensure plan is well-formed
        week_plan = WeekPlan(
            week_start=parsed.get("week_start", week_start),
            days=[
                DayPlan(
                    day=d.get("day", DAYS[i % 7]),
                    date=d.get("date", dates[i % 7]),
                    tasks=[
                        TaskItem(
                            subject=t.get("subject", "General"),
                            topic=t.get("topic", "Study Session"),
                            type=t.get("type", "lesson"),
                            duration_mins=int(t.get("duration_mins", 30)),
                            resources=t.get("resources", []),
                        )
                        for t in d.get("tasks", [])
                    ],
                )
                for i, d in enumerate(parsed["days"])
            ],
            goals=parsed.get("goals", ["Complete all weekly tasks"]),
            tips=parsed.get("tips", ["Stay consistent", "Review daily"]),
        )

    except (json.JSONDecodeError, ValueError, KeyError) as e:
        logger.warning(f"Plan JSON parse error: {e}. Using fallback plan.")
        fallback = _fallback_plan(req.grade_level, analysis["weak"])
        week_plan = WeekPlan(**fallback)

    response = PlanResponse(
        user_id=req.user_id,
        generated_at=datetime.utcnow().isoformat() + "Z",
        plan=week_plan,
    )

    # Cache by user_id
    _plan_cache[req.user_id] = response.model_dump()
    return response


@router.get("/plan/{user_id}", response_model=PlanResponse)
async def get_plan(user_id: str):
    """Return the cached learning plan for a user."""
    if user_id not in _plan_cache:
        raise HTTPException(
            status_code=404,
            detail=f"No plan found for user '{user_id}'. Call POST /ai/generate-plan first.",
        )
    return _plan_cache[user_id]
