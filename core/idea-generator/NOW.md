# NOW-idea-generator.md - Idea Generator Session State

*Per-agent session memory. Read at start, write changes at end.*

---

## SESSION

```yaml
session_id: null
started_at: null
agent: idea-generator
status: idle
```

## WORKSTREAM

```yaml
last_scan_date: null
patterns_found: []  # Connections discovered
discoveries_queue: []  # Ideas waiting for blog-writer
projects_scanned: []
```

## NOTES

[Session notes here]

---

*Maintained by Idea Generator.*
