from src.embedder import build_vectorstore, load_vectorstore, VECTORSTORE_PATH
import os

def get_retriever():
    if not os.path.exists(VECTORSTORE_PATH):
        vectorstore = build_vectorstore()
    else:
        vectorstore = load_vectorstore()
    return vectorstore.as_retriever(search_kwargs={"k": 3})
