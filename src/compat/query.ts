import { getProvider } from "../registry.js";
import type { AgentDef, RunConfig } from "../types.js";
import { importProvider } from "../utils/import-provider.js";
import { adaptStream } from "./adapt-stream.js";

async function createBackend(provider: string, config: RunConfig) {
  const factory = getProvider(provider);
  if (factory) return factory(config);

  switch (provider) {
    case "codex": {
      const { createCodexProvider } = await import("../providers/codex.js");
      return createCodexProvider(config);
    }
    case "kimi-cli": {
      const { createKimiProvider } = await import("../providers/kimi.js");
      return createKimiProvider(config);
    }
    default:
      throw new Error(
        `Unknown provider: ${provider}. Use: claude-code, codex, kimi-cli, or register a custom provider.`,
      );
  }
}

function toRunConfig(provider: string, options: Record<string, any>): RunConfig {
  const agent: AgentDef = {
    name: options.agentName ?? "default",
    description: options.agentDescription ?? "Default agent",
    prompt: options.systemPrompt ?? "You are a helpful assistant.",
    model: options.model,
  };

  return {
    provider,
    agent,
    maxTurns: options.maxTurns,
    workDir: options.cwd,
    signal: options.abortController?.signal,
    providerOptions: options.providerOptions,
  };
}

/**
 * Provider-agnostic query() following the @anthropic-ai/claude-agent-sdk signature.
 *
 * Pass `options.provider` to route to a different backend:
 * - `"claude-code"` (default) — delegates to the real Anthropic SDK
 * - `"codex"` — routes to OpenAI Codex
 * - `"kimi-cli"` — routes to Kimi
 * - Any registered custom provider name
 *
 * The output stream emits SDKMessage-shaped objects regardless of backend.
 */
export function query(input: {
  prompt: string;
  options?: Record<string, any>;
}): AsyncIterable<any> {
  const { prompt, options = {} } = input;
  const provider = (options.provider as string) ?? "claude-code";

  if (provider === "claude-code") {
    const { provider: _, ...cleanOptions } = options;
    return (async function* () {
      const sdk = await importProvider<{ query: (opts: any) => AsyncIterable<any> }>(
        "@anthropic-ai/claude-agent-sdk",
        "bun add @anthropic-ai/claude-agent-sdk",
      );
      yield* sdk.query({ prompt, options: cleanOptions });
    })();
  }

  return (async function* () {
    const config = toRunConfig(provider, options);
    const backend = await createBackend(provider, config);
    try {
      yield* adaptStream(backend.run(prompt, config));
    } finally {
      await backend.close();
    }
  })();
}
