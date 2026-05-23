"""
RAG Service — google-generativeai SDK (REST v1) + ChromaDB
Uses google.generativeai directly. Supports subject-filtered retrieval.
"""

import chromadb
import logging
from functools import lru_cache
from typing import List, Optional

import google.generativeai as genai
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)

CHAT_MODEL  = "gemini-flash-lite-latest"
EMBED_MODEL = "models/gemini-embedding-2"

LANGUAGE_NAMES = {"en": "English", "hi": "Hindi", "pa": "Punjabi"}


# ── Settings ──────────────────────────────────────────────────────────────────
class Settings(BaseSettings):
    gemini_api_key: str = ""
    chroma_persist_dir: str = "./chroma_db"
    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()


def _configure_genai():
    genai.configure(api_key=get_settings().gemini_api_key)


# ── Per-user conversation history ────────────────────────────────────────────
_histories: dict[str, list[dict]] = {}


def get_history(user_id: str) -> list[dict]:
    return _histories.get(user_id, [])


def add_to_history(user_id: str, human: str, ai_reply: str):
    h = _histories.setdefault(user_id, [])
    h.append({"role": "user",  "parts": [{"text": human}]})
    h.append({"role": "model", "parts": [{"text": ai_reply}]})
    if len(h) > 12:
        _histories[user_id] = h[-12:]


# ── Embeddings ────────────────────────────────────────────────────────────────
def _embed_query(text: str) -> list[float]:
    _configure_genai()
    result = genai.embed_content(model=EMBED_MODEL, content=text, task_type="retrieval_query")
    return result["embedding"]


def _embed_documents(texts: list[str]) -> list[list[float]]:
    _configure_genai()
    return [
        genai.embed_content(model=EMBED_MODEL, content=t, task_type="retrieval_document")["embedding"]
        for t in texts
    ]


# ── ChromaDB ──────────────────────────────────────────────────────────────────
@lru_cache()
def get_chroma_client() -> chromadb.PersistentClient:
    return chromadb.PersistentClient(path=get_settings().chroma_persist_dir)


def get_collection() -> chromadb.Collection:
    return get_chroma_client().get_or_create_collection(
        name="eduko_lessons",
        metadata={"hnsw:space": "cosine"},
    )


# ── Subject/Lesson-aware Retriever ────────────────────────────────────────────
def retrieve_context(query: str, subject: Optional[str] = None, lesson_id: Optional[str] = None, k: int = 5) -> List[Document]:
    """
    Retrieve relevant chunks from ChromaDB.
    If lesson_id is provided, filter exactly to that lesson.
    Otherwise, if subject is provided, filter results to that subject.
    """
    try:
        query_embedding = _embed_query(query)
        collection = get_collection()

        # Build filter
        where_filter = None
        if lesson_id:
            where_filter = {"lesson_id": lesson_id}
        elif subject and subject.strip().lower() not in ("all", "general", ""):
            where_filter = {"subject": subject.strip()}

        query_kwargs = dict(
            query_embeddings=[query_embedding],
            n_results=k,
            include=["documents", "metadatas"],
        )
        if where_filter:
            query_kwargs["where"] = where_filter

        results = collection.query(**query_kwargs)

        docs = []
        for i, doc_text in enumerate(results["documents"][0]):
            meta = results["metadatas"][0][i] if results["metadatas"] else {}
            docs.append(Document(page_content=doc_text, metadata=meta))
        return docs

    except Exception as e:
        logger.warning(f"Retriever error (returning empty): {e}")
        return []


