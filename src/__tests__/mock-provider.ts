import type { ProviderBackend } from "../providers/types.js";
import type { RunConfig, StreamChunk } from "../types.js";

export type MockEvent = StreamChunk;

/**
 * Creates a mock provider that yields pre-configured events.
 * Use `setEvents` to configure what the next run/chat call returns.
 */
export function createMockProvider(initialEvents: MockEvent[] = []): {
  provider: ProviderBackend;
  setEvents(events: MockEvent[]): void;
  calls: { type: "run" | "chat"; prompt: string }[];
  closed: boolean;
} {
  let events = initialEvents;
  const calls: { type: "run" | "chat"; prompt: string }[] = [];
  let closed = false;

  function setEvents(newEvents: MockEvent[]) {
    events = newEvents;
  }

  async function* generate(prompt: string, type: "run" | "chat"): AsyncGenerator<StreamChunk> {
    calls.push({ type, prompt });
    for (const event of events) {
      yield event;
    }
  }

  const provider: ProviderBackend = {
    run(prompt: string, _config: RunConfig) {
      return generate(prompt, "run");
    },
    chat(message: string) {
      return generate(message, "chat");
    },
    async close() {
      closed = true;
    },
  };

  return {
    provider,
    setEvents,
    calls,
    get closed() {
      return closed;
    },
  };
}
