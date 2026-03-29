import { beforeEach, describe, expect, it } from 'vitest';
import { decodeMessage, encodeCommand, encodeSendMessage, generateCorrId } from './protocol.js';

describe('generateCorrId', () => {
  it('returns a non-empty string', () => {
    expect(generateCorrId()).toBeTruthy();
  });

  it('returns unique values on each call', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateCorrId()));
    expect(ids.size).toBe(100);
  });
});

describe('encodeCommand', () => {
  it('serialises corrId and cmd into JSON', () => {
    const result = encodeCommand('abc', '/test');
    expect(JSON.parse(result)).toEqual({ corrId: 'abc', cmd: '/test' });
  });
});

describe('decodeMessage', () => {
  it('parses valid JSON', () => {
    const raw = JSON.stringify({ corrId: '1', resp: { type: 'ok' } });
    expect(decodeMessage(raw)).toEqual({ corrId: '1', resp: { type: 'ok' } });
  });

  it('returns null for invalid JSON', () => {
    expect(decodeMessage('not json')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(decodeMessage('')).toBeNull();
  });
});

describe('encodeSendMessage', () => {
  it('builds the correct /_send command string', () => {
    const raw = encodeSendMessage('cid-1', 42, 'hello world');
    const parsed = JSON.parse(raw) as { corrId: string; cmd: string };
    expect(parsed.corrId).toBe('cid-1');
    expect(parsed.cmd).toMatch(/^\/_send @42 json /);
    const payload = JSON.parse(parsed.cmd.replace('/_send @42 json ', '')) as unknown[];
    expect(payload).toEqual([{ msgContent: { text: 'hello world' } }]);
  });
});
