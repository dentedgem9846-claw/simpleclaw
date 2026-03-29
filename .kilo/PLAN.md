# SimpleClaw Implementation Plan - Option C (Hybrid)

*Saved: 2026-03-28*
*Architecture: Markdown-first, SQLite-indexed*

---

## Architecture Overview

**Core Principle**: Workers write markdown directly. Guardian validates asynchronously and builds SQLite index for fast queries.

```
simpleclaw/
├── .kilo/                    # Kilo AI configuration
│   ├── agent/               # 8 agent definitions
│   ├── command/             # 3 slash commands
│   └── skill/               # Zettelkasten skill
├── core/                     # Frozen files (human-editable)
│   ├── CLAW.md              # 32 principles + constraints
│   ├── USER.md              # User profile template
│   └── NOW.md               # Session state (auto-updated)
├── data/                    # Markdown files (git-tracked)
│   ├── inbox/              # Raw captures
│   ├── zettels/            # Validated zettels
│   ├── diary/              # Daily entries
│   ├── synthesis/          # Generated content
│   │   ├── bahamut/
│   │   ├── godot/
│   │   ├── career/
│   │   └── novel/
│   └── archive/            # Old content
├── guardian/                # TypeScript Guardian
│   └── src/                # Schema, parser, token-tracker, indexer
├── scripts/                # Shell scripts
│   ├── setup.sh            # One-time setup
│   ├── simpleclaw.sh       # Entry point
│   ├── idle-worker.sh      # Hourly round-robin
│   └── daily-export.sh     # Daily git commit
├── simpleclaw.db           # SQLite (gitignored)
└── kilo.json               # Kilo config (uses kilo-auto/frontier)
```

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Storage | Markdown primary, SQLite index | Human-readable + fast queries |
| Links | `[[id]]` wikilinks | Standard zettelkasten format |
| Backlinks | Both SQLite AND markdown | Human-readable + machine-queryable |
| Validation | Guardian every 5 minutes | Async doesn't block writes |
| Token tracking | Worker self-reporting | Trust workers, Guardian verifies |
| NOW.md | Updated by Guardian | Single source for session state |
| Inbox | Workers → inbox, Memory Keeper organizes | Keeps workers focused |

---

## Zettel Schema

```typescript
{
  id: "YYYYMMDDHHMMSS-slug",
  type: "person|event|note|diary|synthesis|project|inbox",
  title: string,
  content: string,
  links: string[],      // Forward links [[id]]
  backlinks: string[], // Auto-generated
  folgezettel: { parent_id, sequence, thread_root },
  meta: object,        // Flexible - no strict schema
  tags: string[],
  created_at: datetime,
  updated_at: datetime,
  source: { type, reference, context },
  tokens_used: number,
  agent: string
}
```

---

## Agent Personalities

| Agent | Voice | Example |
|-------|-------|---------|
| simpleclaw | Warm, present | "Good morning. What are you working on today?" |
| memory-keeper | Precise, archival | "Noted. Linking to [[202603281200-jane]]..." |
| diary-scribe | Intimate, reflective | "This evening, something surfaced..." |
| synthesizer | Clear, journalistic | "Three patterns emerge..." |
| bahamut-worker | Epic, dramatic | "The wyrm stirs beneath the mountain..." |
| godot-worker | Technical, enthusiastic | "Sprite batching unlocked! Here's how..." |
| career-worker | Mentor, strategic | "Your trajectory suggests..." |
| novel-worker | Curious, connective | "An interesting parallel between..." |

---

## Token Budgets

| Agent | Daily Budget |
|-------|--------------|
| simpleclaw | Unlimited |
| memory-keeper | 50,000 |
| diary-scribe | 50,000 |
| synthesizer | 50,000 |
| bahamut-worker | 12,500 |
| godot-worker | 12,500 |
| career-worker | 12,500 |
| novel-worker | 12,500 |

---

## Cron Schedule

