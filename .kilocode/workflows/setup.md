# Setup SimpleClaw

SimpleClaw is now a pure Kilo-based system. No database, no guardian, no build step.

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

## Optional: Configure Your Profile

Edit `core/USER.md` with your preferences:
- Name and timezone
- Current projects
- Communication preferences
- Morning/evening routine times

## That's It

SimpleClaw will:
- Read existing zettels from `data/zettels/`
- Capture new notes in `data/inbox/`
- Invoke workers for background tasks
- Track state in `core/NOW.md`

No database. No cron jobs. Just markdown files and Kilo agents.
