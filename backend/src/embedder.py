# -*- coding: utf-8 -*-
"""
Multilingual embedding module using OpenAI text-embedding-3-large.
Supports Amharic and English for the bilingual RAG system.
All I/O uses UTF-8; ensure OPENAI_API_KEY is set.
"""
from __future__ import annotations
from dotenv import load_dotenv

load_dotenv()

import os
from typing import List

# Default model for multilingual support (Amharic + English)
EMBEDDING_OPEN_AI_MODEL = "text-embedding-3-large"
EMBEDDING_GEMINI_AI_MODEL = 'models/text-embedding-001'
EMBEDDING_HUGGING_FACE_MODEL = 'intfloat/multilingual-e5-large'


def embed_text(text: str) -> List[float]:
    """
    Embed a single text string using OpenAI text-embedding-3-large (multilingual).
    Use for retrieval: same model as ingestion so queries in Amharic or English match chunks.

    Args:
        text: Input text (Amharic, English, or mixed). UTF-8.

    Returns:
        Embedding vector as list of floats.
    """
    return embed_texts([text])[0]


def embed_texts(texts: List[str]) -> List[List[float]]:
    """
    Embed multiple texts in one API call (batch).

    Args:
        texts: List of input texts.

    Returns:
        List of embedding vectors.
    """
    try:
        from openai import OpenAI
    except ImportError:
        raise ImportError("openai package is required. Install with: pip install openai")

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is not set.")

    client = OpenAI(api_key=api_key)
    # Inputs are passed as-is; OpenAI API accepts UTF-8
    response = client.embeddings.create(
        model=EMBEDDING_OPEN_AI_MODEL,
        input=texts,
        encoding_format="float",
    )
    # Preserve order by index
    ordered = [None] * len(texts)
    for item in response.data:
        if item.index is not None:
            ordered[item.index] = item.embedding
    return [e for e in ordered if e is not None]


# This is open-ai
# def get_langchain_embedding():
#     """
#     Return a LangChain-compatible embedding function for use with Chroma/retriever.
#     Uses OpenAI text-embedding-3-large for multilingual support.
#     """
#     from langchain_openai import OpenAIEmbeddings
    
#     return OpenAIEmbeddings(
#         model=EMBEDDING_MODEL,
#         openai_api_key=os.getenv("OPENAI_API_KEY"),
#     )

# genai
# def get_langchain_embedding():
#     """
#     Return a LangChain-compatible embedding function using Google Gemini embeddings.
#     Uses text-embedding-004 for multilingual support.
#     """
#     from langchain_google_genai import GoogleGenerativeAIEmbeddings
#     import os

#     return GoogleGenerativeAIEmbeddings(
#         model=EMBEDDING_GEMINI_AI_MODEL,
#         google_api_key=os.getenv("GOOGLE_API_KEY"),
#     )

# hugging face
# local just for testing
def get_langchain_embedding():
    """
    Return a LangChain-compatible embedding using local HuggingFace model.
    Uses multilingual-e5-large for multilingual support.
    """
    from langchain_huggingface import HuggingFaceEmbeddings

    return HuggingFaceEmbeddings(
        model_name=EMBEDDING_HUGGING_FACE_MODEL,
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )