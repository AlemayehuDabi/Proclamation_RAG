# -*- coding: utf-8 -*-
"""
FastAPI server for the Bilingual Startup Proclamation RAG.
Static source RAG: run ingest_proclamation once, then use POST /query for retrieval + generation.
"""
from __future__ import annotations

from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from src.rag_pipeline import create_rag_pipeline, run_rag_query
from src.save_load_conversation import append_rag_turn
from src.vector_db import collection_exists

app = FastAPI(
    title="Startup Proclamation RAG API",
    description="Bilingual (Amharic/English) RAG over Ethiopian Startup Proclamation No. 1396/2025",
)


class QueryRequest(BaseModel):
    question: str


class QueryResponse(BaseModel):
    answer: str
    sources: List[int]  # page numbers
    articles: List[str]  # e.g. ["Article_5"]


# Reusable pipeline instance (optional: create per-request for stateless)
_pipeline = None


def _get_pipeline():
    global _pipeline
    if _pipeline is None:
        _pipeline = create_rag_pipeline(top_k=5)
    return _pipeline


@app.post("/query", response_model=QueryResponse)
def query(request: QueryRequest):
    """
    Ask a question in Amharic or English. Returns answer with page and article citations.
    """

    try:
        pipeline = _get_pipeline()
        result = run_rag_query(request.question, pipeline=pipeline, top_k=5)
        # Persist this turn (question, answer, sources, articles)
        append_rag_turn(
            question=request.question,
            answer=result["answer"],
            sources=result["sources"],
            articles=result["articles"],
        )
        return QueryResponse(
            answer=result["answer"],
            sources=result["sources"],
            articles=result["articles"],
        )
    except RuntimeError as e:
        if "Vector store not found" in str(e) or "ingestion" in str(e).lower():
            raise HTTPException(status_code=503, detail=str(e))
        raise HTTPException(status_code=500, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/ask_rag", response_model=dict)
def ask_rag(request: QueryRequest):
    """
    Legacy endpoint: same as /query but returns previous response shape for backward compatibility.
    """
    try:
        pipeline = _get_pipeline()
        result = run_rag_query(request.question, pipeline=pipeline, top_k=5)
        append_rag_turn(
            question=request.question,
            answer=result["answer"],
            sources=result["sources"],
            articles=result["articles"],
        )
        return {
            "answer": result["answer"],
            "sources": result["sources"],
            "articles": result["articles"],
        }
    except RuntimeError as e:
        if "Vector store not found" in str(e) or "ingestion" in str(e).lower():
            raise HTTPException(status_code=503, detail=str(e))
        raise HTTPException(status_code=500, detail=str(e))

# ------------- check apis ------------

@app.get("/health")
def health():
    """Basic liveness: API is up."""
    return {"status": "ok"}


@app.get("/ready")
def ready():
    """Readiness: vector store is built and queryable. Use for deployment checks."""
    if collection_exists():
        return {"status": "ready", "vectorstore": "loaded"}
    return JSONResponse(
        status_code=503,
        content={
            "status": "not_ready",
            "detail": "Run ingestion first: python ingest_proclamation.py",
        },
    )