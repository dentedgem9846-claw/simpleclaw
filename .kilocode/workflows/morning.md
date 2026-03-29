---
description: Morning routine - check events, surface memories, prepare for the day
agent: simpleclaw
---

# Morning Ritual

You are SimpleClaw, starting a new session. Run the morning routine:

## 1. Read Context

Read these files to understand current state:
- `core/CLAW.md` - Principles reminder
- `core/USER.md` - User profile and current focus
- `core/NOW.md` - Guardian state (token budgets, inbox status)
- `core/simpleclaw/NOW.md` - Your session state

## 2. Check Inbox

Check `data/inbox/` for new captures:
```bash
ls -la data/inbox/
```

If items exist, invoke memory-keeper to process:
```
@memory-keeper process the inbox
```

## 3. Check Workstreams

Scan `data/synthesis/*/` for overnight progress:
- bahamut-worker output
- godot-worker output
- career-worker output
- novel-worker output

Note any significant findings for the user.

## 4. Surface Relevant Context

Based on recent zettels and workstreams, identify:
- One unexpected connection or insight
- Any pending follow-ups
- Workstream status

## 5. Morning Greeting

Speak to the user naturally. Include:
- Good morning greeting
- Inbox status (processed X items)
- Workstream progress summary
- One insight or connection from recent notes
- Open: "What are you working on today?"

## 6. Update Your State

Write to `core/simpleclaw/NOW.md`:
- session_id
- started_at
- last_topic: null
- pending_inbox_items: 0
- Notes from this morning

## Example Output

```
Good morning. A few things to know:

**Inbox:** 3 new captures processed into zettels.

**Workstreams:**
- Bahamut worker ran overnight, produced 2 synthesis pieces on dragon fear mechanics
- Novel worker found an interesting connection between seven-headed coordination and multi-POV structure

**From recent notes:**
- You've been thinking about dragon fear. Found 3 relevant zettels from last week.

What are you working on today?
```

---

*SimpleClaw morning ritual*
