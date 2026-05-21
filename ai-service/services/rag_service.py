"""
RAG Service — LangChain LCEL + ChromaDB (native) + Gemini 2.5
Compatible with LangChain 1.3+ (uses LCEL pipeline, no deprecated chains)
"""

import chromadb
import logging
from functools import lru_cache
from typing import List

from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.callbacks import CallbackManagerForRetrieverRun
from langchain_core.output_parsers import StrOutputParser
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pydantic_settings import BaseSettings
from pydantic import Field

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    gemini_api_key: str = ""
    chroma_persist_dir: str = "./chroma_db"

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()


LANGUAGE_NAMES = {"en": "English", "hi": "Hindi", "pa": "Punjabi"}

# ── Per-user conversation history (simple list-based) ────────────────────
_histories: dict[str, list] = {}


def get_history(user_id: str) -> list:
    if user_id not in _histories:
        _histories[user_id] = []
    return _histories[user_id]


def add_to_history(user_id: str, human: str, ai: str):
    h = get_history(user_id)
    h.append(HumanMessage(content=human))
    h.append(AIMessage(content=ai))
    # Keep last 6 turns
    if len(h) > 12:
        _histories[user_id] = h[-12:]


def get_llm() -> ChatGoogleGenerativeAI:
    settings = get_settings()
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash-preview-04-17",
        google_api_key=settings.gemini_api_key,
        temperature=0.4,
        max_tokens=1024,
    )


def get_embeddings() -> GoogleGenerativeAIEmbeddings:
    settings = get_settings()
    return GoogleGenerativeAIEmbeddings(
        model="models/embedding-001",
        google_api_key=settings.gemini_api_key,
    )


@lru_cache()
def get_chroma_client() -> chromadb.PersistentClient:
    settings = get_settings()
    return chromadb.PersistentClient(path=settings.chroma_persist_dir)


def get_collection() -> chromadb.Collection:
    client = get_chroma_client()
    return client.get_or_create_collection(
        name="eduko_lessons",
        metadata={"hnsw:space": "cosine"},
    )


# ── Custom retriever wrapping native chromadb ─────────────────────────────
class ChromaRetriever(BaseRetriever):
    """LangChain-compatible retriever using native chromadb client."""

    k: int = Field(default=4)

    def _get_relevant_documents(
        self, query: str, *, run_manager: CallbackManagerForRetrieverRun
    ) -> List[Document]:
        try:
            embeddings = get_embeddings()
            query_embedding = embeddings.embed_query(query)
            collection = get_collection()

            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=self.k,
                include=["documents", "metadatas"],
            )

            docs = []
            for i, doc_text in enumerate(results["documents"][0]):
                meta = results["metadatas"][0][i] if results["metadatas"] else {}
                docs.append(Document(page_content=doc_text, metadata=meta))
            return docs
        except Exception as e:
            logger.warning(f"Retriever error (returning empty): {e}")
            return []


async def ingest_lesson(lesson_id: str, title: str, content: str, metadata: dict = {}) -> int:
    """Chunk and embed a lesson into ChromaDB."""
    splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=100)
    chunks = splitter.split_text(content)

    if not chunks:
        return 0

    embeddings = get_embeddings()
    collection = get_collection()

    chunk_embeddings = embeddings.embed_documents(chunks)

    ids = [f"{lesson_id}_{i}" for i in range(len(chunks))]
    metas = [{"lesson_id": lesson_id, "title": title, **metadata} for _ in chunks]

    # Upsert: delete old chunks first
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

    return len(chunks)


async def answer_question(
    message: str,
    language: str,
    user_id: str,
    history: list[dict] = [],
) -> str:
    """RAG-based QA using LCEL pipeline with per-user chat history."""
    try:
        language_name = LANGUAGE_NAMES.get(language, "Hindi")

        # Retrieve relevant context
        retriever = ChromaRetriever(k=4)
        docs = retriever.invoke(message)
        context = "\n\n".join(d.page_content for d in docs) if docs else "No specific lesson context available."

        # Build prompt
        system_msg = (
            f"You are Eduko AI, a friendly and encouraging educational assistant for rural Indian students.\n"
            f"Respond ONLY in {language_name} language.\n"
            f"Use simple words suitable for school students (Class 5-12).\n"
            f"Be encouraging and positive. Use relatable examples from rural Indian life.\n"
            f"Break complex topics into numbered steps.\n\n"
            f"Relevant lesson context:\n{context}"
        )

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_msg),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{question}"),
        ])

        # Restore history
        chat_history = get_history(user_id)

        # LCEL chain
        chain = prompt | get_llm() | StrOutputParser()

        result = chain.invoke({
            "question": message,
            "chat_history": chat_history,
        })

        # Store in memory
        add_to_history(user_id, message, result)
        return result

    except Exception as e:
        logger.error(f"RAG chain error: {e}")
        return await _fallback_llm(message, language)


async def _fallback_llm(message: str, language: str) -> str:
    """Direct Gemini call when vector store is empty or unavailable."""
    lang_name = LANGUAGE_NAMES.get(language, "Hindi")
    llm = get_llm()
    prompt = (
        f"You are Eduko AI, a helpful educational assistant for Indian school students.\n"
        f"Answer in {lang_name} language. Keep it simple and encouraging.\n\n"
        f"Question: {message}\nAnswer:"
    )
    result = llm.invoke(prompt)
    return result.content if hasattr(result, "content") else str(result)
