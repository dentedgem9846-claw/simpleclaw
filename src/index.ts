import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import { runKilo } from "./utils/kilo.js";
import { logger } from "./utils/logger.js";

const rl = createInterface({ input: stdin, output: stdout });

function cleanup() {
	rl.close();
	logger.info("Goodbye!");
	process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

async function chat() {
	logger.info("SimpleClaw Agent (type 'exit' to quit)\n");

	while (true) {
		const input = await rl.question("> ");

		if (input.trim().toLowerCase() === "exit") {
			cleanup();
		}

		if (!input.trim()) continue;

		try {
			logger.info("Running kilo...");
			const result = await runKilo({
				message: input,
				onStdout: (data) => stdout.write(data),
				onStderr: (data) => stdout.write(data),
			});

			if (result.exitCode !== 0) {
				logger.error(`kilo exited with code ${result.exitCode}`);
			} else {
				logger.info("kilo completed successfully");
			}
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			logger.error(`error: ${msg}`);
		}

		stdout.write("\n");
	}
}

chat();
