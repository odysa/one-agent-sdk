import type { Middleware, StreamChunk } from "../types.js";
import { defineMiddleware } from "./core.js";

export interface HooksOptions {
  onText?: (chunk: Extract<StreamChunk, { type: "text" }>) => void;
  onToolCall?: (chunk: Extract<StreamChunk, { type: "tool_call" }>) => void;
  onToolResult?: (chunk: Extract<StreamChunk, { type: "tool_result" }>) => void;
  onHandoff?: (chunk: Extract<StreamChunk, { type: "handoff" }>) => void;
  onError?: (chunk: Extract<StreamChunk, { type: "error" }>) => void;
  onDone?: (chunk: Extract<StreamChunk, { type: "done" }>) => void;
  /** Catch-all callback for every chunk */
  onChunk?: (chunk: StreamChunk) => void;
}

export function hooks(options: HooksOptions): Middleware {
  return defineMiddleware(async function* (stream) {
    for await (const chunk of stream) {
      options.onChunk?.(chunk);

      switch (chunk.type) {
        case "text":
          options.onText?.(chunk);
          break;
        case "tool_call":
          options.onToolCall?.(chunk);
          break;
        case "tool_result":
          options.onToolResult?.(chunk);
          break;
        case "handoff":
          options.onHandoff?.(chunk);
          break;
        case "error":
          options.onError?.(chunk);
          break;
        case "done":
          options.onDone?.(chunk);
          break;
      }

      yield chunk;
    }
  });
}
