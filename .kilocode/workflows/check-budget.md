---
description: Check token budget status for all agents
agent: simpleclaw
---

Check current token budget status and report to the user.

## 1. Read NOW.md

Read `core/NOW.md` to get current token usage data.

## 2. Calculate Status

For each worker agent:
- Budget: 50,000 (main workers) or 12,500 (project workers)
- Used: from NOW.md
- Remaining: Budget - Used

## 3. Report to User

Present in a clear table:

```
**Token Budget Status - Today**

| Agent | Budget | Used | Remaining | Status |
|-------|--------|------|-----------|--------|
| memory-keeper | 50,000 | X | Y | [OK/LOW/EXHAUSTED] |
| diary-scribe | 50,000 | X | Y | [OK/LOW/EXHAUSTED] |
| synthesizer | 50,000 | X | Y | [OK/LOW/EXHAUSTED] |
| bahamut-worker | 12,500 | X | Y | [OK/LOW/EXHAUSTED] |
| godot-worker | 12,500 | X | Y | [OK/LOW/EXHAUSTED] |
| career-worker | 12,500 | X | Y | [OK/LOW/EXHAUSTED] |
| novel-worker | 12,500 | X | Y | [OK/LOW/EXHAUSTED] |

**Status meanings:**
- OK: >50% remaining, healthy
- LOW: 10-50% remaining, be cautious
- EXHAUSTED: 0% remaining, no more tasks today
```

## 4. Recommendations

If any agents are LOW or EXHAUSTED:
- Suggest which workstreams to pause
- Note if any morning routine should skip certain workers

## 5. Update Context

Update NOW.md with any status changes noted.

---

*Last updated: 2026-03-28*
