import ReactMarkdown from 'react-markdown';
import { User, Bot } from 'lucide-react';
import type { ChatMessage } from '@/utils/api';
import { cn } from '@/lib/utils';

interface MessageItemProps {
  message: ChatMessage;
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user';
  const isAmharic = message.language === 'AM';

  return (
    <div className={cn('group flex gap-4 py-5', isUser ? 'justify-end' : '')}>
      {!isUser && (
        <div className="shrink-0 w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center mt-0.5">
          <Bot size={14} className="text-primary" />
        </div>
      )}
      <div
        className={cn(
          'min-w-0 max-w-[65ch]',
          isUser ? 'text-right' : '',
          isAmharic ? 'font-ethiopic leading-relaxed' : '',
        )}
      >
        {isUser ? (
          <div className="inline-block text-left bg-primary text-primary-foreground px-4 py-2.5 rounded-xl rounded-tr-sm text-[15px] leading-relaxed">
            {message.content}
          </div>
        ) : (
          <div className="prose-chat text-foreground">
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="mb-3 last:mb-0">{children}</p>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-foreground">
                    {children}
                  </strong>
                ),
                ul: ({ children }) => (
                  <ul className="mb-3 ml-4 list-disc space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-3 ml-4 list-decimal space-y-1">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-foreground">{children}</li>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-primary/30 pl-4 italic text-muted-foreground my-3">
                    {children}
                  </blockquote>
                ),
                code: ({ children, className }) => {
                  const isBlock = className?.includes('language-');
                  if (isBlock) {
                    return (
                      <pre className="bg-secondary rounded-lg p-4 overflow-x-auto my-3 text-[13px]">
                        <code>{children}</code>
                      </pre>
                    );
                  }
                  return (
                    <code className="bg-secondary px-1.5 py-0.5 rounded text-[13px] font-mono">
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.sources.map((s, i) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-primary bg-primary/5 border border-primary/10 px-2 py-0.5 rounded-md"
              >
                [{i + 1}] p.{s.pageNumber}
              </span>
            ))}
          </div>
        )}
      </div>
      {isUser && (
        <div className="shrink-0 w-7 h-7 rounded-md bg-secondary flex items-center justify-center mt-0.5">
          <User size={14} className="text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex gap-4 py-5">
      <div className="shrink-0 w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
        <Bot size={14} className="text-primary" />
      </div>
      <div className="flex items-center gap-1.5 pt-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse-dot"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}
