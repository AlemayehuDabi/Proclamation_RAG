# -*- coding: utf-8 -*-
"""
ChromaDB vector store for the Startup Proclamation RAG (via LangChain Chroma).
Persistent storage, metadata support, collection: startup_proclamation.
"""

from __future__ import annotations

import os
from typing import List

from langchain_core.documents import Document
from langchain_chroma import Chroma

# Persistent storage path; use CHROMA_PERSIST_PATH or default under backend/vectorstore
_raw_path = os.environ.get(
    "CHROMA_PERSIST_PATH",
    os.path.join("vectorstore", "chroma_startup_proclamation"),
)

# Resolve to absolute path so retrieval works regardless of cwd
VECTORSTORE_PATH = os.path.abspath(_raw_path) if not os.path.isabs(_raw_path) else _raw_path
COLLECTION_NAME = "startup_proclamation"


def get_vectorstore(embedding_function=None):
    """
    Load existing Chroma vectorstore for the proclamation (for retrieval).
    Use after ingestion has been run. Raises if collection is missing or empty.
    """
    from src.embedder import get_langchain_embedding
    ef = embedding_function or get_langchain_embedding()
    return Chroma(
        collection_name=COLLECTION_NAME,
        persist_directory=VECTORSTORE_PATH,
        embedding_function=ef,
    )


def build_vectorstore_from_documents(documents: List[Document], embedding_function=None):
    """
    Create Chroma vectorstore from LangChain documents and persist.
    Used by the one-time ingestion script. Overwrites existing collection.
    """
    from src.embedder import get_langchain_embedding
    
    os.makedirs(VECTORSTORE_PATH, exist_ok=True)

    ef = embedding_function or get_langchain_embedding()

    return Chroma.from_documents(
        documents=documents,
        embedding=ef,
        collection_name=COLLECTION_NAME,
        persist_directory=VECTORSTORE_PATH,
    )


def collection_exists() -> bool:
    """Return True if the proclamation vectorstore directory exists and has data."""
    if not os.path.isdir(VECTORSTORE_PATH):
        return False
        
    try:
        vs = get_vectorstore()
        # Chroma: minimal query to verify collection is built and queryable
        result = vs.similarity_search("test", k=1)
        return result is not None and len(result) >= 0
    except Exception:
        return False
