import { describe, expect, it } from 'vitest';
import type { CommandResult } from '../types/index.js';
import { formatCommandResult, structuredCommandResult, toolResult, toolText } from './output.js';

const okResult: CommandResult = {
  command: 'bazel',
  args: ['build', '//:MyApp'],
  exitCode: 0,
  durationMs: 12345,
  output: 'Build completed successfully.\n',
  truncated: false,
};

const failResult: CommandResult = {
  command: 'bazel',
  args: ['test', '//:Tests'],
  exitCode: 1,
  durationMs: 5678,
  output: 'FAILED: //Tests\nSome test failure output',
  truncated: true,
  signal: 'SIGTERM',
};

describe('formatCommandResult', () => {
  it('formats successful command', () => {
    const out = formatCommandResult(okResult);
    expect(out).toContain('OK exit=0');
    expect(out).toContain('duration=12.3s');
    expect(out).toContain('$ bazel build //:MyApp');
    expect(out).toContain('Build completed successfully.');
  });

  it('formats failed command with signal and truncation', () => {
    const out = formatCommandResult(failResult);
    expect(out).toContain('FAILED exit=1');
    expect(out).toContain('signal=SIGTERM');
    expect(out).toContain('duration=5.7s');
    expect(out).toContain('[output truncated]');
    expect(out).toContain('FAILED: //Tests');
  });

  it('shows (no output) for empty output', () => {
    const out = formatCommandResult({ ...okResult, output: '' });
    expect(out).toContain('(no output)');
  });
});

describe('structuredCommandResult', () => {
  it('returns structured ok result', () => {
    const s = structuredCommandResult(okResult);
    expect(s.ok).toBe(true);
    expect(s.exitCode).toBe(0);
    expect(s.durationMs).toBe(12345);
    expect(s.truncated).toBe(false);
    expect(s.command).toBe('bazel build //:MyApp');
  });

  it('returns structured failed result with signal', () => {
    const s = structuredCommandResult(failResult);
    expect(s.ok).toBe(false);
    expect(s.exitCode).toBe(1);
    expect(s.signal).toBe('SIGTERM');
    expect(s.truncated).toBe(true);
  });
});

describe('toolText', () => {
  it('returns text content without error', () => {
    const r = toolText('hello');
    expect(r.content).toEqual([{ type: 'text', text: 'hello' }]);
    expect(r.isError).toBeUndefined();
  });

  it('returns text content with error flag', () => {
    const r = toolText('oops', true);
    const first = r.content[0];
    expect(first.type).toBe('text');
    expect(first.type === 'text' && first.text).toBe('oops');
    expect(r.isError).toBe(true);
  });
});

describe('toolResult', () => {
  it('returns text + structured content', () => {
    const r = toolResult('summary', { key: 'value' });
    const first = r.content[0];
    expect(first.type).toBe('text');
    expect(first.type === 'text' && first.text).toBe('summary');
    expect(r.structuredContent).toEqual({ key: 'value' });
    expect(r.isError).toBeUndefined();
  });

  it('marks error when flagged', () => {
    const r = toolResult('failed', {}, true);
    expect(r.isError).toBe(true);
  });
});
