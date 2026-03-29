---
name: zettelkasten
description: Atomic note-taking system using Zettelkasten principles for knowledge management and linking
---

# Zettelkasten Skill

*Reusable zettelkasten principles and operations for SimpleClaw.*

## Overview

This skill defines the atomic note system SimpleClaw uses for knowledge management.

## Core Principles

### Atomicity
One idea per zettel. Each note contains exactly one thought that can stand alone. This enables:
- Precise linking
- Recombination into new thoughts
- Clear retrieval

### Linking (Bidirectional)
Every zettel can link to others. Links create the knowledge graph.
- Forward links: `[[zettel-id]]` in content
- Backlinks: System maintains inverse links automatically

### Sequence (Folgezettel)
Related zettels can form threads:
- Parent-child relationships
- Sequential numbering (a, a1, a2)
- Thread root for navigation

### Emergence
Structure grows from use:
- Don't force hierarchy
- Let patterns emerge
- Tags for loose organization

## Zettel ID Format

`YYYYMMDDHHMMSS-slug`

Examples:
- `20260328143000-jane-doe-intro`
- `20260328150000-itil-service-value-chain`

Rules:
- Timestamp is creation time (UTC)
- Slug is kebab-case, descriptive
- ID must be unique

## Zettel Types

| Type | Purpose | Example |
|------|---------|---------|
| `person` | People you know | Jane's birthday, role |
| `event` | Time-bound items | Appointments, deadlines |
| `note` | Atomic ideas | Insights, concepts, thoughts |
| `diary` | Daily reflections | Evening entries |
| `synthesis` | Generated content | Blog posts, research |
| `project` | Project-specific | Bahamut notes, Godot research |
| `inbox` | Unprocessed captures | Raw ideas awaiting organization |

## File Naming

Zettels live in markdown files named with their ID:
```
data/zettels/
├── 20260328143000-jane-doe-intro.md
├── 20260328150000-itil-service-value-chain.md
└── 20260328160000-bahamut-seven-heads.md
```

## Standard Zettel Structure

```markdown
---
id: YYYYMMDDHHMMSS-slug
type: [type]
title: Clear Title
links: [zettel-id-1, zettel-id-2]
folgezettel:
  parent_id: [parent-zettel-id]
  sequence: [e.g., "a", "b", "a1"]
  thread_root: [root-zettel-id]
meta: {}
tags: [tag-1, tag-2]
created_at: 2026-03-28T14:30:00Z
updated_at: 2026-03-28T14:30:00Z
source:
  type: [conversation|book|article|url|thought|other]
  reference: [optional reference]
  context: [optional context]
agent: [simpleclaw|memory-keeper|diary-scribe|etc.]
tokens_used: 0
---

# Title

Content here. One atomic idea.

Links: [[20260328143000-existing-zettel]]

More content...

## Summary

[Optional: 2-3 sentence distillation]
```

## Operations

### Creating a Zettel

1. Generate ID: `date + slug`
2. Write content (one idea)
3. Add links to related zettels
4. Set appropriate metadata
5. Save to `data/zettels/` (or appropriate subdirectory)

### Linking Zettels

In content: `[[20260328143000-existing-zettel]]`

After creating links:
1. Parse content for `[[...]]` patterns
2. Extract linked IDs
3. Update new zettel's `links` array
4. Update linked zettels' backlinks arrays

### Finding Related Zettels

Methods:
1. **Direct links**: Follow `links` array
2. **Backlinks**: Find zettels linking to this one
3. **Tags**: Search by shared tags
4. **Search**: Keyword search in content
5. **Folgezettel**: Navigate thread

### Updating Zettels

- Keep `updated_at` current
- Don't delete content - archive instead
- Note significant changes in new zettel if needed

### Archiving Zettels

When a zettel becomes obsolete:
1. Move from `data/zettels/` to `data/archive/`
2. Preserve all content and links
3. Update any zettels that link to it
4. Add `archived_at` to meta

## Git Integration

Zettels are git-tracked via markdown exports:
- Daily export maintains markdown copies
- Git history preserves all changes
- Recovery possible from any commit

## SQLite Integration

SQLite provides fast querying:
- Full-text search
- Type filtering
- Date range queries
- Link traversal

Guardian maintains SQLite from markdown sources.

## Usage Examples

### Capture a person's info
```
@simpleclaw "My colleague Jane Doe works on the Platform team. Her birthday is August 15."
```

Creates zettel in `data/zettels/`:
```markdown
---
id: 20260328143000-jane-doe-intro
type: person
title: Jane Doe introduction
meta:
  birthday: August 15
  team: Platform
tags: [colleague, engineering]
---

# Jane Doe introduction

Met at engineering all-hands. Works on the Platform team.

[[202603281000-project-alpha]] - same team
```

### Link existing zettel
```
@simpleclaw "This reminds me of what I wrote about dragon fear mechanics"
```

Finds `[[202603281200-dragon-fear]]` and adds to links.

### Find related
```
@simpleclaw "what else do I have about dragons?"
```

Searches zettels, returns all with "dragon" in content or tags.

---

*Part of SimpleClaw. Follows CLAW.md principles.*
