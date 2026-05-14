import type { CommandResult, ToolCallResult } from '../types/index.js';

export function toolText(text: string, isError = false): ToolCallResult {
  return {
    content: [{ type: 'text', text }],
    isError: isError || undefined,
  };
}

export function toolResult(
  text: string,
  structured: Record<string, unknown>,
  isError = false,
): ToolCallResult {
  return {
    content: [{ type: 'text', text }],
    isError: isError || undefined,
    structuredContent: structured,
  };
}

export function formatCommandResult(commandResult: CommandResult): string {
  const commandLine = [commandResult.command, ...commandResult.args].join(' ');
  const status = commandResult.exitCode === 0 ? 'OK' : 'FAILED';
  const signal = commandResult.signal ? ` signal=${commandResult.signal}` : '';
  const truncated = commandResult.truncated ? '\n[output truncated]' : '';

  return [
    `${status} exit=${commandResult.exitCode}${signal} duration=${(
      commandResult.durationMs / 1000
    ).toFixed(1)}s`,
    `$ ${commandLine}`,
    '',
    commandResult.output.trim() || '(no output)',
    truncated,
  ].join('\n');
}

export function structuredCommandResult(result: CommandResult): Record<string, unknown> {
  return {
    ok: result.exitCode === 0,
    exitCode: result.exitCode,
    signal: result.signal || undefined,
    durationMs: result.durationMs,
    command: [result.command, ...result.args].join(' '),
    output: result.output,
    truncated: result.truncated,
  };
}
