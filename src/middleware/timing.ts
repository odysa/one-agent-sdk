import type { Middleware } from "../types.js";
import { defineMiddleware } from "./core.js";

export interface TimingInfo {
  /** Time to first chunk of any type (ms) */
  timeToFirstChunk: number;
  /** Time to first text chunk (ms) */
  timeToFirstText: number | null;
  /** Total stream duration (ms) */
  duration: number;
}

export interface TimingOptions {
  /** Callback when first text chunk arrives */
  onFirstText?: (elapsed: number) => void;
  /** Callback when stream completes */
  onComplete?: (info: TimingInfo) => void;
}

export function timing(options: TimingOptions = {}): Middleware {
  return defineMiddleware(async function* (stream) {
    const start = performance.now();
    let firstChunk = false;
    let firstText = false;
    let timeToFirstChunk = 0;
    let timeToFirstText: number | null = null;

    for await (const chunk of stream) {
      const now = performance.now();

      if (!firstChunk) {
        firstChunk = true;
        timeToFirstChunk = now - start;
      }

      if (!firstText && chunk.type === "text") {
        firstText = true;
        timeToFirstText = now - start;
        options.onFirstText?.(timeToFirstText);
      }

      yield chunk;
    }

    const duration = performance.now() - start;
    options.onComplete?.({ timeToFirstChunk, timeToFirstText, duration });
  });
}
