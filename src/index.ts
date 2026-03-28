import { chat, SYSTEM_PROMPT, type ChatMessage } from './client';
import { runTool } from './core/executor';
import { logger } from './core/logger';

const TOOL_PATTERN = /\[TOOL\]\s*run\s*(\{.*?\})\s*\[\/TOOL\]/s;

async function main() {
  const userInput = process.argv.slice(2).join(' ') || 'Hello';
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userInput },
  ];

  logger.info(`User: ${userInput}`);

  const response = await chat(messages);
  const match = response.match(TOOL_PATTERN);

  if (match) {
    const { command } = JSON.parse(match[1]);
    logger.info(`Running: ${command}`);
    const result = await runTool(command);
    logger.info(`[exit:${result.exitCode} | ${result.durationMs}ms]\n${result.output}`);
  } else {
    logger.info(response);
  }
}

main();
