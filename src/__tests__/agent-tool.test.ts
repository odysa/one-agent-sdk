import { afterEach, describe, expect, test } from "bun:test";
import { agentTool } from "../agent-tool.js";
import { clearProviders, registerProvider } from "../registry.js";
import type { AgentDef } from "../types.js";
import { createMockProvider } from "./mock-provider.js";

const subAgent: AgentDef = {
  name: "researcher",
  description: "Research agent that finds information",
  prompt: "You are a research assistant.",
};

afterEach(() => {
  clearProviders();
});

describe("agentTool", () => {
  test("returns a ToolDef with ask_ prefix", () => {
    const tool = agentTool(subAgent);
    expect(tool.name).toBe("ask_researcher");
    expect(tool.description).toBe("Research agent that finds information");
  });

  test("handler runs sub-agent and returns collected text", async () => {
    const { provider } = createMockProvider([
      { type: "text", text: "Hello " },
      { type: "text", text: "world" },
      { type: "done", text: "Hello world" },
    ]);
    registerProvider("mock", async () => provider);

    const tool = agentTool(subAgent, { provider: "mock" });
    const result = await tool.handler({ prompt: "test query" });
    expect(result).toBe("Hello world");
  });

  test("handler prefers done.text over accumulated text", async () => {
    const { provider } = createMockProvider([
      { type: "text", text: "streamed" },
      { type: "done", text: "final answer" },
    ]);
    registerProvider("mock", async () => provider);

    const tool = agentTool(subAgent, { provider: "mock" });
    const result = await tool.handler({ prompt: "test" });
    expect(result).toBe("final answer");
  });

  test("handler falls back to accumulated text when done.text is absent", async () => {
    const { provider } = createMockProvider([
      { type: "text", text: "accumulated " },
      { type: "text", text: "text" },
      { type: "done" },
    ]);
    registerProvider("mock", async () => provider);

    const tool = agentTool(subAgent, { provider: "mock" });
    const result = await tool.handler({ prompt: "test" });
    expect(result).toBe("accumulated text");
  });

  test("handler returns '(no output)' when sub-agent produces nothing", async () => {
    const { provider } = createMockProvider([{ type: "done" }]);
    registerProvider("mock", async () => provider);

    const tool = agentTool(subAgent, { provider: "mock" });
    const result = await tool.handler({ prompt: "test" });
    expect(result).toBe("(no output)");
  });

  test("closes the provider backend after run", async () => {
    const mock = createMockProvider([{ type: "done" }]);
    registerProvider("mock", async () => mock.provider);

    const tool = agentTool(subAgent, { provider: "mock" });
    await tool.handler({ prompt: "test" });
    expect(mock.closed).toBe(true);
  });

  test("closes the provider backend even on error", async () => {
    const errorProvider = {
      run() {
        return (async function* () {
          yield { type: "error" as const, error: "about to throw" };
          throw new Error("boom");
        })();
      },
      chat() {
        return (async function* () {
          yield { type: "done" as const };
        })();
      },
      async close() {
        closeCalled = true;
      },
    };
    let closeCalled = false;
    registerProvider("err-mock", async () => errorProvider);

    const tool = agentTool(subAgent, { provider: "err-mock" });
    await expect(tool.handler({ prompt: "test" })).rejects.toThrow("boom");
    expect(closeCalled).toBe(true);
  });

  test("passes maxTurns option to config", async () => {
    const { provider, calls } = createMockProvider([{ type: "done" }]);
    registerProvider("mock", async () => provider);

    const tool = agentTool(subAgent, { provider: "mock", maxTurns: 5 });
    await tool.handler({ prompt: "test" });
    expect(calls.length).toBe(1);
  });
});
