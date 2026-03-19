# -*- coding: utf-8 -*-
"""
Conversation persistence: chat memory for LLM and optional storage of RAG turns (question, answer, sources).
"""
from langchain_classic.memory import ConversationSummaryMemory
from langchain_core.messages import messages_from_dict, messages_to_dict
import json
import os
from typing import List, Optional

# we are going to change this to real db
MEMORY_DIR = "memory"
MEMORY_FILE = os.path.join(MEMORY_DIR, "memory.json")
TURNS_KEY = "rag_turns"  # optional list of { question, answer, sources, articles }


def load_memory(llm):
    if os.path.exists(MEMORY_FILE):
        with open(MEMORY_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)

        memory = ConversationSummaryMemory(
            llm=llm,
            memory_key="chat_history",
            output_key="answer",
            return_messages=True
        )

        if "messages" in data:
            memory.chat_memory.messages = messages_from_dict(data["messages"])
    else:
        memory = ConversationSummaryMemory(
            llm=llm,
            memory_key="chat_history",
            output_key="answer",
            return_messages=True
        )
    return memory


def save_memory(memory, rag_turns: Optional[List[dict]] = None):
    """Persist chat memory. Optionally merge in rag_turns if provided."""

    os.makedirs(MEMORY_DIR, exist_ok=True)
    data = {"messages": messages_to_dict(memory.chat_memory.messages)}
    if rag_turns is not None:
        data[TURNS_KEY] = rag_turns
    elif os.path.exists(MEMORY_FILE):
        with open(MEMORY_FILE, "r", encoding="utf-8") as f:
            existing = json.load(f)
        if TURNS_KEY in existing:
            data[TURNS_KEY] = existing[TURNS_KEY]
    with open(MEMORY_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def append_rag_turn(question: str, answer: str, sources: List[int], articles: List[str], max_turns: int = 100):
    """
    Append one RAG Q&A turn (question, answer, sources, articles) to persisted conversation.
    Keeps the last max_turns entries. Preserves existing "messages" and other keys.
    """
    os.makedirs(MEMORY_DIR, exist_ok=True)
    data = {}
    if os.path.exists(MEMORY_FILE):
        with open(MEMORY_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    turns = data.get(TURNS_KEY, [])
    turns.append({
        "question": question,
        "answer": answer,
        "sources": sources,
        "articles": articles,
    })
    data[TURNS_KEY] = turns[-max_turns:]
    with open(MEMORY_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def load_rag_turns() -> List[dict]:
    """Return list of saved RAG turns (question, answer, sources, articles)."""
    if not os.path.exists(MEMORY_FILE):
        return []
    with open(MEMORY_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get(TURNS_KEY, [])

# Print conversation history to terminal.
def display_memory(memory):
    if not memory.chat_memory.messages:
        print("💡 No previous conversation history.")
    else:
        print("\n📝 Previous Conversation History:")
        for msg in memory.chat_memory.messages:
            role = msg.type.capitalize()
            if role == "Human":
                print(f">> You: {msg.content}")
            else:
                print(f"🤖 Assistant: {msg.content}")
        print("-" * 50)
    