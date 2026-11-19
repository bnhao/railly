/**
 * Yields control back to the browser main thread so pending user interactions
 * and paint frames are never blocked by long synchronous loops.
 *
 * Uses `scheduler.yield()` where supported (placing continuations at the front
 * of the task queue) and gracefully falls back to `setTimeout(..., 0)` in
 * browsers without Scheduler API support (e.g. Safari).
 */
export async function yieldToMain(): Promise<void> {
  if (
    typeof window !== "undefined" &&
    "scheduler" in window &&
    typeof (window as Window & { scheduler?: { yield?: () => Promise<void> } })
      .scheduler?.yield === "function"
  ) {
    await (
      window as Window & { scheduler: { yield: () => Promise<void> } }
    ).scheduler.yield();
    return;
  }

  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}
