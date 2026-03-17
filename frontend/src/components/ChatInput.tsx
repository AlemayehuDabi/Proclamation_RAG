import React, { useRef } from "react";
import { Send, CornerDownLeft } from "lucide-react";

interface ChatInputProps {
  onSend: (value: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = () => {
    const tx = textareaRef.current;
    if (tx) {
      tx.style.height = "auto";
      tx.style.height = Math.min(tx.scrollHeight, 200) + "px";
    }
  };

  const submit = () => {
    if (!textareaRef.current?.value.trim() || disabled) return;
    onSend(textareaRef.current.value.trim());
    textareaRef.current.value = "";
    textareaRef.current.style.height = "auto";
  };

  return (
    <div className="relative">
      <div className="flex items-end gap-2 bg-background border border-border p-2 rounded-xl focus-within:ring-2 ring-ring/20 transition-all shadow-soft">
        <textarea
          ref={textareaRef}
          rows={1}
          onInput={handleInput}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Ask a question in English or አማርኛ..."
          className="w-full bg-transparent border-none focus:outline-none focus:ring-0 resize-none py-2 px-3 text-[15px] max-h-[200px] placeholder:text-muted-foreground/60"
          disabled={disabled}
        />
        <button
          onClick={submit}
          disabled={disabled}
          className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-40 transition-all shrink-0"
        >
          <Send size={18} />
        </button>
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
        <CornerDownLeft size={10} />
        <span>Enter to send · Shift+Enter for new line</span>
      </div>
    </div>
  );
}