# ── Lesson Ingestion ──────────────────────────────────────────────────────────
async def ingest_lesson(
    lesson_id: str,
    title: str,
    content: str,
    metadata: dict = {},
) -> int:
    """Chunk, embed and store a lesson in ChromaDB with subject metadata."""
    # Skip placeholder PDF entries that have no real text
    if not content or content.strip().startswith("[PDF]") or len(content.strip()) < 20:
        logger.warning(f"Skipping ingest for lesson {lesson_id}: no usable text content.")
        return 0

    splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=100)
    chunks = splitter.split_text(content)
    if not chunks:
        return 0

    chunk_embeddings = _embed_documents(chunks)
    collection = get_collection()

    ids   = [f"{lesson_id}_{i}" for i in range(len(chunks))]
    metas = [{"lesson_id": lesson_id, "title": title, **metadata} for _ in chunks]

    try:
        collection.delete(where={"lesson_id": lesson_id})
    except Exception:
        pass

    collection.add(
        ids=ids,
        documents=chunks,
        embeddings=chunk_embeddings,
        metadatas=metas,
    )

    logger.info(f"Ingested lesson '{title}' ({lesson_id}) — {len(chunks)} chunks, subject={metadata.get('subject','?')}")
    return len(chunks)


# ── Main QA Function ──────────────────────────────────────────────────────────
async def answer_question(
    message: str,
    language: str,
    user_id: str,
    subject: Optional[str] = None,
    lesson_id: Optional[str] = None,
    history: list[dict] = [],
) -> str:
    """
    RAG-based QA using gemini-2.5-flash.
    If lesson_id or subject is provided, context is filtered appropriately.
    """
    try:
        _configure_genai()
        language_name = LANGUAGE_NAMES.get(language, "English")

        # Retrieve filtered context
        docs    = retrieve_context(message, subject=subject, lesson_id=lesson_id, k=5)
        context = "\n\n".join(d.page_content for d in docs) if docs else ""

        # Build subject hint for the prompt
        subject_hint = f"Subject: {subject}\n" if subject and subject.lower() not in ("all", "") else ""

        if context:
            context_block = (
                "You have been provided with the specific content from the student's current lesson below.\n"
                "You MUST answer the student's question based STRICTLY on this relevant lesson content.\n"
                "Do not include outside information that contradicts or expands beyond the lesson content.\n"
                "If the answer cannot be found in the lesson content, politely say so, but you may offer general help.\n\n"
                f"=== LESSON CONTENT ===\n{context}\n====================="
            )
        else:
            context_block = "No specific lesson content is available yet. Answer from your general knowledge."

        system_instruction = (
            f"You are Eduko AI, a friendly and encouraging educational assistant for rural Indian students.\n"
            f"{subject_hint}"
            f"CRITICAL INSTRUCTION: You MUST translate and write your ENTIRE final response strictly in {language_name}!\n"
            f"Even if the user asks their question in English, you must reply in {language_name}.\n"
            f"Use simple words suitable for school students (Class 5-12).\n"
            f"Be encouraging and positive. Use relatable examples from rural Indian life.\n"
            f"Break complex topics into numbered steps when explaining.\n\n"
            f"{context_block}"
        )

        model = genai.GenerativeModel(
            model_name=CHAT_MODEL,
            system_instruction=system_instruction,
        )

        chat_history = get_history(user_id)
        chat     = model.start_chat(history=chat_history)
        response = chat.send_message(message)
        result   = response.text

        add_to_history(user_id, message, result)
        return result

    except Exception as e:
        logger.error(f"RAG chain error: {e}")
        return await _fallback_llm(message, language, subject)


async def _fallback_llm(message: str, language: str, subject: Optional[str] = None) -> str:
    lang_name    = LANGUAGE_NAMES.get(language, "English")
    subject_hint = f"about {subject}" if subject and subject.lower() not in ("all", "") else ""
    try:
        _configure_genai()
        model = genai.GenerativeModel(
            model_name=CHAT_MODEL,
            system_instruction=(
                f"You are Eduko AI, a helpful educational assistant for Indian school students.\n"
                f"CRITICAL INSTRUCTION: You MUST translate and write your ENTIRE final response strictly in {lang_name}!\n"
                f"Even if the user asks their question in English, you must reply in {lang_name}.\n"
                f"Answer questions {subject_hint}. Keep it simple and encouraging."
            ),
        )
        response = model.generate_content(message)
        return response.text
    except Exception as e:
        logger.error(f"Fallback LLM error: {e}")
        return "I'm having trouble connecting to the AI service right now. Please try again in a moment."
