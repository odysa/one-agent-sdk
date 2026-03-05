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
  const check: (chunk: StreamChunk) => boolean = options.predicate
    ? options.predicate
    : options.include
      ? ((s) => {
          const set = new Set<string>(s);
          return (c: StreamChunk) => set.has(c.type);
        })(options.include)
      : options.exclude
        ? ((s) => {
            const set = new Set<string>(s);
            return (c: StreamChunk) => !set.has(c.type);
          })(options.exclude)
        : () => true;

  return defineMiddleware(async function* (stream) {
    for await (const chunk of stream) {
      if (check(chunk)) yield chunk;
    }
  });
}
