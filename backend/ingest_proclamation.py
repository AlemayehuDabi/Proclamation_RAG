# -*- coding: utf-8 -*-
"""
One-time ingestion script for the Ethiopian Startup Proclamation PDF (static source RAG).
Loads the bilingual PDF with layout-aware parsing (left=Amharic, right=English),
builds embeddings with text-embedding-3-large(this might change if i hit ratelimiting), and stores in ChromaDB.
"""

import os
import sys

from dotenv import load_dotenv
load_dotenv()

# Ensure backend root is on path when running this script directly
_BACKEND_ROOT = os.path.dirname(os.path.abspath(__file__))

if _BACKEND_ROOT not in sys.path:
    sys.path.insert(0, _BACKEND_ROOT)
os.chdir(_BACKEND_ROOT)

# import some packages and methods form specific modules
from langchain_core.documents import Document
from src.loaders.proclamation_loader import load_proclamation_pdf
from src.vector_db import build_vectorstore_from_documents, VECTORSTORE_PATH

# Override via PROCLAMATION_PDF_PATH; else loader uses data/proclamation.pdf or data/publications/
PDF_PATH = os.environ.get("PROCLAMATION_PDF_PATH")


def main():
    print("Loading proclamation PDF (layout-aware: left=Amharic, right=English)...")
    chunks = load_proclamation_pdf(pdf_path=PDF_PATH or None)
    if not chunks:
        print("No chunks extracted. Check PDF path and layout.")
        sys.exit(1)
    # debug - log the chuncks
    print(f"Extracted {len(chunks)} page-level chunks.")

    # Convert to LangChain Document format for Chroma (bilingual chunk structure)
    documents = []

    for c in chunks:
        meta = {
            "page": c.get("page"),
            "source": c.get("source", ""),
        }

        if c.get("article_id"):
            meta["article_id"] = c["article_id"]
        if c.get("amharic"):
            meta["amharic"] = c["amharic"]
        if c.get("english"):
            meta["english"] = c["english"]

        # Embed combined text so retrieval works for queries in either language
        doc = Document(
            page_content=c.get("content_combined", "") or "",
            metadata=meta,
        )
        
        documents.append(doc)

    print("Building vector store (OpenAI/Gemini text-embedding-3-large)...")
    build_vectorstore_from_documents(documents)
    print(f"Done. Vector store persisted to: {os.path.abspath(VECTORSTORE_PATH)}")
    print("You can now start the API and use POST /query.")


if __name__ == "__main__":
    main()
