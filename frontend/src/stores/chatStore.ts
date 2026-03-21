import { create } from "zustand";
import { toast } from "sonner";
import { revealText } from "@/lib/revealText";
import { ApiError } from "@/services/httpClient";
import { mapQueryResponseToSources, postRagQuery } from "@/services/ragApi";
import type { ChatMessage, ChatSession, Language, Source } from "@/utils/api";

let revealAbort: AbortController | null = null;

function titleFromMessages(msgs: ChatMessage[]): string {
  const u = msgs.find((m) => m.role === "user");
  const raw = u?.content?.trim() || "New chat";
  return raw.length > 48 ? `${raw.slice(0, 48)}…` : raw;
}

interface ChatState {
  lang: Language;
  setLang: (l: Language) => void;
  messages: ChatMessage[];
  activeSources: Source[];
  isStreaming: boolean;
  isThinking: boolean;
  error: string | null;
  sessions: ChatSession[];

  sendMessage: (content: string) => Promise<void>;
  newChat: () => void;
  openSession: (id: string) => void;
  clearError: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  lang: "EN",
  setLang: (l) => set({ lang: l }),
  messages: [],
  activeSources: [],
  isStreaming: false,
  isThinking: false,
  error: null,
  sessions: [],

  clearError: () => set({ error: null }),

  newChat: () => {
    revealAbort?.abort();
    revealAbort = null;
    const { messages, sessions } = get();
    if (messages.length > 0) {
      const id = crypto.randomUUID();
      const next: ChatSession = {
        id,
        title: titleFromMessages(messages),
        createdAt: new Date(),
        lastMessage: messages[messages.length - 1]?.content,
        messages: messages.map((m) => ({ ...m })),
      };
      set({
        messages: [],
        activeSources: [],
        error: null,
        isStreaming: false,
        isThinking: false,
        sessions: [next, ...sessions].slice(0, 40),
      });
      return;
    }
    set({
      messages: [],
      activeSources: [],
      error: null,
      isStreaming: false,
      isThinking: false,
    });
  },

  openSession: (id) => {
    revealAbort?.abort();
    revealAbort = null;
    const s = get().sessions.find((x) => x.id === id);
    if (!s?.messages?.length) return;
    const lastAssistant = [...s.messages].reverse().find((m) => m.role === "assistant");
    set({
      messages: s.messages.map((m) => ({ ...m })),
      activeSources: lastAssistant?.sources ?? [],
      error: null,
      isStreaming: false,
      isThinking: false,
    });
  },

  sendMessage: async (content) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    revealAbort?.abort();
    revealAbort = new AbortController();
    const signal = revealAbort.signal;

    const lang = get().lang;
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      language: lang,
      createdAt: Date.now(),
    };

    const assistantId = crypto.randomUUID();

    set((s) => ({
      messages: [...s.messages, userMsg],
      activeSources: [],
      isStreaming: true,
      isThinking: true,
      error: null,
    }));

    try {
      const dto = await postRagQuery(trimmed);
      const answer =
        typeof dto.answer === "string" && dto.answer.trim()
          ? dto.answer.trim()
          : "_No answer was returned. Try rephrasing or check that ingestion completed._";

      const sources = mapQueryResponseToSources(dto);
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        language: lang,
        sources,
        createdAt: Date.now(),
      };

      set((s) => ({
        isThinking: false,
        activeSources: sources,
        messages: [...s.messages, assistantMsg],
      }));

      await revealText(
        answer,
        (partial) => {
          set((s) => ({
            messages: s.messages.map((m) =>
              m.id === assistantId ? { ...m, content: partial } : m
            ),
          }));
        },
        { signal }
      );
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.status === 503
            ? "Knowledge base is not ready. Run ingestion on the server, then retry."
            : e.message
          : e instanceof Error
            ? e.message
            : "Something went wrong";

      toast.error(msg);
      set((s) => ({
        isThinking: false,
        error: msg,
        messages: [
          ...s.messages,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `**Could not complete request**\n\n${msg}`,
            language: lang,
            createdAt: Date.now(),
          },
        ],
      }));
    } finally {
      set({ isStreaming: false, isThinking: false });
    }
  },
}));
