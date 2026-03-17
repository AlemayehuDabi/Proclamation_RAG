import { FileText, Hash } from "lucide-react";
import type { Source } from "@/utils/api";

interface SourcePanelProps {
  sources: Source[];
}

export function SourcePanel({ sources }: SourcePanelProps) {
  if (sources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-6">
        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-3">
          <FileText size={18} className="text-muted-foreground" />
        </div>
        <p className="text-[13px] text-muted-foreground">
          Source documents will appear here when you submit a query.
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2">
      {sources.map((source, i) => (
        <div
          key={source.id}
          className="p-3 bg-background border border-border/50 rounded-lg hover:border-primary/20 transition-colors cursor-pointer group"
        >
          <div className="flex items-start gap-2 mb-2">
            <span className="shrink-0 w-5 h-5 rounded bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center">
              {i + 1}
            </span>
            <h3 className="text-[13px] font-medium text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {source.title}
            </h3>
          </div>
          <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-3 ml-7">
            {source.snippet}
          </p>
          <div className="flex items-center gap-3 mt-2 ml-7">
            {source.pageNumber && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Hash size={10} />
                Page {source.pageNumber}
              </span>
            )}
            {source.relevance && (
              <span className="text-[11px] text-primary font-medium">
                {Math.round(source.relevance * 100)}% match
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
