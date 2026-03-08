---
layout: home

hero:
  name: One Agent SDK
  text: Provider-Agnostic LLM Agents
  tagline: Embed agents — Claude Code, Codex, Copilot, OpenAI, Anthropic, and more — directly into your TypeScript apps. One line to swap providers.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: API Reference
      link: /api/run

features:
  - title: Provider Agnostic
    details: Swap between Claude, Codex, Copilot, OpenAI, Anthropic, OpenRouter, and more with a single config change.
  - title: Streaming First
    details: Unified AsyncGenerator-based streaming interface across all providers. Process text, tool calls, and handoffs as they happen.
  - title: Multi-Agent Handoffs
    details: Agents hand off to each other seamlessly. Define handoff targets and the SDK handles routing on any backend.
  - title: Type-Safe Tools
    details: Define tools with Zod schemas for fully type-safe parameters and handlers. Works with Zod v4.
  - title: Structured Output
    details: Validate agent responses against Zod schemas. Get typed objects instead of raw text.
  - title: Sessions & Middleware
    details: Multi-turn conversation history with pluggable storage, and composable stream middleware for logging, filtering, and transforms.
---
