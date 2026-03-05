import type { Middleware, StreamChunk } from "../types.js";
import { defineMiddleware } from "./core.js";

export interface FilterOptions {
  /** Chunk types to drop */
  exclude?: StreamChunk["type"][];
  /** Chunk types to keep (exclusive with exclude) */
  include?: StreamChunk["type"][];
  /** Custom predicate (overrides include/exclude) */
  predicate?: (chunk: StreamChunk) => boolean;
}

export function filter(options: FilterOptions): Middleware {
  return defineMiddleware(async function* (stream) {
    for await (const chunk of stream) {
      if (options.predicate) {
        if (options.predicate(chunk)) yield chunk;
      } else if (options.include) {
        if (options.include.includes(chunk.type)) yield chunk;
      } else if (options.exclude) {
        if (!options.exclude.includes(chunk.type)) yield chunk;
      } else {
        yield chunk;
      }
    }
  });
}
