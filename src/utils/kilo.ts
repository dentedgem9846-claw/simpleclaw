import { spawn } from "node:child_process";
import { logger } from "./logger.js";

export interface KiloOptions {
	message: string;
	model?: string;
	maxRetries?: number;
	onStdout?: (data: string) => void;
	onStderr?: (data: string) => void;
}

export interface KiloResult {
	exitCode: number;
}

const RETRY_BASE_MS = 1000;

function spawnKilo(options: KiloOptions): Promise<KiloResult> {
	return new Promise((resolve, reject) => {
		const args = ["kilo", "run", options.message];
		if (options.model) {
			args.push("--model", options.model);
		}

		logger.debug(`Spawning: npx ${args.join(" ")}`);

		const proc = spawn("npx", args, {
			stdio: ["ignore", "pipe", "pipe"],
			env: {
				...process.env,
				TERM: "xterm-256color",
			},
		});

		proc.stdout?.on("data", (data) => {
			options.onStdout?.(data.toString());
		});

		proc.stderr?.on("data", (data) => {
			options.onStderr?.(data.toString());
		});

		proc.on("close", (code) => {
			resolve({ exitCode: code ?? 1 });
		});

		proc.on("error", (err) => {
			reject(new Error(`Failed to spawn kilo: ${err.message}`));
		});
	});
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runKilo(options: KiloOptions): Promise<KiloResult> {
	const maxRetries = options.maxRetries ?? 2;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			const result = await spawnKilo(options);

			if (result.exitCode === 0 || attempt === maxRetries) {
				return result;
			}

			const backoff = RETRY_BASE_MS * 2 ** attempt;
			logger.warn(
				`Kilo exited with code ${result.exitCode}, retrying in ${backoff}ms (attempt ${attempt + 1}/${maxRetries})...`,
			);
			await delay(backoff);
		} catch (err) {
			if (attempt === maxRetries) {
				throw err;
			}

			const backoff = RETRY_BASE_MS * 2 ** attempt;
			const msg = err instanceof Error ? err.message : String(err);
			logger.warn(
				`${msg}, retrying in ${backoff}ms (attempt ${attempt + 1}/${maxRetries})...`,
			);
			await delay(backoff);
		}
	}

	return { exitCode: 1 };
}
