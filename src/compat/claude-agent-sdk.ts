/**
 * Drop-in compatibility layer for @anthropic-ai/claude-agent-sdk.
 *
 * Usage:
 *   // Before (direct Anthropic SDK):
 *   import { query, tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
 *
 *   // After (via one-agent-sdk):
 *   import { query, tool, createSdkMcpServer } from "one-agent-sdk/claude-agent-sdk";
 *
 * Requires @anthropic-ai/claude-agent-sdk as a peer dependency.
 */
export * from "@anthropic-ai/claude-agent-sdk";
