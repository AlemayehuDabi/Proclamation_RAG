# -*- coding: utf-8 -*-
"""
RAG pipeline for the bilingual Startup Proclamation.
Flow: embed query -> retrieve top-k chunks -> build context -> LLM -> answer with page/article citations.
Supports Amharic and English questions; context includes both languages from layout-aware chunks.
"""
import os
from typing import List, Dict, Any, Optional

from dotenv import load_dotenv
import yaml

from src.retriever import get_retriever
from src.save_load_conversation import load_memory

load_dotenv()

# Prompt path relative to project/backend root
PROMPTS_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts", "prompts.yaml")


def _get_llm():
    """Use GPT-4o when OPENAI_API_KEY is set, else Google Gemini (bilingual)."""
    if os.getenv("GOOGLE_API_KEY"):
        from langchain_google_genai import ChatGoogleGenerativeAI
        # return ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0.3)
        try:
            return ChatGoogleGenerativeAI(
                model="gemini-flash-latest",
                temperature=0.3,
            )
        except Exception:
            # fallback model
            return ChatGoogleGenerativeAI(
                model="gemini-1.5-pro",
                temperature=0.3,
            )

    if os.getenv("OPENAI_API_KEY"):
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model="gpt-4o",
            temperature=0.3,
        )
    raise ValueError(
        "Set OPENAI_API_KEY or GOOGLE_API_KEY in .env for the LLM."
    )


def _load_system_prompt() -> str:
    if os.path.isfile(PROMPTS_PATH):
        with open(PROMPTS_PATH, "r", encoding="utf-8") as f:
            config = yaml.safe_load(f)
        return config.get("system_prompt", "") or _default_system_prompt()
    return _default_system_prompt()


def _default_system_prompt() -> str:
    return """You are a professional RAG assistant for the Ethiopian Startup Proclamation No. 1396/2025.
Answer only from the provided context (Amharic/English). Support questions in Amharic or English.
Always cite sources: mention page number and Article when available (e.g. "Page 12, Article 5").
If the information is not in the context, say so. Use clear, concise language."""


def _build_context(docs: List[Any]) -> str:
    """Build context string from retrieved documents with page/article labels."""
    parts = []
    for i, doc in enumerate(docs, 1):
        meta = getattr(doc, "metadata", {}) or {}
        page = meta.get("page", "")
        article = meta.get("article_id", "")
        label = f"[Source {i}"
        if page or article:
            label += f" — Page {page}" if page else ""
            if article:
                label += f", {article}" if page else f" — {article}"
        label += "]\n"
        content = getattr(doc, "page_content", "") or str(doc)
        parts.append(label + content)
    return "\n\n---\n\n".join(parts)


def _extract_sources(docs: List[Any]) -> tuple:
    """Extract unique page numbers and article_ids from retrieved docs."""
    pages = []
    articles = []
    for doc in docs:
        meta = getattr(doc, "metadata", {}) or {}
        p = meta.get("page")
        if p is not None and p not in pages:
            pages.append(p)
        a = meta.get("article_id")
        if a and a not in articles:
            articles.append(a)
    return sorted(pages), list(dict.fromkeys(articles))


def create_rag_pipeline(top_k: int = 5):
    """
    Create the RAG pipeline (retriever + LLM + prompt). Used by API to run query.
    """
    retriever = get_retriever(top_k=top_k)
    llm = _get_llm()
    system_prompt = _load_system_prompt()
    memory = load_memory(llm)
    return {
        "retriever": retriever,
        "llm": llm,
        "system_prompt": system_prompt,
        "memory": memory,
    }


def run_rag_query(
    question: str,
    pipeline: Optional[Dict[str, Any]] = None,
    top_k: int = 5,
) -> Dict[str, Any]:
    """
    Run a single RAG query: retrieve chunks, build context, call LLM, return answer + citations.

    Returns:
        {
            "answer": str,
            "sources": [int, ...],   # page numbers
            "articles": [str, ...],  # e.g. ["Article_5"]
        }
    """
    if pipeline is None:
        pipeline = create_rag_pipeline(top_k=top_k)
    retriever = pipeline["retriever"]
    llm = pipeline["llm"]
    system_prompt = pipeline["system_prompt"]

    docs = retriever.invoke(question)
    if not docs:
        return {
            "answer": "No relevant passages were found in the proclamation. Please rephrase or ask something within the document.",
            "sources": [],
            "articles": [],
        }

    context = _build_context(docs)
    pages, articles = _extract_sources(docs)

    from langchain_core.messages import SystemMessage, HumanMessage
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"Context from the Ethiopian Startup Proclamation:\n\n{context}\n\nQuestion: {question}\n\nAnswer (include page and article citations where relevant):"),
    ]
    response = llm.invoke(messages)
    answer = response.content if hasattr(response, "content") else str(response)

    return {
        "answer": answer,
        "sources": pages,
        "articles": articles,
    }
