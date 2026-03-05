import type { Middleware } from "../types.js";
import { defineMiddleware } from "./core.js";

export interface UsageStats {
  inputTokens: number;
  outputTokens: number;
  requests: number;
}

export interface UsageTrackerOptions {
  /** Callback fired after each done chunk with cumulative stats */
  onUsage?: (stats: UsageStats) => void;
}

export interface UsageTrackerHandle {
  middleware: Middleware;
  getStats(): UsageStats;
  reset(): void;
}

export function usageTracker(options: UsageTrackerOptions = {}): UsageTrackerHandle {
  let stats: UsageStats = { inputTokens: 0, outputTokens: 0, requests: 0 };

  const middleware = defineMiddleware(async function* (stream) {
    for await (const chunk of stream) {
      if (chunk.type === "done" && chunk.usage) {
        stats.inputTokens += chunk.usage.inputTokens;
        stats.outputTokens += chunk.usage.outputTokens;
        stats.requests += 1;
        options.onUsage?.({ ...stats });
      }
      yield chunk;
    }
  });

  return {
    middleware,
    getStats: () => ({ ...stats }),
    reset: () => {
      stats = { inputTokens: 0, outputTokens: 0, requests: 0 };
    },
  };
}
