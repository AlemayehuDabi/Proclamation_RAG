from langchain.chains import ConversationalRetrievalChain
from src.retriever import get_retriever
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
import os
import yaml
from langchain_core.prompts import SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain.prompts import ChatPromptTemplate
from src.save_load_conversation import load_memory

load_dotenv()

def create_rag_pipeline():
    retriever = get_retriever()
    groq_api_key = os.getenv("GOOGLE_API_KEY")
    if not groq_api_key:
        raise ValueError(
            "❌ GOOGLE_API_KEY is not set. Please add it to your .env file!"
        )
    # load the system prompt
    with open("prompts/prompts.yaml", "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    system_prompt = config["system_prompt"]
        
    # build prompt template
    system_message = SystemMessagePromptTemplate.from_template(system_prompt)
    human_message = HumanMessagePromptTemplate.from_template("{question}\n\nContext:\n{context}")
    
    chat_prompt = chat_prompt = ChatPromptTemplate.from_messages([
        system_message,
        human_message
    ])
        
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash",
        temperature=0.5)
    
    memory = load_memory(llm)
    
    qa_chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=retriever,
        memory=memory,
        return_source_documents=True,
        combine_docs_chain_kwargs={"prompt": chat_prompt}
    )
    
    return qa_chain

# this only works while the terminal is running(meaning in the ram), if the terminal stoped or closed it will not work,
# for that we have to persist the conversation data inside real db(sql, no-sql) or inside the project in json format!