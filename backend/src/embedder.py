import os
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from src.loaders import load_and_split_docs

VECTORSTORE_PATH = "vectorstore/index"

def build_vectorstore():
    docs = load_and_split_docs()
    if not docs:
        raise ValueError("❌ No documents found in data/publications. Check file path and format.")

    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

    os.makedirs(VECTORSTORE_PATH, exist_ok=True)
    vectorstore = Chroma.from_documents(
        documents=docs,
        embedding=embeddings,
        persist_directory=VECTORSTORE_PATH
    )
    # No need to call persist() — from_documents saves automatically in this version
    return vectorstore

def load_vectorstore():
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    return Chroma(
        persist_directory=VECTORSTORE_PATH,
        embedding_function=embeddings
    )
