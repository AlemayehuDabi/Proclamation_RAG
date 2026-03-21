function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve();
      return;
    }
    const t = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(t);
        resolve();
      },
      { once: true }
    );
  });
}

/**
 * Smoothly reveals text for non-streaming APIs (chunked updates, bounded time).
 * Aborts silently when `signal` is aborted.
 */
export async function revealText(
  full: string,
  onUpdate: (partial: string) => void,
  options?: { signal?: AbortSignal }
): Promise<void> {
  const signal = options?.signal;
  if (!full) {
    onUpdate("");
    return;
  }

  const step = full.length > 4000 ? 48 : full.length > 1500 ? 24 : 8;
  const delayMs = full.length > 4000 ? 4 : 10;

  let shown = 0;
  while (shown < full.length) {
    if (signal?.aborted) return;
    shown = Math.min(full.length, shown + step);
    onUpdate(full.slice(0, shown));
    if (shown < full.length) await sleep(delayMs, signal);
  }
}
