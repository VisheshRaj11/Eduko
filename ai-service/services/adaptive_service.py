"""
adaptive_service.py — LangChain Agent for Adaptive Learning Analysis
Analyses student performance and generates structured weekly study plans.

Functions:
- analyze_performance: Classifies subjects as weak/strong and recommends study hours
- generate_weekly_plan: Returns a 7-day structured plan dict
- get_lesson_recommendations: Suggests specific topics to study next
"""

import json
import logging
from datetime import datetime, timedelta
from functools import lru_cache

from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

LANGUAGE_NAMES = {"en": "English", "hi": "Hindi", "pa": "Punjabi"}


# ── Settings ──────────────────────────────────────────────────────────────────

class _Settings(BaseSettings):
    gemini_api_key: str = ""

    model_config = {"env_file": ".env", "extra": "ignore"}


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


# ── Public API ────────────────────────────────────────────────────────────────

def analyze_performance(quiz_scores: list, attendance_rate: float) -> dict:
    """
    Analyse quiz scores and attendance to classify subjects and recommend
    study allocation.

    Args:
        quiz_scores: List of dicts with keys: subject (str), score (float), total (float).
        attendance_rate: Float 0.0–1.0 representing attendance percentage.

    Returns:
        {
            weak_subjects: [str],
            strong_subjects: [str],
            recommended_focus: [str],       # ordered by priority
            study_hours_per_day: float,
            performance_summary: str,
        }
    """
    if not quiz_scores:
        return {
            "weak_subjects": [],
            "strong_subjects": [],
            "recommended_focus": [],
            "study_hours_per_day": 3.0,
            "performance_summary": "No quiz data available.",
        }

    weak, strong, scores_text = [], [], []
    for qs in quiz_scores:
        subj = qs.get("subject", "Unknown")
        score = float(qs.get("score", 0))
        total = float(qs.get("total", 100))
        pct = (score / total * 100) if total > 0 else 0
        scores_text.append(f"  - {subj}: {score}/{total} ({pct:.0f}%)")
        if pct < 60:
            weak.append(subj)
        else:
            strong.append(subj)

    # Recommend more hours if attendance is low or many weak subjects
    base_hours = 3.0
    if attendance_rate < 0.70:
        base_hours += 0.5
    if len(weak) > 2:
        base_hours += 0.5
    study_hours = min(base_hours, 6.0)

    prompt = f"""You are an educational performance analyst.

STUDENT DATA:
- Quiz scores:
{chr(10).join(scores_text)}
- Attendance: {attendance_rate * 100:.0f}%
- Weak subjects (< 60%): {', '.join(weak) or 'None'}
- Strong subjects (>= 60%): {', '.join(strong) or 'None'}

Write a brief, encouraging 2-3 sentence PERFORMANCE SUMMARY for this student that:
1. Acknowledges their strengths.
2. Gently highlights areas needing improvement.
3. Ends with an encouraging message.

Return ONLY the summary text (no labels, no JSON):"""

    try:
        llm = _get_llm()
        result = llm.invoke(prompt)
        summary = (result.content if hasattr(result, "content") else str(result)).strip()
    except Exception as e:
        logger.warning(f"Performance summary LLM error: {e}")
        summary = (
            f"You are doing well in {', '.join(strong) or 'some subjects'}. "
            f"Focus on {', '.join(weak) or 'all subjects'} to improve further. Keep it up!"
        )

    # Recommended focus: weak subjects first, then strong subjects
    recommended_focus = weak + [s for s in strong if s not in weak]

    return {
        "weak_subjects": weak,
        "strong_subjects": strong,
        "recommended_focus": recommended_focus,
        "study_hours_per_day": round(study_hours, 1),
        "performance_summary": summary,
    }


