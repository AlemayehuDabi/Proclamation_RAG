# -*- coding: utf-8 -*-
"""
Retriever for the bilingual Startup Proclamation RAG.
Loads pre-built Chroma vectorstore; supports top-k retrieval and metadata-rich results.
Static source RAG: run ingest_proclamation.py once before using the API.
"""
from __future__ import annotations

import os
from typing import Optional

from src.vector_db import VECTORSTORE_PATH, get_vectorstore


def get_retriever(top_k: int = 5, embedding_function=None):
    """
    Return a retriever over the startup_proclamation Chroma collection.
    Multilingual: same embedding model as ingestion so Amharic/English queries match chunks.

    Args:
        top_k: Number of chunks to retrieve.
        embedding_function: Optional; uses OpenAI text-embedding-3-large by default.

    Returns:
        LangChain retriever (vectorstore.as_retriever with k=top_k).

    Raises:
        RuntimeError: If vectorstore directory is missing (run ingestion first).
    """
    if not os.path.isdir(VECTORSTORE_PATH):
        raise RuntimeError(
            "Vector store not found. Run the ingestion script first from the backend directory: "
            "python ingest_proclamation.py"
        )
    vectorstore = get_vectorstore(embedding_function=embedding_function)
    return vectorstore.as_retriever(search_kwargs={"k": top_k})
