export type Language = "EN" | "AM";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  language?: Language;
  /** Epoch ms */
  createdAt?: number;
}

export interface Source {
  id: string;
  title: string;
  snippet: string;
  pageNumber?: number;
  relevance?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  lastMessage?: string;
  createdAt: Date;
  /** Saved when starting a new chat — used to restore sidebar sessions */
  messages?: ChatMessage[];
}
