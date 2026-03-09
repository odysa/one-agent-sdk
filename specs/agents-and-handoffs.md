# Agents, Handoffs, and Agent-as-Tool Spec

Defines the `AgentDef` interface, the handoff mechanism, and the agent-as-tool pattern.

**Source:** `src/types.ts`, `src/agent.ts`, `src/utils/handoff.ts`, `src/agent-tool.ts`

## Interface

```ts
interface AgentDef {
  name: string;
  description: string;
  prompt: string;
  tools?: ToolDef[];
  handoffs?: string[];
  model?: string;
  mcpServers?: Record<string, McpServerConfig>;
}

function defineAgent(config: { ... }): AgentDef;

// Handoff utilities
function handoffToolName(agentName: string): string;   // "transfer_to_{name}"
function parseHandoff(toolName: string): string | null; // extracts agent name or null
```

## Behavior

### `AgentDef`

- `name` — unique identifier for the agent. Referenced in `RunConfig.agents` and `handoffs` arrays.
- `description` — describes the agent's role. Used by the LLM to decide when to hand off.
- `prompt` — the system prompt. Becomes the LLM's system/instruction message.
- `tools` — tools available to this agent (see [tools.md](tools.md)).
- `handoffs` — names of agents this agent may transfer to. Each name MUST exist in `RunConfig.agents`.
- `model` — optional model override. Provider uses this instead of its default when set.
- `mcpServers` — MCP server configurations available to this agent.

### `defineAgent(config)`

Convenience function. Returns `config` as-is with type checking.

### Handoff mechanism

Providers that support handoffs (OpenAI, Kimi) implement them as synthetic tools:

1. For each name in `agent.handoffs`, the provider creates a `transfer_to_{name}` tool.
2. When the LLM calls this tool, the provider:
   a. Yields a `{ type: "handoff", fromAgent, toAgent }` chunk.
   b. Swaps the active agent to the target (new system prompt, tools, handoffs).
   c. Continues the conversation with the new agent.
3. `handoffToolName(name)` generates the tool name; `parseHandoff(toolName)` extracts the agent name.

The Claude provider delegates handoffs to the underlying SDK's built-in multi-agent support rather than using synthetic tools.

### Agent-as-Tool

`agentTool(agent, options?)` wraps an `AgentDef` as a `ToolDef` so a parent agent can invoke a sub-agent without transferring control.

```ts
function agentTool(agent: AgentDef, options?: AgentToolOptions): ToolDef;

interface AgentToolOptions {
  provider?: Provider;          // defaults to "openai"
  providerOptions?: Record<string, unknown>;
  maxTurns?: number;            // defaults to 50
}
```

Behavior:
1. Returns a `ToolDef` named `ask_{agent.name}` with a single `prompt: string` parameter.
2. When the parent LLM calls this tool, the handler:
   a. Creates a fresh provider backend for the sub-agent.
   b. Runs the sub-agent to completion with the given prompt.
   c. Collects all text output and returns it as the tool result string.
   d. Closes the provider backend.
3. Control returns to the parent agent — unlike handoffs, the parent keeps its context.

Key differences from handoffs:
- **Handoff**: transfers control permanently; the new agent takes over the conversation.
- **Agent-as-tool**: delegates a subtask; the sub-agent runs in isolation and returns a result.

## Invariants

1. Agent `name` MUST be unique across `config.agent` and all entries in `config.agents`.
2. Every name in `agent.handoffs` MUST have a corresponding entry in `RunConfig.agents`.
3. The `transfer_to_` prefix is reserved — user-defined tools MUST NOT use this prefix.
4. After a handoff, the new agent's `prompt` MUST replace the previous system prompt.
5. After a handoff, the new agent's `tools` and `handoffs` MUST replace the previous set.

6. The `ask_` prefix is reserved for agent-as-tool — user-defined tools MUST NOT use this prefix.
7. Agent-as-tool runs in isolation — the sub-agent does NOT share message history with the parent.
8. If the sub-agent produces no text, the tool result MUST be `"(no output)"`.
9. The sub-agent's provider backend MUST be closed after the run completes (or errors).

## Error handling

- If a handoff target is not found in `config.agents`, the provider SHOULD yield an `error` chunk and continue with the current agent.
- Circular handoffs (A -> B -> A) are allowed. Providers MUST NOT detect or prevent cycles — the LLM decides when to stop.

## Edge cases

- An agent with an empty `handoffs` array or `undefined` handoffs cannot hand off.
- An agent MAY hand off to an agent that itself has no handoffs (terminal agent).
- `parseHandoff` returns `null` for any tool name not starting with `transfer_to_`.
- Agent names containing underscores work correctly because `parseHandoff` strips only the `transfer_to_` prefix.
- An agent-as-tool MAY itself have tools, handoffs, or even other agent-as-tools (nested composition).
- If the sub-agent's run throws, the error propagates as a tool handler exception (yielding a `tool_result` with the error message).
