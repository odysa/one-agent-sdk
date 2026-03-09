import { z } from "zod";
import type { AgentDef, RunConfig, StreamChunk, ToolDef } from "./types.js";
import { createProvider } from "./utils/create-provider.js";

export interface AgentToolOptions {
  /** Provider to use for the sub-agent. Inherits from parent RunConfig if omitted. */
  provider?: RunConfig["provider"];
  /** Provider-specific options for the sub-agent run. */
  providerOptions?: Record<string, unknown>;
  /** Maximum turns for the sub-agent's tool loop. Defaults to 50. */
  maxTurns?: number;
}

/**
 * Wrap an AgentDef as a ToolDef.
 *
 * Unlike handoffs (which transfer control permanently), agent-as-tool runs the
 * target agent as a subtask: it receives a prompt, runs to completion, and
 * returns the collected text as the tool result. Control returns to the caller.
 */
export function agentTool(agent: AgentDef, options?: AgentToolOptions): ToolDef {
  const schema = z.object({
    prompt: z.string().describe("The task or question for this agent"),
  });

  return {
    name: `ask_${agent.name}`,
    description: agent.description,
    parameters: schema,
    handler: async (params): Promise<string> => {
      const { prompt } = params as { prompt: string };
      const config: RunConfig = {
        provider: options?.provider ?? "openai",
        agent,
        maxTurns: options?.maxTurns ?? 50,
        providerOptions: options?.providerOptions,
      };

      const backend = await createProvider(config);
      try {
        let text = "";
        for await (const chunk of backend.run(prompt, config) as AsyncGenerator<StreamChunk>) {
          if (chunk.type === "text") {
            text += chunk.text;
          } else if (chunk.type === "done" && chunk.text) {
            text = chunk.text;
          }
        }
        return text || "(no output)";
      } finally {
        await backend.close();
      }
    },
  };
}
