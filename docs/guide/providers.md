# Providers

One Agent SDK supports multiple LLM backends. Each provider is an optional peer dependency — install only the ones you need.

## Available Providers

### Claude

Uses `@anthropic-ai/claude-agent-sdk`. Spawns Claude Code as a subprocess.

```bash
npm install @anthropic-ai/claude-agent-sdk
```

```typescript
const { stream } = await run("Hello", {
  provider: "claude-code",
  agent,
});
```

- Tools are exposed via an in-process MCP server
- Handoffs use the SDK's built-in agent support
- Tool names follow `mcp__{serverName}__{toolName}` convention internally

### Codex

Uses `@openai/codex-sdk`. Spawns ChatGPT Codex as a subprocess.

```bash
npm install @openai/codex-sdk
```

```typescript
const { stream } = await run("Hello", {
  provider: "codex",
  agent,
});
```

- Zod schemas are converted to JSON Schema via `zodToJsonSchema()`
- Tool calls use streaming delta accumulation
- Handoffs are synthetic `transfer_to_{name}` function tools

### Kimi

Uses `@moonshot-ai/kimi-agent-sdk`. Spawns Kimi-CLI as a subprocess.

```bash
npm install @moonshot-ai/kimi-agent-sdk
```

```typescript
const { stream } = await run("Hello", {
  provider: "kimi-cli",
  agent,
});
```

- Uses `createSession`/`createExternalTool`
- `ApprovalRequest` events are auto-approved
- Handoffs are synthetic `transfer_to_{name}` function tools

## OpenAI

Uses the `openai` package to call the OpenAI API directly with an API key.

```bash
npm install openai
```

```typescript
const { stream } = await run("Hello", {
  provider: "openai",
  agent,
  providerOptions: { apiKey: "sk-..." }, // or set OPENAI_API_KEY env var
});
```

- Default model: `gpt-4o` (override with `agent.model`)
- Zod schemas are converted to JSON Schema via `zodToJsonSchema()`
- Manages multi-turn tool execution loop internally
- Handoffs are synthetic `transfer_to_{name}` function tools

### OpenAI Provider Options

| Option | Description |
| :----- | :---------- |
| `apiKey` | API key (falls back to `OPENAI_API_KEY` env var) |

## Anthropic

Uses the `@anthropic-ai/sdk` package to call the Anthropic API directly with an API key.

```bash
npm install @anthropic-ai/sdk
```

```typescript
const { stream } = await run("Hello", {
  provider: "anthropic",
  agent,
  providerOptions: { apiKey: "sk-ant-..." }, // or set ANTHROPIC_API_KEY env var
});
```

- Default model: `claude-sonnet-4-20250514` (override with `agent.model`)
- System prompt passed as top-level `system` parameter (Anthropic convention)
- Manages multi-turn tool execution loop internally
- Handoffs are synthetic `transfer_to_{name}` function tools

### Anthropic Provider Options

| Option | Description |
| :----- | :---------- |
| `apiKey` | API key (falls back to `ANTHROPIC_API_KEY` env var) |
| `maxTokens` | Max tokens per response (default: `8192`) |

## OpenRouter

Uses the `openai` package with OpenRouter's OpenAI-compatible API. Access any model through a single API.

```bash
npm install openai
```

```typescript
const { stream } = await run("Hello", {
  provider: "openrouter",
  agent: { ...agent, model: "anthropic/claude-sonnet-4" }, // model is required
  providerOptions: { apiKey: "sk-or-..." }, // or set OPENROUTER_API_KEY env var
});
```

- `agent.model` is **required** (e.g. `"anthropic/claude-sonnet-4"`, `"openai/gpt-4o"`)
- API key is **required** (via `providerOptions.apiKey` or `OPENROUTER_API_KEY` env var)
- Shares the OpenAI provider implementation internally

### OpenRouter Provider Options

| Option | Description |
| :----- | :---------- |
| `apiKey` | API key (falls back to `OPENROUTER_API_KEY` env var) |
| `httpReferer` | Sets the `HTTP-Referer` header for OpenRouter analytics |
| `xTitle` | Sets the `X-Title` header for OpenRouter analytics |

## Provider Options

Pass provider-specific options via `providerOptions`:

```typescript
const { stream } = await run("Hello", {
  provider: "openai",
  agent,
  providerOptions: {
    apiKey: "sk-...",
  },
});
```

## Switching Providers

Changing the provider is a one-line change:

```typescript
// Just change this string
const provider = "openai"; // or "claude-code", "codex", "anthropic", "openrouter", ...

const { stream } = await run("Hello", { provider, agent });
```

Your tools, agents, and stream processing code stay exactly the same.

## Custom Providers

You can register your own provider backends using `registerProvider()`:

```typescript
import { registerProvider, run } from "one-agent-sdk";

registerProvider("my-llm", async (config) => {
  return {
    async *run(prompt) {
      yield { type: "text", text: `Echo: ${prompt}` };
      yield { type: "done", text: `Echo: ${prompt}` };
    },
    async *chat(message) {
      yield { type: "text", text: `Echo: ${message}` };
      yield { type: "done", text: `Echo: ${message}` };
    },
    async close() {},
  };
});

// Use like any built-in provider
const { stream } = await run("Hello", {
  provider: "my-llm",
  agent,
});
```

Custom providers are checked before built-in ones, so you can even override a built-in provider name if needed. See the [registerProvider() API reference](/api/register-provider) for details.
