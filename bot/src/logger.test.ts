import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from './logger.js';

describe('logger', () => {
  let writeSpy: ReturnType<typeof vi.spyOn>;
  const originalLevel = process.env.LOG_LEVEL;

  beforeEach(() => {
    writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.LOG_LEVEL = originalLevel;
  });

  it('emits JSON with required fields on info', () => {
    process.env.LOG_LEVEL = 'info';
    logger.info('test-module', 'hello world', { foo: 'bar' });

    expect(writeSpy).toHaveBeenCalledOnce();
    const raw = String((writeSpy.mock.calls[0] as string[])[0]);
    const parsed = JSON.parse(raw.trim()) as Record<string, unknown>;
    expect(parsed.level).toBe('info');
    expect(parsed.module).toBe('test-module');
    expect(parsed.msg).toBe('hello world');
    expect(parsed.foo).toBe('bar');
    expect(typeof parsed.ts).toBe('string');
  });

  it('suppresses debug when LOG_LEVEL is info', () => {
    process.env.LOG_LEVEL = 'info';
    logger.debug('mod', 'should be suppressed');
    expect(writeSpy).not.toHaveBeenCalled();
  });

  it('emits debug when LOG_LEVEL is debug', () => {
    process.env.LOG_LEVEL = 'debug';
    logger.debug('mod', 'should appear');
    expect(writeSpy).toHaveBeenCalledOnce();
  });

  it('suppresses info when LOG_LEVEL is warn', () => {
    process.env.LOG_LEVEL = 'warn';
    logger.info('mod', 'should be suppressed');
    expect(writeSpy).not.toHaveBeenCalled();
  });

  it('emits warn and error when LOG_LEVEL is warn', () => {
    process.env.LOG_LEVEL = 'warn';
    logger.warn('mod', 'warn message');
    logger.error('mod', 'error message');
    expect(writeSpy).toHaveBeenCalledTimes(2);
  });

  it('defaults to info for unknown LOG_LEVEL', () => {
    process.env.LOG_LEVEL = 'verbose';
    logger.info('mod', 'should appear');
    logger.debug('mod', 'should not appear');
    expect(writeSpy).toHaveBeenCalledOnce();
  });

  it('includes extra fields in output', () => {
    process.env.LOG_LEVEL = 'info';
    logger.warn('mod', 'msg', { contactId: 42, sessionId: 'abc' });
    const raw = String((writeSpy.mock.calls[0] as string[])[0]);
    const parsed = JSON.parse(raw.trim()) as Record<string, unknown>;
    expect(parsed.contactId).toBe(42);
    expect(parsed.sessionId).toBe('abc');
  });
});
