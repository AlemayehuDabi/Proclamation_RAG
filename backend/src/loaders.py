import os
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

def load_and_split_docs(data_path: str = "data/publications"):
    # Load all markdown and text files
    loaders = [
        DirectoryLoader(data_path, glob="**/*.md", loader_cls=TextLoader),
        DirectoryLoader(data_path, glob="**/*.txt", loader_cls=TextLoader)
    ]
    
    # Load documents from all loaders
    docs = []
    # loop over the loaders and extend to docs
    for loader in loaders:
        docs.extend(loader.load())

    # Split docs into chunks
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=100,
        length_function=len,
    )
    
    split_docs = splitter.split_documents(docs)
    return split_docs