def generate_weekly_plan(
    user_id: str,
    performance_analysis: dict,
    grade_level: str,
    language: str = "hi",
) -> dict:
    """
    Generate a structured 7-day study plan based on performance analysis.

    Args:
        user_id: Unique student identifier.
        performance_analysis: Output of analyze_performance().
        grade_level: e.g. "Class 8".
        language: "hi" | "pa" | "en".

    Returns:
        {
            user_id, generated_at, week_start,
            days: [{day, date, tasks: [{subject, topic, type, duration_mins, resources}]}],
            goals: [str], tips: [str],
        }
    """
    lang_name = LANGUAGE_NAMES.get(language, "Hindi")
    weak = performance_analysis.get("weak_subjects", [])
    strong = performance_analysis.get("strong_subjects", [])
    study_hours = performance_analysis.get("study_hours_per_day", 3.0)

    today = datetime.utcnow()
    monday = today - timedelta(days=today.weekday())
    week_start = monday.strftime("%Y-%m-%d")
    dates = [(monday + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(7)]

    prompt = f"""You are an Indian school curriculum expert. Create a personalised 7-day study plan.

STUDENT: {user_id}
GRADE: {grade_level}
LANGUAGE: {lang_name}
AVAILABLE STUDY TIME: {study_hours} hours/day
WEAK SUBJECTS (prioritise): {', '.join(weak) or 'None identified'}
STRONG SUBJECTS: {', '.join(strong) or 'All performing well'}
WEEK: {', '.join(f'{DAYS[i]} {dates[i]}' for i in range(7))}

RULES:
- Mon–Fri: 3–4 tasks per day. Weak subjects get 40–50 min sessions; strong subjects get 25–30 min.
- Saturday: 2 revision tasks (lighter day).
- Sunday: 1 rest + light review task only.
- Task types: lesson | practice | quiz | revision
- Each task needs 1–2 NCERT-aligned or free-resource references.
- Include 3–5 weekly goals and 3–5 study tips.
- ALL text in English.

Return ONLY valid JSON (no markdown):
{{
  "week_start": "{week_start}",
  "days": [
    {{
      "day": "Monday",
      "date": "{dates[0]}",
      "tasks": [
        {{
          "subject": "Mathematics",
          "topic": "Rational Numbers - Addition and Subtraction",
          "type": "lesson",
          "duration_mins": 45,
          "resources": ["NCERT Class 8 Math Ch.1", "Practice worksheet pg 12"]
        }}
      ]
    }}
  ],
  "goals": ["Score above 70% in next Mathematics quiz"],
  "tips": ["Study weak subjects first when energy is high"]
}}"""

    try:
        llm = _get_llm()
        result = llm.invoke(prompt)
        content = result.content if hasattr(result, "content") else str(result)
        content = _clean_json(content)
        parsed = json.loads(content)

        return {
            "user_id": user_id,
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "week_start": parsed.get("week_start", week_start),
            "days": parsed.get("days", []),
            "goals": parsed.get("goals", ["Complete all weekly tasks"]),
            "tips": parsed.get("tips", ["Study consistently", "Review notes daily"]),
        }

    except (json.JSONDecodeError, Exception) as e:
        logger.error(f"generate_weekly_plan error: {e}")
        # Fallback minimal plan
        days_out = []
        all_subjects = weak + [s for s in strong if s not in weak] or ["Mathematics", "Science"]
        for i, day in enumerate(DAYS):
            if i < 5:
                tasks = [
                    {
                        "subject": all_subjects[i % len(all_subjects)],
                        "topic": "Chapter Review",
                        "type": "lesson",
                        "duration_mins": 40,
                        "resources": ["NCERT Textbook", "Class Notes"],
                    },
                    {
                        "subject": all_subjects[(i + 1) % len(all_subjects)],
                        "topic": "Practice Problems",
                        "type": "practice",
                        "duration_mins": 30,
                        "resources": ["Exercise Book"],
                    },
                ]
            else:
                tasks = [
                    {
                        "subject": "All Subjects",
                        "topic": "Weekly Revision",
                        "type": "revision",
                        "duration_mins": 45,
                        "resources": ["Class Notes", "Previous Quizzes"],
                    }
                ]
            days_out.append({"day": day, "date": dates[i], "tasks": tasks})

        return {
            "user_id": user_id,
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "week_start": week_start,
            "days": days_out,
            "goals": [
                f"Improve in {', '.join(weak[:2]) or 'all subjects'}",
                "Complete all daily tasks this week",
            ],
            "tips": [
                "Study in a quiet place free from distractions",
                "Take a 10-minute break every 45 minutes",
                "Review your notes before going to sleep",
            ],
        }


def get_lesson_recommendations(
    subject: str,
    current_level: str,
    language: str = "hi",
) -> list:
    """
    Suggest specific topics a student should study next for a given subject.

    Args:
        subject: e.g. "Mathematics", "Science".
        current_level: e.g. "Class 8", "beginner", "intermediate".
        language: "hi" | "pa" | "en".

    Returns:
        List of topic recommendation dicts:
        [{"topic": str, "reason": str, "resource": str, "estimated_mins": int}]
    """
    lang_name = LANGUAGE_NAMES.get(language, "Hindi")

    prompt = f"""You are an expert Indian school teacher.

SUBJECT: {subject}
STUDENT LEVEL: {current_level}
TEACHING LANGUAGE: {lang_name}

Recommend exactly 5 specific topics the student should study next, ordered by priority (most important first).

For each topic include:
- topic: specific chapter or concept name
- reason: 1 sentence why this is important now
- resource: one free/NCERT resource reference
- estimated_mins: study time needed (20–60 mins)

Return ONLY valid JSON array (no markdown):
[
  {{
    "topic": "Linear Equations in One Variable",
    "reason": "Foundation for algebra needed in higher classes",
    "resource": "NCERT Class 8 Math Chapter 2",
    "estimated_mins": 45
  }}
]"""

    try:
        llm = _get_llm()
        result = llm.invoke(prompt)
        content = result.content if hasattr(result, "content") else str(result)
        content = _clean_json(content)
        recommendations = json.loads(content)
        if not isinstance(recommendations, list):
            raise ValueError("Expected JSON array")
        return recommendations

    except Exception as e:
        logger.error(f"get_lesson_recommendations error: {e}")
        # Fallback generic recommendations
        return [
            {
                "topic": f"{subject} Fundamentals Review",
                "reason": "Build a strong foundation before advancing",
                "resource": f"NCERT {current_level} {subject} Textbook - Chapter 1",
                "estimated_mins": 45,
            },
            {
                "topic": f"{subject} Practice Problems",
                "reason": "Reinforce concepts through application",
                "resource": "NCERT Exercise Questions",
                "estimated_mins": 30,
            },
            {
                "topic": f"{subject} Previous Year Questions",
                "reason": "Understand exam patterns and question styles",
                "resource": "CBSE Previous Year Papers",
                "estimated_mins": 40,
            },
        ]
