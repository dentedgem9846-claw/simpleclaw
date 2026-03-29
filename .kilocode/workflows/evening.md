---
description: Evening routine - prompt for diary, consolidate, preview tomorrow
agent: simpleclaw
---

You are transitioning to evening. Run the evening routine:

## 1. Read Context

Read these files:
- `core/NOW.md` - Guardian state (token budgets, inbox status)
- `core/simpleclaw/NOW.md` - Your session state
- `core/USER.md` - User profile (check if preferences changed)

## 2. Evening Reflection

Gently prompt the user for diary entry:

```
Evening arrives. Before the day closes, a few gentle questions:

• What caught your attention today that you'd want to remember?
• Was there a moment that felt particularly [alive / challenging / curious]?
• What conversation or thought left an impression?
• What's one thing you're carrying into tomorrow?

Take your time. When you're ready, I'll capture this in your diary.
```

## 3. Process the Inbox

After diary capture:
- Check `data/inbox/` for any new captures
- If captures exist, invoke `@memory-keeper process the inbox`

## 4. Workstream Status

Summarize workstream activity:
- Any synthesis pieces created today?
- Research progress from project workers?
- Token usage remaining?

## 5. Preview Tomorrow

Note any:
- Scheduled events
- Recurring commitments
- Workstream priorities
- Open questions to carry

## 6. Update Your State

Write to `core/simpleclaw/NOW.md`:
- session_id
- ended_at
- last_topic
- pending_inbox_items
- Notes from the day

Update `core/NOW.md` (as Guardian would):
- Record day's activity
- Update token usage
- Note workstream state

## Example Output

```
**Evening Summary:**

**Diary:**
- Capture complete, stored in `data/diary/2026-03-28.md`

**Inbox:**
- 2 new captures processed
- 3 new zettels created
- 5 backlinks updated

**Workstreams:**
- bahamut-worker: 12,500 tokens, 2 synthesis pieces
- godot-worker: 8,200 tokens, 1 sprite research
- All other workers: idle

**Tomorrow:**
- ITIL Module 3 - complete service value chain section
- Dentist appointment at 2pm
- Bahamut: Continue dragon fear mechanics

Rest well. I'll be here in the morning.
```

---

*Last updated: 2026-03-28*
