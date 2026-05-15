"""
RAG Service — LangChain + ChromaDB (native client) + Gemini 2.5

Uses chromadb's native Python client directly (no langchain-chroma),
which is fully Python 3.13 compatible.
"""

import chromadb
from chromadb.config import Settings as ChromaSettings
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferWindowMemory
from langchain.schema import Document, BaseRetriever
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.prompts import PromptTemplate
from langchain.callbacks.manager import CallbackManagerForRetrieverRun
from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache
from typing import List
import logging

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    gemini_api_key: str = ""
    chroma_persist_dir: str = "./chroma_db"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


LANGUAGE_NAMES = {"en": "English", "hi": "Hindi", "pa": "Punjabi"}

SYSTEM_PROMPT = """You are Eduko AI, a friendly and encouraging educational assistant for rural Indian students.

Your guidelines:
1. Respond in {language_name} language.
2. Use simple, easy-to-understand language suitable for school students (Class 5-12).
3. Break down complex topics into simple steps.
4. Use relatable examples from rural Indian life when possible.
5. Be encouraging and positive — never make students feel bad for not knowing something.
6. If a question is not about education, gently redirect to learning topics.
7. When explaining math or science, use clear numbered steps.

Context from lessons:
{context}

Student question: {question}

Answer in {language_name}:"""


# ── Per-user conversation memory ──────────────────────────────────────────
_memories: dict[str, ConversationBufferWindowMemory] = {}


def get_memory(user_id: str) -> ConversationBufferWindowMemory:
    if user_id not in _memories:
        _memories[user_id] = ConversationBufferWindowMemory(
            k=6,
            memory_key="chat_history",
            return_messages=True,
            output_key="answer",
        )
    return _memories[user_id]


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


# ── Custom retriever wrapping native chromadb client ─────────────────────
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

    # Delete existing chunks for this lesson (upsert behaviour)
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
    """RAG-based QA with per-user conversation memory."""
    try:
        language_name = LANGUAGE_NAMES.get(language, "Hindi")

        prompt = PromptTemplate(
            input_variables=["context", "question", "language_name"],
            template=SYSTEM_PROMPT,
        ).partial(language_name=language_name)

        memory = get_memory(user_id)

        chain = ConversationalRetrievalChain.from_llm(
            llm=get_llm(),
            retriever=ChromaRetriever(k=4),
            memory=memory,
            return_source_documents=False,
            combine_docs_chain_kwargs={"prompt": prompt},
            output_key="answer",
        )

        result = chain.invoke({"question": message})
        return result.get("answer", "")

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
