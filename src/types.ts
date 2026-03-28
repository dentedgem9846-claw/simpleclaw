export interface ToolCall {
  name: string;
  args: Record<string, string>;
}

export interface ToolResult {
  output: string;
  exitCode: number;
  durationMs: number;
  truncated?: boolean;
}

export interface MemoryNote {
  id: string;
  content: string;
  links: string[];
  createdAt: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AgentState {
  messages: Message[];
  memory: MemoryNote[];
}
