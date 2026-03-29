import type { ParsedMessage } from './types.js';

let corrIdCounter = 0;

export function generateCorrId(): string {
  corrIdCounter++;
  return `${Date.now()}-${corrIdCounter}`;
}

export function encodeCommand(corrId: string, cmd: string): string {
  return JSON.stringify({ corrId, cmd });
}

export function decodeMessage(data: string): ParsedMessage | null {
  try {
    return JSON.parse(data) as ParsedMessage;
  } catch {
    return null;
  }
}

/**
 * Encode a send-message command.
 * contactId: SimpleX contactId (number)
 * text: message text
 */
export function encodeSendMessage(corrId: string, contactId: number, text: string): string {
  const composedMessages = JSON.stringify([{ msgContent: { text } }]);
  const cmd = `/_send @${contactId} json ${composedMessages}`;
  return encodeCommand(corrId, cmd);
}
