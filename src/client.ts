const BASE_URL = 'https://api.kilo.ai/api/gateway';
const API_KEY = process.env.KILO_API_KEY;

export async function chat(messages: ChatMessage[]): Promise<string> {
  if (!API_KEY) {
    throw new Error('KILO_API_KEY not set. Add it to your .env file.');
  }

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'kilo-auto/free',
      messages,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${JSON.stringify(data)}`);
  }

  if (!data.choices || !data.choices[0]) {
    throw new Error(`Unexpected response: ${JSON.stringify(data)}`);
  }

  return data.choices[0].message.content;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const SYSTEM_PROMPT = `You are SimpleClaw. When you need to run a command, respond with ONLY:
[TOOL] run {"command": "command here"} [/TOOL]`;
