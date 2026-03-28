export enum LogLevel {
	Debug = 0,
	Info = 1,
	Warn = 2,
	Error = 3,
}

type LogFn = (message: string, ...args: unknown[]) => void;

const createLogFn =
	(level: LogLevel, minLevel: LogLevel, label: string): LogFn =>
	(message: string, ...args: unknown[]) => {
		if (level < minLevel) return;
		const prefix = `[${label}]`;
		const logFn =
			level >= LogLevel.Error
				? console.error
				: level >= LogLevel.Warn
					? console.warn
					: console.log;
		logFn(prefix, message, ...args);
	};

export interface Logger {
	debug: LogFn;
	info: LogFn;
	warn: LogFn;
	error: LogFn;
}

export function createLogger(minLevel: LogLevel = LogLevel.Info): Logger {
	return {
		debug: createLogFn(LogLevel.Debug, minLevel, "DEBUG"),
		info: createLogFn(LogLevel.Info, minLevel, "INFO"),
		warn: createLogFn(LogLevel.Warn, minLevel, "WARN"),
		error: createLogFn(LogLevel.Error, minLevel, "ERROR"),
	};
}

export const logger = createLogger(LogLevel.Info);
