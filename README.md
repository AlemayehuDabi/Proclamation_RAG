# 🧠 RAG AI Assistant (Bilingual Legal Search)

This project is a Retrieval-Augmented Generation (RAG) based AI assistant that can understand and answer questions from structured documents.

In this case, it’s built around bilingual legal content (Amharic + English) from the Startup Proclamation.

---

## 🚀 What It Does

* Takes user questions
* Searches relevant document chunks using embeddings
* Feeds context into an LLM
* Returns accurate, context-aware answers

---

## 🏗️ Tech Stack

**Backend**

* FastAPI
* Chroma (Vector Database)
* HuggingFace Embeddings (multilingual-e5-large)

**Frontend**

* React (UI in progress)

**Database (coming soon)**

* PostgreSQL for chat history & user data

---

## ⚙️ How It Works

1. Documents are parsed and split into chunks
2. Each chunk is converted into embeddings
3. Stored in Chroma vector database
4. User query → embedded → similarity search
5. Relevant context → passed to LLM
6. AI generates final answer

---

## 🧪 Current Status

* ✅ Document ingestion pipeline
* ✅ Vector database setup (Chroma)
* ✅ Multilingual embedding support
* ⏳ Frontend integration (in progress)
* ⏳ Chat history (PostgreSQL) coming soon
* ⏳ Streaming responses (planned)

---

## 📦 Setup

```bash
# install dependencies
pip install -r requirements.txt

# run backend
uvicorn src.main:app --reload
```

---

## 📂 Project Structure

```bash
backend/
 ├── src/
 │   ├── main.py
 │   ├── embedder.py
 │   ├── vector_db.py
 │   ├── rag_pipeline.py
 │   └── ...
 ├── ingest_proclamation.py
 └── ...
```

---

## 🧠 Notes

* Uses multilingual embeddings for better cross-language retrieval
* Local model used during development (no API cost)
* Designed to scale with better retrieval + UI improvements

---

## 🔮 Roadmap

* Improve retrieval accuracy (ranking / filtering)
* Add chat history & memory
* Streaming responses
* UI/UX improvements
* Deployment

---

## 🤝 Feedback

Open to feedback, ideas, and improvements.

If you find this interesting, feel free to star ⭐ the repo or reach out.
