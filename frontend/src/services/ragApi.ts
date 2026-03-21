import { getApiBaseUrl } from "@/config/env";
import { apiRequest } from "@/services/httpClient";
import type { Source } from "@/utils/api";

export interface QueryResponseDto {
  answer: string;
  sources: number[];
  articles: string[];
}

export async function postRagQuery(question: string): Promise<QueryResponseDto> {
  return apiRequest<QueryResponseDto>("/query", {
    method: "POST",
    body: JSON.stringify({ question }),
  });
}

/** Liveness: API process is up. */
export async function getHealth(): Promise<boolean> {
  try {
    const r = await fetch(`${getApiBaseUrl()}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(8_000),
    });
    return r.ok;
  } catch {
    return false;
  }
}

/**
 * Readiness: vector store built. Treats 503 as "not ready" without throwing.
 */
export async function getReadyState(): Promise<{
  reachable: boolean;
  vectorReady: boolean;
  message?: string;
}> {
  const url = `${getApiBaseUrl()}/ready`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    const data = (await res.json().catch(() => ({}))) as {
      status?: string;
      detail?: string;
      vectorstore?: string;
    };
    if (res.ok && data.status === "ready") {
      return { reachable: true, vectorReady: true };
    }
    return {
      reachable: true,
      vectorReady: false,
      message: data.detail || data.status || `HTTP ${res.status}`,
    };
  } catch (e) {
    return {
      reachable: false,
      vectorReady: false,
      message: e instanceof Error ? e.message : "Cannot reach API",
    };
  }
}

/** Map backend citations to UI sources (no snippets from API — synthetic labels). */
export function mapQueryResponseToSources(dto: QueryResponseDto): Source[] {
  const pages = dto.sources ?? [];
  const articles = dto.articles ?? [];
  const n = Math.max(pages.length, articles.length, 0);
  if (n === 0) return [];

  const out: Source[] = [];
  for (let i = 0; i < n; i++) {
    const page = pages[i];
    const article = articles[i];
    const title =
      article?.trim() ||
      (page != null ? `Proclamation — page ${page}` : `Reference ${i + 1}`);
    const snippetParts: string[] = [];
    if (page != null) snippetParts.push(`Page ${page}`);
    if (article?.trim()) snippetParts.push(article.trim());
    out.push({
      id: `rag-${i}-${page ?? "p"}-${article ?? "a"}`,
      title,
      snippet:
        snippetParts.length > 0
          ? `Startup Proclamation RAG · ${snippetParts.join(" · ")}`
          : "Citation from retrieved proclamation chunks.",
      pageNumber: page,
    });
  }
  return out;
}
