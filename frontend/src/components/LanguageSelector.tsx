import { cn } from "@/lib/utils";
import type { Language } from "@/utils/api";

interface LanguageSelectorProps {
  value: Language;
  onChange: (v: Language) => void;
}

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  return (
    <div className="flex items-center gap-0.5 bg-secondary p-0.5 rounded-md border border-border/50">
      {(["EN", "AM"] as const).map((lang) => (
        <button
          key={lang}
          onClick={() => onChange(lang)}
          className={cn(
            "px-3 py-1 text-[11px] font-bold transition-all rounded-sm tracking-wide",
            value === lang
              ? "bg-background shadow-soft text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {lang === "EN" ? "ENGLISH" : "አማርኛ"}
        </button>
      ))}
    </div>
  );
}
