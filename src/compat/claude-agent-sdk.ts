/**
 * Drop-in replacement for @anthropic-ai/claude-agent-sdk with multi-provider support.
 *
 * Usage:
 *   import { query, tool, createSdkMcpServer } from "one-agent-sdk/claude-agent-sdk";
 *
 * 100% API-compatible with @anthropic-ai/claude-agent-sdk.
 * Pass `options.provider` to route to a different backend (codex, kimi-cli, or custom).
 * Defaults to claude-code when no provider is specified.
 */
export * from "@anthropic-ai/claude-agent-sdk";

// Shadow query with our provider-agnostic version
export { query } from "./query.js";
