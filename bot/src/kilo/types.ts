export interface KiloTextEvent {
  type: 'text';
  sessionID: string;
  content: string;
}

export interface KiloTurnEndEvent {
  type: 'turn_end';
  sessionID: string;
}

export interface KiloToolCallEvent {
  type: 'tool_call';
  sessionID: string;
  callID: string;
  tool: string;
  state: 'pending' | 'running' | 'completed' | 'error';
}

export type KiloSSEEvent =
  | KiloTextEvent
  | KiloTurnEndEvent
  | KiloToolCallEvent
  | { type: string; sessionID?: string; [key: string]: unknown };

export interface KiloChatPart {
  type: 'text';
  text: string;
  metadata?: { role?: 'user' | 'assistant' | 'system' };
}

export interface KiloChatRequest {
  parts: KiloChatPart[];
}

export interface KiloSessionResponse {
  id: string;
}

export interface KiloHealthResponse {
  healthy: boolean;
  version: string;
}
