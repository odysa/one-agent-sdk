import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { defineAgent } from "../agent.js";
import { defineTool } from "../tool.js";
import { handoffToolName, parseHandoff } from "../utils/handoff.js";

describe("defineTool()", () => {
  test("returns the tool definition unchanged", () => {
    const handler = async ({ x }: { x: number }) => String(x);
    const tool = defineTool({
      name: "add",
      description: "Add numbers",
      parameters: z.object({ x: z.number() }),
      handler,
    });

    expect(tool.name).toBe("add");
    expect(tool.description).toBe("Add numbers");
    expect(tool.handler).toBe(handler);
  });

  test("handler receives parsed params", async () => {
    const tool = defineTool({
      name: "echo",
      description: "Echo text",
      parameters: z.object({ text: z.string() }),
      handler: async ({ text }) => `echo: ${text}`,
    });

    const result = await tool.handler({ text: "hello" });
    expect(result).toBe("echo: hello");
  });
});

describe("defineAgent()", () => {
  test("returns the agent definition unchanged", () => {
    const agent = defineAgent({
      name: "assistant",
      description: "A helper",
      prompt: "You help people.",
    });

    expect(agent.name).toBe("assistant");
    expect(agent.description).toBe("A helper");
    expect(agent.prompt).toBe("You help people.");
    expect(agent.tools).toBeUndefined();
    expect(agent.handoffs).toBeUndefined();
  });

  test("includes tools and handoffs when provided", () => {
    const tool = defineTool({
      name: "search",
      description: "Search the web",
      parameters: z.object({ query: z.string() }),
      handler: async () => "results",
    });

    const agent = defineAgent({
      name: "researcher",
      description: "Research agent",
      prompt: "You research things.",
      tools: [tool],
      handoffs: ["math"],
      model: "gpt-4",
    });

    expect(agent.tools).toHaveLength(1);
    expect(agent.tools?.[0].name).toBe("search");
    expect(agent.handoffs).toEqual(["math"]);
    expect(agent.model).toBe("gpt-4");
  });

  test("includes mcpServers when provided", () => {
    const agent = defineAgent({
      name: "mcp-agent",
      description: "Agent with MCP",
      prompt: "Use MCP.",
      mcpServers: {
        fs: { command: "npx", args: ["-y", "@modelcontextprotocol/server-filesystem"] },
      },
    });

    expect(agent.mcpServers).toBeDefined();
    expect(agent.mcpServers?.fs.command).toBe("npx");
  });
});

describe("handoff utilities", () => {
  test("handoffToolName creates correct name", () => {
    expect(handoffToolName("math")).toBe("transfer_to_math");
    expect(handoffToolName("researcher")).toBe("transfer_to_researcher");
  });

  test("parseHandoff extracts agent name", () => {
    expect(parseHandoff("transfer_to_math")).toBe("math");
    expect(parseHandoff("transfer_to_researcher")).toBe("researcher");
  });

  test("parseHandoff returns null for non-handoff tools", () => {
    expect(parseHandoff("get_weather")).toBeNull();
    expect(parseHandoff("search")).toBeNull();
    expect(parseHandoff("transfer_from_math")).toBeNull();
  });

  test("roundtrip: handoffToolName -> parseHandoff", () => {
    const name = "complex-agent_v2";
    expect(parseHandoff(handoffToolName(name))).toBe(name);
  });
});
