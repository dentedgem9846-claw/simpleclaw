# SimpleClaw

> A minimal AI agent in ~500 lines of TypeScript. Small enough to understand. Editable enough to make your own.

## The Problem

Most agent frameworks are bloated. They ship plugin registries, chain abstractions, and retrieval pipelines you'll never use—while you pay the complexity tax in every line you read.

NanoClaw makes this observation:

> "Most agent framework code is accidental. It exists because someone anticipated a use case that, for the average user building a personal assistant, never shows up."

SimpleClaw takes a different approach: **small code is editable code**. When your entire agent fits in a context window, you can ask an LLM to modify it directly. No configuration files. No framework to learn. Just code.

## What Does an AI Assistant Actually Need?

```
1. Receive a message
2. Pass it to an LLM with context
3. Run tools the LLM requests
4. Send the response back
5. Remember things
```

That's it. That's the essential complexity. Five operations. Maybe 200 lines of tight code.

## Architecture

SimpleClaw combines two insights:

**1. Unix is the tool interface.** A single `run(command="...")` tool with CLI commands outperforms a catalog of typed function calls. LLMs already speak CLI. Pipes compose. Exit codes teach.

**2. Two-layer design.** Execution (pure Unix semantics) stays raw. Presentation (for the LLM) handles binary guards, truncation, and metadata. Don't let your tool interface leak into the execution layer.

```
┌─────────────────────────────────────┐
│ Layer 2: Presentation               │
│ - Binary guard                      │
│ - Truncation (>200 lines → /tmp/)   │
│ - Metadata: [exit:0 | 12ms]         │
├─────────────────────────────────────┤
│ Layer 1: Execution                  │
│ - Command routing                   │
│ - Pipe |  &&  ||  ;  parsing        │
│ - Raw stdout/stderr                 │
└─────────────────────────────────────┘
```

## Design Principles

| Principle          | Why                                                                          |
| ------------------ | ---------------------------------------------------------------------------- |
| One tool, not many | Command selection within a namespace, not context-switching between APIs     |
| `--help` on demand | Progressive disclosure: inject overview → agent explores → agent drills down |
| Errors guide       | `[error] binary (182KB). Use: see photo.png` not just "error"                |
| stderr is sacred   | Never drop it. It's what agents need most when commands fail                 |
| Consistent output  | Exit codes + duration in every response. Agents learn patterns               |

## Memory

SimpleClaw uses a **Zettelkasten-inspired** memory system. Memory isn't a database—it's a network.

```
┌─────────────────────────────────────────────┐
│ Memory Architecture                         │
│                                             │
│  ┌─────────┐      ┌─────────┐              │
│  │ Note A  │──────│ Note B  │              │
│  │ (atomic)│──────│(evolves)│              │
│  └────┬────┘      └────┬────┘              │
│       │                │                    │
│       └──────┬─────────┘                    │
│              ▼                              │
│       ┌─────────────┐                       │
│       │  Emergent   │                       │
│       │  Knowledge  │                       │
│       └─────────────┘                       │
└─────────────────────────────────────────────┘
```

**Principles:**

- **Atomic notes** — One idea per memory, richly described
- **Dynamic linking** — New memories find connections to existing ones
- **Memory evolution** — New insights update old context, the network refines itself
- **Relationship types** — Not just tags, but typed connections (supports, contradicts, elaborates)

This contrasts with simple storage: memories as islands vs. archipelagos.

## Security

Agents run in containers. Bash is safe because it runs inside isolation. **Security happens at the OS layer, not the application layer.**

```
┌─────────────────────────────────────────┐
│ Host Machine                            │
│  ┌─────────────────────────────────┐    │
│  │ Container                       │    │
│  │  - Isolated filesystem          │    │
│  │  - Isolated network             │    │
│  │  - No ambient access            │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

The right layer for security is the OS, not the app. NanoClaw pioneered this approach, and SimpleClaw follows the same principle.

## Kilo-Powered

SimpleClaw runs on [Kilo](https://kilo.ai/) - a local-first AI CLI that gives you tools, filesystem access, and a persistent session out of the box. No API keys required. No external services.

## Getting Started

```bash
git clone https://github.com/yourusername/simpleclaw.git
cd simpleclaw
npm install
npm run dev
```

## Inspiration

SimpleClaw is inspired by:

- **[NanoClaw](https://nanoclaw.dev/)** - The 15-file personal AI agent that runs Claude Code in containers. NanoClaw's philosophy: "Small enough to understand. Secure by isolation. Yours to modify."
- **[The 500-Line Agent](https://themiloway.github.io/milo-blog/agentic-coding/typescript/architecture/2026/02/03/the-500-line-agent.html)** - A case for radical minimalism in agent frameworks.
- **[Zettelkasten for Agents](https://themiloway.github.io/milo-blog/research/memory/agents/2026/02/03/zettelkasten-for-agents.html)** - Applying academic memory research to agent systems. Memory isn't a database—it's a network.

> "Before adding complexity, ask what you're actually building. Start minimal. Add complexity only when you hit real limitations."

## References

- [Structural vs. Textual: Why AI Agents Need AST Tools](https://themiloway.github.io/milo-blog/agentic-coding/typescript/2026/02/03/structural-vs-textual-code-manipulation.html) - Use AST for structural changes, LLMs for semantic changes
- [The Correctness Sandwich](https://themiloway.github.io/milo-blog/2026/02/03/the-correctness-sandwich.html) - Layered validation: type-constrained decoding → AST validation → tests → cross-model review
- [Pragmatic FP for Agents](https://themiloway.github.io/milo-blog/typescript/agents/functional-programming/2026/02/03/pragmatic-fp-for-agents.html) - Use Zod, ts-pattern, Result types instead of Effect-TS for agent-compatible code

## License

MIT
