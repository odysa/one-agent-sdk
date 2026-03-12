import { z } from "zod";
import { agentTool, defineAgent, defineTool, run } from "../src/index.js";

// --- Sub-agent: a researcher that can search ---

const searchTool = defineTool({
  name: "search",
  description: "Search the web for information",
  parameters: z.object({ query: z.string() }),
  handler: async ({ query }) =>
    JSON.stringify({ results: [{ title: `Result for "${query}"`, snippet: "Mock result." }] }),
});

const researcher = defineAgent({
  name: "researcher",
  description: "Research agent that can search the web and summarize findings",
  prompt: "You are a research assistant. Use the search tool to find information, then summarize.",
  tools: [searchTool],
});

// --- Parent agent: an orchestrator that delegates to the researcher ---

const orchestrator = defineAgent({
  name: "orchestrator",
  description: "Orchestrator that delegates tasks to specialized agents",
  prompt:
    "You are an orchestrator. Use ask_researcher to delegate research tasks. Synthesize the results into a final answer.",
  tools: [
    agentTool(researcher, { provider: "openai" }),
  ],
});

// --- Run ---

async function main() {
  console.log("Running agent-as-tool example...\n");

  const { stream } = await run("What are the latest developments in quantum computing?", {
    provider: "openai",
    agent: orchestrator,
  });

  for await (const chunk of stream) {
    switch (chunk.type) {
      case "text":
        process.stdout.write(chunk.text);
        break;
      case "tool_call":
        console.log(`\n[tool: ${chunk.toolName}] ${JSON.stringify(chunk.toolArgs)}`);
        break;
      case "tool_result":
        console.log(`[result] ${chunk.result.slice(0, 200)}...`);
        break;
      case "done":
        console.log("\n[done]");
        break;
      case "error":
        console.error(`[error] ${chunk.error}`);
        break;
    }
  }
}

main().catch(console.error);
