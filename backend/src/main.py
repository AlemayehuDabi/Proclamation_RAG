# import resource
# from tokenize import String
from pydantic import BaseModel
from src.rag_pipeline import create_rag_pipeline
# from save_load_conversation import save_memory, display_memory
from fastapi import FastAPI

app = FastAPI()

class Question(BaseModel):
    question: str

@app.post("/ask_rag")
def ask_rag(question: Question):
    # print("📚 RAG Assistant (type 'exit' to quit)\n")
    
    qa = create_rag_pipeline()
    # display_memory(qa.memory)
    
    # while True:
        # query = input(">> You: ")
        # receive payload
    query = question.question

        # if query.lower() in ["exit", "quit"]:
        #     print("👋 Goodbye!")
        #     save_memory(qa.memory)
        #     break

    result = qa.invoke({"question": query})
    answer = result["answer"]

        # sources = result.get("source_documents", [])

        # print("\n🤖 Assistant:", answer)
        # if sources:
        #     print("\n📖 Sources:")
        #     for doc in sources:
        #         print(f" - {doc.metadata.get('source', 'Unknown')}")
        # print("-" * 50)

    return {
            "anwser": answer,
    }

# if __name__ == "__main__":
#     run_cli()
