import type { BuiltinProvider, Provider } from "../types.js";

type ProviderDependency = {
  pkg: string;
  installHint: string;
};

const BUILTIN_PROVIDER_DEPENDENCIES: Record<BuiltinProvider, ProviderDependency> = {
  "claude-code": {
    pkg: "@anthropic-ai/claude-agent-sdk",
    installHint: "bun add @anthropic-ai/claude-agent-sdk",
  },
  codex: {
    pkg: "@openai/codex-sdk",
    installHint: "bun add @openai/codex-sdk",
  },
  copilot: {
    pkg: "@github/copilot-sdk",
    installHint: "bun add @github/copilot-sdk",
  },
  "kimi-cli": {
    pkg: "@moonshot-ai/kimi-agent-sdk",
    installHint: "bun add @moonshot-ai/kimi-agent-sdk",
  },
  openai: {
    pkg: "openai",
    installHint: "bun add openai",
  },
  anthropic: {
    pkg: "@anthropic-ai/sdk",
    installHint: "bun add @anthropic-ai/sdk",
  },
  openrouter: {
    pkg: "openai",
    installHint: "bun add openai",
  },
};

export function getProviderDependency(provider: Provider): ProviderDependency | undefined {
  return BUILTIN_PROVIDER_DEPENDENCIES[provider as BuiltinProvider];
}

export async function assertProviderDependencyInstalled(
  provider: Provider,
  importer: (pkg: string) => Promise<unknown> = async (pkg) => import(pkg),
): Promise<void> {
  const dep = getProviderDependency(provider);
  if (!dep) return;

  try {
    await importer(dep.pkg);
  } catch {
    throw new Error(
      `Provider "${provider}" requires ${dep.pkg}. Install it with: ${dep.installHint}`,
    );
  }
}
