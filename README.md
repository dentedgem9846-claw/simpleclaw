# SimpleClaw

*A personal memory system and creative partner powered by Kilo AI.*

## What is SimpleClaw?

SimpleClaw is a personal knowledge management system built on Kilo AI. It follows Zettelkasten principles to create an atomic note system that:
- Remembers everything you share
- Surfaces relevant context automatically
- Creates blog posts while you sleep
- Discovers connections across your notes

## Core Philosophy

SimpleClaw follows 32 principles from PKM, Second Brain, and AI Memory research:
- **Conversation is the interface** - No commands, just talk
- **Memory is contextual** - Surfaces what you need before you ask
- **Atomicity** - One idea per note, linked to others
- **Frictionless capture** - Propose, don't demand
- **Human sovereignty** - You own your data

See [core/CLAW.md](core/CLAW.md) for full principles.

## Architecture

```
simpleclaw/
├── .kilo/                    # Kilo AI configuration
│   └── agents/              # Agent definitions
│       ├── simpleclaw.md     # Main interface
│       ├── memory-keeper.md  # Organizes inbox
│       ├── idea-generator.md # Discovers connections
│       └── blog-writer.md    # Creates blog posts
│
├── core/                     # System files
│   ├── CLAW.md              # Philosophy & constraints
│   ├── USER.md              # Your profile
│   └── NOW.md               # Session state
│
└── data/                    # Your content
    ├── inbox/              # Raw captures
    ├── zettels/            # Atomic notes
    ├── diary/              # Daily reflections
    └── synthesis/          # Generated content
```

## Quick Start

### 1. Install Kilo

```bash
npm install -g @kilocode/cli
```

### 2. Start SimpleClaw

```bash
cd /path/to/simpleclaw
kilo --agent simpleclaw
```

## How It Works

### Zettelkasten System

Everything is a **zettel** (atomic note):
- One idea per note
- Linked with `[[wikilinks]]`
- Tagged for organization
- Tracked with timestamps

### Workers

Invoke workers for background tasks:
- **Memory Keeper** - Organizes inbox into zettels
- **Idea Generator** - Discovers connections across notes
- **Blog Writer** - Creates blog posts from your ideas

### Daily Usage

Just speak naturally:
```
"Jane's birthday is August 15, she's a senior engineer on the platform team"
```

SimpleClaw will:
1. Create a zettel in `data/zettels/`
2. Link to related notes
3. Surface it when relevant

## Configuration

### Adding Workers

Create `.kilo/agents/my-worker.md` following the existing patterns.

### Customizing Personalities

Edit agent files in `.kilo/agents/`. Each worker has a distinct voice while following CLAW principles.

## Troubleshooting

Ask Kilo Code to fix it.

## License

MIT