| Frequency | Job | Purpose |
|-----------|-----|---------|
| Every 5 min | `validate-incremental` | Guardian validation |
| Every hour | `idle-worker.sh` | Round-robin workstream |
| Daily 3am | `daily-export.sh` | Export + git commit |

---

## Data Flow

### Write Path (Fast)
1. Worker writes markdown to `data/inbox/` or `data/zettels/`
2. Markdown immediately human-readable
3. Guardian validates every 5 min via cron
4. Guardian imports to SQLite, updates backlinks
5. Invalid files logged, moved to errors

### Read Path
1. Query SQLite for IDs: `SELECT id FROM zettels WHERE type='person'`
2. Read actual content from markdown files
3. Parse `[[id]]` links for navigation

---

## Implementation Status

### Created Files

- [x] `core/CLAW.md` - 32 principles + constraints
- [x] `core/USER.md` - User profile template
- [x] `core/NOW.md` - Session state template
- [x] `.kilo/agent/simpleclaw.md` - Main agent
- [x] `.kilo/agent/memory-keeper.md` - Archivist worker
- [x] `.kilo/agent/diary-scribe.md` - Intimate worker
- [x] `.kilo/agent/synthesizer.md` - Clear worker
- [x] `.kilo/agent/bahamut-worker.md` - Epic worker
- [x] `.kilo/agent/godot-worker.md` - Technical worker
- [x] `.kilo/agent/career-worker.md` - Mentor worker
- [x] `.kilo/agent/novel-worker.md` - Curious worker
- [x] `.kilo/command/morning.md` - Morning routine
- [x] `.kilo/command/evening.md` - Evening routine
- [x] `.kilo/command/check-budget.md` - Budget status
- [x] `.kilo/skill/zettelkasten/SKILL.md` - PKM principles
- [x] `guardian/src/schema.ts` - Zod schemas
- [x] `guardian/src/db.ts` - SQLite operations
- [x] `guardian/src/parser.ts` - Markdown parsing + wikilink extraction
- [x] `guardian/src/token-tracker.ts` - Budget enforcement
- [x] `guardian/src/indexer.ts` - Validation + backlinks
- [x] `guardian/src/index.ts` - CLI entry
- [x] `guardian/package.json` - Dependencies
- [x] `guardian/tsconfig.json` - TypeScript config
- [x] `scripts/setup.sh` - Setup script
- [x] `scripts/simpleclaw.sh` - Entry point
- [x] `scripts/idle-worker.sh` - Hourly worker
- [x] `scripts/daily-export.sh` - Daily sync
- [x] `kilo.json` - Kilo config (kilo-auto/frontier)
- [x] `.gitignore` - Standard ignores
- [x] `README.md` - Documentation
- [x] `package.json` - Root deps

### Pending

- [ ] Run `npm install` to install Guardian dependencies
- [ ] Run `npm run build:guardian` to compile TypeScript
- [ ] Run `npm run setup` to initialize database and cron
- [ ] Edit `core/USER.md` with actual user info
- [ ] Test `/morning` and `/evening` commands

---

## Critical Review Notes

### Known Limitations

1. **Token counting**: Trust worker self-reporting. Guardian does not intercept API calls.
2. **Vector search**: SQLite FTS only, not semantic embeddings.
3. **Worker isolation**: Kilo permissions are prompt-based, not true sandboxes.
4. **Race conditions**: NOW.md could conflict if multiple workers update simultaneously.

### Future Enhancements

- Add sqlite-vec for semantic search
- Implement true process isolation for workers
- Add file locking for NOW.md updates
- Real-time validation via fs.watch instead of cron

---

## References

- [Kilo AI Documentation](https://kilo.ai/docs/)
- [The Milo Way](https://themiloway.github.io/the-milo-way/)
- [Zettelkasten Method](https://zettelkasten.de/)
- [Second Brain Principles](https://fortelabs.com/blog/the-10-principles-of-building-a-second-brain/)

---

*Plan created by Kilo AI. To be implemented.*
