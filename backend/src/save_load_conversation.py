from langchain.memory import ConversationSummaryMemory
from langchain.schema import messages_from_dict, messages_to_dict
import json
import os

MEMORY_DIR = "memory"
MEMORY_FILE = os.path.join(MEMORY_DIR, "memory.json")

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


def save_memory(memory):
    os.makedirs(MEMORY_DIR, exist_ok=True)
    data = {
        "messages": messages_to_dict(memory.chat_memory.messages)
    }
    with open(MEMORY_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

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
    