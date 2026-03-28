import readline from "node:readline";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const apiKey = process.env.KILO_API_KEY;
if (!apiKey) {
	console.error("Error: KILO_API_KEY environment variable is required");
	process.exit(1);
}

const kilo = createOpenAI({
	baseURL: "https://api.kilo.ai/api/gateway",
	apiKey,
});

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

async function chat() {
	console.log("SimpleClaw Chatbot (type 'exit' to quit)\n");

	while (true) {
		const input = await new Promise<string>((resolve) => {
			rl.question("> ", resolve);
		});

		if (input.trim().toLowerCase() === "exit") {
			console.log("Goodbye!");
			rl.close();
			break;
		}

		try {
			const result = streamText({
				model: kilo.chat("kilo-auto/balanced"),
				messages: [{ role: "user", content: input }],
			});

			process.stdout.write("\n");
			for await (const textPart of result.textStream) {
				process.stdout.write(textPart);
			}
			process.stdout.write("\n\n");
		} catch (error) {
			console.error("Error:", error instanceof Error ? error.message : error);
		}
	}
}

chat();
