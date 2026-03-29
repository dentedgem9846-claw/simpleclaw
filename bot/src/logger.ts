type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_RANK: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

function resolveLevel(raw: string | undefined): LogLevel {
  const candidate = (raw ?? 'info').toLowerCase();
  if (candidate in LEVEL_RANK) return candidate as LogLevel;
  return 'info';
}

/** Read LOG_LEVEL lazily on every emit so tests can override process.env */
function currentLevel(): LogLevel {
  return resolveLevel(process.env.LOG_LEVEL);
}

function emit(level: LogLevel, module: string, msg: string, extra?: Record<string, unknown>): void {
  if (LEVEL_RANK[level] < LEVEL_RANK[currentLevel()]) return;
  const entry: Record<string, unknown> = {
    ts: new Date().toISOString(),
    level,
    module,
    msg,
    ...extra,
  };
  process.stdout.write(`${JSON.stringify(entry)}\n`);
}

export const logger = {
  debug(module: string, msg: string, extra?: Record<string, unknown>): void {
    emit('debug', module, msg, extra);
  },
  info(module: string, msg: string, extra?: Record<string, unknown>): void {
    emit('info', module, msg, extra);
  },
  warn(module: string, msg: string, extra?: Record<string, unknown>): void {
    emit('warn', module, msg, extra);
  },
  error(module: string, msg: string, extra?: Record<string, unknown>): void {
    emit('error', module, msg, extra);
  },
};
