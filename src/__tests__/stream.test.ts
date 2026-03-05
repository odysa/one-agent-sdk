import { describe, expect, test } from "bun:test";
import type { AgentDef, RunConfig, StreamChunk } from "../types.js";
import { createMockProvider } from "./mock-provider.js";

const agent: AgentDef = {
  name: "test-agent",
  description: "A test agent",
  prompt: "You are a test assistant.",
};

const config: RunConfig = { provider: "claude", agent };

describe("mock provider streaming", () => {
  test("yields text chunks in order", async () => {
    const events: StreamChunk[] = [
      { type: "text", text: "Hello " },
      { type: "text", text: "world" },
      { type: "done", text: "Hello world" },
    ];

    const { provider } = createMockProvider(events);
    const chunks: StreamChunk[] = [];

    for await (const chunk of provider.run("hi", config)) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual(events);
  });

  test("yields tool_call and tool_result", async () => {
    const events: StreamChunk[] = [
      {
        type: "tool_call",
        toolName: "get_weather",
        toolArgs: { city: "SF" },
        toolCallId: "call_1",
      },
      {
        type: "tool_result",
        toolCallId: "call_1",
        result: '{"temp": 72}',
      },
      { type: "text", text: "It's 72°F in SF." },
      { type: "done", text: "It's 72°F in SF." },
    ];

    const { provider } = createMockProvider(events);
    const chunks: StreamChunk[] = [];

    for await (const chunk of provider.run("weather in SF?", config)) {
      chunks.push(chunk);
    }

    expect(chunks).toHaveLength(4);
    expect(chunks[0].type).toBe("tool_call");
    expect(chunks[1].type).toBe("tool_result");
    expect(chunks[2].type).toBe("text");
    expect(chunks[3].type).toBe("done");
  });

  test("yields handoff events", async () => {
    const events: StreamChunk[] = [
      { type: "text", text: "Let me transfer you." },
      { type: "handoff", fromAgent: "researcher", toAgent: "math" },
      { type: "done", text: "Let me transfer you." },
    ];

    const { provider } = createMockProvider(events);
    const chunks: StreamChunk[] = [];

    for await (const chunk of provider.run("calculate 2+2", config)) {
      chunks.push(chunk);
    }

    const handoff = chunks.find((c) => c.type === "handoff");
    expect(handoff).toBeDefined();
    if (handoff?.type === "handoff") {
      expect(handoff.fromAgent).toBe("researcher");
      expect(handoff.toAgent).toBe("math");
    }
  });

  test("yields error events", async () => {
    const events: StreamChunk[] = [
      { type: "error", error: "Something went wrong" },
      { type: "done", text: "" },
    ];

    const { provider } = createMockProvider(events);
    const chunks: StreamChunk[] = [];

    for await (const chunk of provider.run("fail", config)) {
      chunks.push(chunk);
    }

    expect(chunks[0].type).toBe("error");
    if (chunks[0].type === "error") {
      expect(chunks[0].error).toBe("Something went wrong");
    }
  });

  test("yields done with usage info", async () => {
    const events: StreamChunk[] = [
      { type: "text", text: "Answer" },
      { type: "done", text: "Answer", usage: { inputTokens: 10, outputTokens: 20 } },
    ];

    const { provider } = createMockProvider(events);
    const chunks: StreamChunk[] = [];

    for await (const chunk of provider.run("q", config)) {
      chunks.push(chunk);
    }

    const done = chunks.find((c) => c.type === "done");
    expect(done).toBeDefined();
    if (done?.type === "done") {
      expect(done.usage?.inputTokens).toBe(10);
      expect(done.usage?.outputTokens).toBe(20);
    }
  });

  test("tracks run calls", async () => {
    const { provider, calls } = createMockProvider([{ type: "done", text: "" }]);

    // Consume the stream
    for await (const _ of provider.run("hello", config)) {
    }

    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual({ type: "run", prompt: "hello" });
  });

  test("chat sends follow-up messages", async () => {
    const mock = createMockProvider([
      { type: "text", text: "response" },
      { type: "done", text: "response" },
    ]);

    for await (const _ of mock.provider.chat("follow-up")) {
    }

    expect(mock.calls).toHaveLength(1);
    expect(mock.calls[0]).toEqual({ type: "chat", prompt: "follow-up" });
  });

  test("close marks provider as closed", async () => {
    const mock = createMockProvider();

    expect(mock.closed).toBe(false);
    await mock.provider.close();
    expect(mock.closed).toBe(true);
  });

  test("setEvents changes subsequent run output", async () => {
    const mock = createMockProvider([{ type: "text", text: "first" }, { type: "done" }]);

    const first: StreamChunk[] = [];
    for await (const c of mock.provider.run("a", config)) first.push(c);
    expect(first[0].type === "text" && first[0].text).toBe("first");

    mock.setEvents([{ type: "text", text: "second" }, { type: "done" }]);

    const second: StreamChunk[] = [];
    for await (const c of mock.provider.run("b", config)) second.push(c);
    expect(second[0].type === "text" && second[0].text).toBe("second");
  });

  test("empty events yields nothing", async () => {
    const { provider } = createMockProvider([]);
    const chunks: StreamChunk[] = [];

    for await (const chunk of provider.run("hello", config)) {
      chunks.push(chunk);
    }

    expect(chunks).toHaveLength(0);
  });
});
