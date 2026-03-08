import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { defineAgent } from "../agent.js";
import { defineTool } from "../tool.js";
import { buildToolMap } from "../utils/tool-map.js";

describe("buildToolMap", () => {
  test("creates map from agent tools", () => {
    const tool1 = defineTool({
      name: "search",
      description: "Search",
      parameters: z.object({ q: z.string() }),
      handler: async () => "results",
    });
    const tool2 = defineTool({
      name: "calc",
      description: "Calculate",
      parameters: z.object({ expr: z.string() }),
      handler: async () => "42",
    });

    const agent = defineAgent({
      name: "assistant",
      description: "Helper",
      prompt: "Help.",
      tools: [tool1, tool2],
    });

    const map = buildToolMap(agent);
    expect(map.size).toBe(2);
    expect(map.get("search")).toBe(tool1);
    expect(map.get("calc")).toBe(tool2);
  });

  test("returns empty map for agent with no tools", () => {
    const agent = defineAgent({
      name: "assistant",
      description: "Helper",
      prompt: "Help.",
    });

    const map = buildToolMap(agent);
    expect(map.size).toBe(0);
  });
});
