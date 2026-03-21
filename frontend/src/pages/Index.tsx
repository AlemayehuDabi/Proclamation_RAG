import { useRef, useEffect, useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  MessageSquare,
  Settings,
  PanelLeftClose,
  PanelLeft,
  FileText,
} from "lucide-react";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ChatInput } from "@/components/ChatInput";
import { MessageItem, TypingIndicator } from "@/components/MessageItem";
import { SourcePanel } from "@/components/SourcePanel";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getHealth, getReadyState } from "@/services/ragApi";
import { useChatStore } from "@/stores/chatStore";
import { cn } from "@/lib/utils";

export default function ChatPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sourcePanelOpen, setSourcePanelOpen] = useState(true);

  const lang = useChatStore((s) => s.lang);
  const setLang = useChatStore((s) => s.setLang);
  const messages = useChatStore((s) => s.messages);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const newChat = useChatStore((s) => s.newChat);
  const openSession = useChatStore((s) => s.openSession);
  const sessions = useChatStore((s) => s.sessions);
  const activeSources = useChatStore((s) => s.activeSources);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const isThinking = useChatStore((s) => s.isThinking);

  const { data: apiState } = useQuery({
    queryKey: ["api-health-ready"],
    queryFn: async () => {
      const up = await getHealth();
      const ready = await getReadyState();
      return { up, ...ready };
    },
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, isStreaming, scrollToBottom]);

  const handleSend = (content: string) => {
    void sendMessage(content);
  };

  const handleNewChat = () => {
    newChat();
  };

  const isEmpty = messages.length === 0;

  const statusDot =
    apiState == null ? (
      <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-pulse" />
    ) : !apiState.up || !apiState.reachable ? (
      <span className="h-2 w-2 rounded-full bg-destructive" title={apiState.message} />
    ) : !apiState.vectorReady ? (
      <span
        className="h-2 w-2 rounded-full bg-amber-500"
        title={apiState.message || "Vector store not ready"}
      />
    ) : (
      <span className="h-2 w-2 rounded-full bg-emerald-500" />
    );

  const statusLabel =
    apiState == null
      ? "Checking…"
      : !apiState.up || !apiState.reachable
        ? "API offline"
        : !apiState.vectorReady
          ? "Ingestion needed"
          : "System ready";

  return (
    <main className="flex h-svh bg-background overflow-hidden">
      <aside
        className={cn(
          "border-r border-border/50 surface-sunken flex-col transition-all duration-200",
          sidebarOpen ? "w-64 flex" : "w-0 hidden"
        )}
      >
        <div className="p-3 border-b border-border/50">
          <button
            onClick={handleNewChat}
            className="w-full py-2 px-4 bg-background border border-border rounded-lg text-[13px] font-medium hover:bg-secondary transition-colors flex items-center gap-2 justify-center"
          >
            <Plus size={14} />
            New chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Recent
          </p>
          {sessions.length === 0 ? (
            <p className="px-3 py-2 text-[12px] text-muted-foreground leading-relaxed">
              Past chats appear here when you start a new conversation.
            </p>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => openSession(session.id)}
                className="w-full text-left px-3 py-2 text-[13px] text-muted-foreground truncate hover:bg-secondary rounded-md cursor-pointer transition-colors flex items-center gap-2"
              >
                <MessageSquare size={12} className="shrink-0" />
                <span className="truncate">{session.title}</span>
              </button>
            ))
          )}
        </div>

        <div className="p-3 border-t border-border/50 flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            className="p-2 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </aside>

      <section className="flex-1 flex flex-col relative min-w-0">
        <header className="h-14 border-b border-border/50 flex items-center justify-between px-4 bg-background/80 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground shrink-0"
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
            </button>
            <div className="h-5 w-px bg-border shrink-0" />
            <h1 className="text-[13px] font-bold tracking-tight text-foreground truncate">
              Startup Proclamation RAG
            </h1>
            <LanguageSelector value={lang} onChange={setLang} />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setSourcePanelOpen(!sourcePanelOpen)}
              className={cn(
                "p-1.5 rounded-md hover:bg-secondary transition-colors hidden lg:flex",
                sourcePanelOpen ? "text-primary" : "text-muted-foreground"
              )}
              aria-label="Toggle sources"
            >
              <FileText size={16} />
            </button>
            {statusDot}
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest hidden sm:inline max-w-[120px] truncate">
              {statusLabel}
            </span>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center min-h-full px-6 py-24 text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 animate-in fade-in duration-500">
                <MessageSquare size={22} className="text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                Ask the proclamation
              </h2>
              <p className="text-[15px] text-muted-foreground max-w-md leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-500 delay-75 fill-mode-both">
                Query in <span className="font-medium text-foreground">English</span> or{" "}
                <span className="font-ethiopic font-medium text-foreground">አማርኛ</span>
                — answers use retrieved articles and page citations.
              </p>
              <div className="mt-8 flex flex-wrap gap-2 justify-center max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 fill-mode-both">
                {[
                  lang === "EN"
                    ? "What rights do startup founders have?"
                    : "የስታርታፕ መስራቾች መብቶች ምንድን ናቸው?",
                  lang === "EN"
                    ? "Summarize tax incentives for startups"
                    : "ለስታርታፖች የታክስ ማበረታቻ ማጠቃለያ",
                  lang === "EN"
                    ? "How is intellectual property treated?"
                    : "የአእምሮ ንብረት ጉዳዮች እንዴት ይተነባሉ?",
                ].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSend(q)}
                    disabled={isStreaming}
                    className="text-[13px] px-4 py-2 bg-secondary hover:bg-accent border border-border/50 rounded-lg text-foreground transition-colors disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="pt-6 pb-40 px-4 md:px-6">
              <div className="max-w-2xl mx-auto w-full space-y-0">
                {messages.map((msg) => (
                  <MessageItem key={msg.id} message={msg} />
                ))}
                {isThinking && <TypingIndicator label="Thinking" />}
              </div>
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none">
          <div className="max-w-2xl mx-auto pointer-events-auto">
            <ChatInput onSend={handleSend} disabled={isStreaming} />
          </div>
        </div>
      </section>

      <aside
        className={cn(
          "border-l border-border/50 surface-sunken overflow-y-auto transition-all duration-200",
          sourcePanelOpen ? "w-80 hidden lg:block" : "w-0 hidden"
        )}
      >
        <div className="p-4 border-b border-border/50 sticky top-0 bg-background/50 backdrop-blur-sm z-10">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Citations
          </h2>
          {activeSources.length > 0 && (
            <p className="text-[11px] text-muted-foreground mt-1">
              {activeSources.length} reference{activeSources.length === 1 ? "" : "s"}
            </p>
          )}
        </div>
        <SourcePanel sources={activeSources} />
      </aside>
    </main>
  );
}
