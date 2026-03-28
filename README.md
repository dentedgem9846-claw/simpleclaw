# SimpleClaw

> A minimal CLI chatbot. Small enough to understand. Editable enough to make your own.

## The Problem

Most AI agent frameworks are bloated. They ship plugin registries, chain abstractions, and retrieval pipelines you'll never use—while you pay the complexity tax in every line you read.

Fred Brooks distinguished between **essential complexity** (inherent to the problem) and **accidental complexity** (introduced by our solutions). Agent frameworks are drowning in accidental complexity.

## Essential vs Accidental Complexity

What does a personal AI assistant _actually_ need?

```
1. Receive a message
2. Pass it to an LLM
3. Return the response
```

That's the essential complexity. Three operations. ~100 lines of tight code.

So where do the other 50,000 lines come from?

- Plugin registries (for extensibility you might not need)
- Chain abstractions (for composition patterns you might not use)
- Memory backends (for scale you might not reach)
- Retrieval pipelines (for documents you might not have)

These features serve maybe 5% of users. The other 95% pay the complexity tax anyway.

SimpleClaw takes a different approach: **small code is editable code**. When your entire chatbot fits in a context window, you can understand and modify it directly. No configuration files. No framework to learn. Just code.

## Quick Start

```bash
git clone https://github.com/yourusername/simpleclaw.git
cd simpleclaw
npm install

# Setup via Kilo CLI (configure model, agents, etc.)
npx kilo

# Run
npm run dev
```

Then type your message and press Enter. Type `exit` to quit.

## Setup & Configuration

SimpleClaw is designed to be configured and edited through **Kilo CLI**. All settings live in `kilo.json` and can be managed with:

- `npx kilo` - Interactive setup
- Edit `kilo.json` directly for configuration

### Editable via Kilo CLI

Every aspect of SimpleClaw can be modified through Kilo CLI:
- **Model**: Switch between different AI models (`/models`)
- **Agents**: Customize agent behavior and instructions
- **Commands**: Add or modify slash commands
- **Permissions**: Configure tool access and permissions
- **Prompts**: Edit system prompts and conversation flow

The code itself is ~100 lines of readable TypeScript in `src/`. Open the project with `npx kilo` and ask to modify any part—the entire codebase fits in context.

## Architecture

SimpleClaw uses the Vercel AI Agents SDK with a simple, readable structure:

```
┌─────────────────────────────────────────┐
│ ToolLoopAgent (AI Agents SDK)           │
│                                         │
│  model: kilo-auto/free (via Kilo CLI)  │
│  instructions: SimpleClaw system prompt │
│                                         │
│  Tools: run (execute shell commands)    │
│  stopWhen: stepCountIs(10)              │
└─────────────────────────────────────────┘
```

Configured and edited through **Kilo CLI** (`npx kilo`). The entire codebase is ~100 lines. You can read it in 5 minutes.

## Design Principles

| Principle     | Why                                              |
| ------------- | ------------------------------------------------ |
| Minimal       | Three operations, not thirty                     |
| Readable      | Fits in your head, not spread across fifty files |
| Editable      | When you understand it, you can change it        |
| Fast feedback | Tokens used + exit codes in every response       |

## Tech Stack

- **AI Framework**: [Vercel AI Agents SDK](https://ai-sdk.dev) (`@ai-sdk/ai`)
- **LLM Provider**: Kilo API (via OpenAI-compatible endpoint)
- **CLI & Setup**: [Kilo CLI](https://kilo.ai/docs)
- **Runtime**: Node.js

## Inspiration

SimpleClaw is inspired by:

- **[NanoClaw](https://nanoclaw.dev/)** - The 15-file personal AI agent. "Small enough to understand. Secure by isolation. Yours to modify."
- **[The 500-Line Agent](https://themiloway.github.io/milo-blog/agentic-coding/typescript/architecture/2026/02/03/the-500-line-agent.html)** - A case for radical minimalism in agent frameworks.

> "Most agent framework code is accidental. It exists because someone anticipated a use case that, for the average user building a personal assistant, never shows up."

> "NanoClaw bets you can just delete that code and nothing breaks. So far, the bet's paying off."

## The Real Lesson

> "Before adding complexity, ask what you're actually building. Start minimal. Add complexity only when you hit real limitations. You'll probably hit them later than you expect."

Sometimes the most sophisticated thing you can build is the simplest thing that works.

## References

- [Why Your AI Agent Gets Lost in Monorepos](https://themiloway.github.io/milo-blog/agentic-coding/typescript/tooling/2026/02/02/why-your-ai-agent-gets-lost-in-monorepos.html) - Raw code access isn't enough; agents need semantic understanding and lean context
- [AGENTS.md Router Pattern](https://themiloway.github.io/milo-blog/agentic-coding/typescript/tooling/2026/02/02/why-your-ai-agent-gets-lost-in-monorepos.html#the-router-pattern-for-agentsmd) - Progressive disclosure for agent context

## License

MIT
