import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Plus,
  MessageSquare,
  Settings,
  PanelLeftClose,
  PanelLeft,
  FileText,
} from 'lucide-react';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ChatInput } from '@/components/ChatInput';
import { MessageItem, TypingIndicator } from '@/components/MessageItem';
import { SourcePanel } from '@/components/SourcePanel';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { Language, ChatMessage, Source, ChatSession } from '@/utils/api';
import { queryRAG } from '@/utils/api';
import { cn } from '@/lib/utils';

const mockHistory: ChatSession[] = [
  {
    id: '1',
    title: 'Analysis of Ethiopian Trade Policy',
    createdAt: new Date(),
  },
  { id: '2', title: 'የኢትዮጵያ ኢኮኖሚ ዕድገት ትንተና', createdAt: new Date() },
  { id: '3', title: 'Infrastructure Investment Review', createdAt: new Date() },
  { id: '4', title: 'Agricultural Export Data 2024', createdAt: new Date() },
];

export default function ChatPage() {
  const [lang, setLang] = useState<Language>('EN');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeSources, setActiveSources] = useState<Source[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sourcePanelOpen, setSourcePanelOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming, scrollToBottom]);

  const handleSend = async (content: string) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      language: lang,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);

    const assistantId = crypto.randomUUID();

    try {
      await queryRAG(
        content,
        lang,
        (chunk) => {
          setMessages((prev) => {
            const existing = prev.find((m) => m.id === assistantId);
            if (existing) {
              return prev.map((m) =>
                m.id === assistantId ? { ...m, content: chunk } : m,
              );
            }
            return [
              ...prev,
              {
                id: assistantId,
                role: 'assistant' as const,
                content: chunk,
                language: lang,
                sources: [],
              },
            ];
          });
        },
        (sources) => {
          setActiveSources(sources);
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, sources } : m)),
          );
        },
      );
    } catch {
      // error handled via toast in production
    } finally {
      setIsStreaming(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setActiveSources([]);
  };

  const isEmpty = messages.length === 0;

  return (
    <main className="flex h-svh bg-background overflow-hidden">
      {/* Left Sidebar — History */}
      <aside
        className={cn(
          'border-r border-border/50 surface-sunken flex-col transition-all duration-200',
          sidebarOpen ? 'w-64 flex' : 'w-0 hidden',
        )}
      >
        <div className="p-3 border-b border-border/50">
          <button
            onClick={handleNewChat}
            className="w-full py-2 px-4 bg-background border border-border rounded-lg text-[13px] font-medium hover:bg-secondary transition-colors flex items-center gap-2 justify-center"
          >
            <Plus size={14} />
            New Research
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Recent
          </p>
          {mockHistory.map((session) => (
            <button
              key={session.id}
              className="w-full text-left px-3 py-2 text-[13px] text-muted-foreground truncate hover:bg-secondary rounded-md cursor-pointer transition-colors flex items-center gap-2"
            >
              <MessageSquare size={12} className="shrink-0" />
              <span className="truncate">{session.title}</span>
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-border/50 flex items-center gap-2">
          <ThemeToggle />
          <button className="p-2 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
            <Settings size={16} />
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <section className="flex-1 flex flex-col relative min-w-0">
        <header className="h-14 border-b border-border/50 flex items-center justify-between px-4 bg-background/80 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground"
            >
              {sidebarOpen ? (
                <PanelLeftClose size={16} />
              ) : (
                <PanelLeft size={16} />
              )}
            </button>
            <div className="h-5 w-px bg-border" />
            <h1 className="text-[13px] font-bold tracking-tight text-foreground">
              BILINGUAL RAG
            </h1>
            <LanguageSelector value={lang} onChange={setLang} />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSourcePanelOpen(!sourcePanelOpen)}
              className={cn(
                'p-1.5 rounded-md hover:bg-secondary transition-colors hidden lg:flex',
                sourcePanelOpen ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <FileText size={16} />
            </button>
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest hidden sm:inline">
              System Ready
            </span>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                <MessageSquare size={22} className="text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Interrogate your documents
              </h2>
              <p className="text-[15px] text-muted-foreground max-w-md leading-relaxed">
                in <span className="font-medium text-foreground">English</span>{' '}
                and{' '}
                <span className="font-ethiopic font-medium text-foreground">
                  አማርኛ
                </span>
              </p>
              <div className="mt-8 flex flex-wrap gap-2 justify-center max-w-lg">
                {[
                  lang === 'EN'
                    ? 'Summarize the trade policy report'
                    : 'የንግድ ፖሊሲ ሪፖርቱን ጠቅለል አድርግ',
                  lang === 'EN'
                    ? 'What are the key economic indicators?'
                    : 'ዋና ዋና የኢኮኖሚ አመልካቾች ምንድን ናቸው?',
                  lang === 'EN'
                    ? 'Compare infrastructure investments'
                    : 'የመሠረተ ልማት ኢንቨስትመንቶችን አነጻጽር',
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="text-[13px] px-4 py-2 bg-secondary hover:bg-accent border border-border/50 rounded-lg text-foreground transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="pt-6 pb-40 px-4 md:px-0">
              <div className="max-w-2xl mx-auto w-full divide-y divide-border/30">
                {messages.map((msg) => (
                  <MessageItem key={msg.id} message={msg} />
                ))}
                {isStreaming &&
                  !messages.find(
                    (m) => m.role === 'assistant' && m.content === '',
                  ) && <TypingIndicator />}
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none">
          <div className="max-w-2xl mx-auto pointer-events-auto">
            <ChatInput onSend={handleSend} disabled={isStreaming} />
          </div>
        </div>
      </section>

      {/* Right Sidebar — Sources */}
      <aside
        className={cn(
          'border-l border-border/50 surface-sunken overflow-y-auto transition-all duration-200',
          sourcePanelOpen ? 'w-80 hidden lg:block' : 'w-0 hidden',
        )}
      >
        <div className="p-4 border-b border-border/50 sticky top-0 bg-background/50 backdrop-blur-sm z-10">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Source Documents
          </h2>
          {activeSources.length > 0 && (
            <p className="text-[11px] text-muted-foreground mt-1">
              {activeSources.length} citations found
            </p>
          )}
        </div>
        <SourcePanel sources={activeSources} />
      </aside>
    </main>
  );
}
