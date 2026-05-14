import { spawn } from 'node:child_process';
import type { CommandResult } from '../types/index.js';

export interface RunCommandOptions {
  cwd: string;
  timeoutSeconds?: number;
  maxOutput: number;
  env?: NodeJS.ProcessEnv;
}

export interface StreamChunk {
  stream: 'stdout' | 'stderr';
  data: string;
}

export function runCommand(
  command: string,
  args: string[],
  options: RunCommandOptions,
): Promise<CommandResult> {
  const timeoutMs = Math.max(1, Number(options.timeoutSeconds || 600)) * 1000;
  const started = Date.now();

  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env || process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let output = '';
    let truncated = false;
    const append = (chunk: Buffer) => {
      if (output.length < options.maxOutput) {
        output += chunk.toString();
        if (output.length > options.maxOutput) {
          output = output.slice(0, options.maxOutput);
          truncated = true;
        }
      } else {
        truncated = true;
      }
    };

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 2_000).unref();
    }, timeoutMs);

    child.stdout.on('data', append);
    child.stderr.on('data', append);
    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        command,
        args,
        exitCode: -1,
        durationMs: Date.now() - started,
        output: String(err),
        truncated,
      });
    });
    child.on('close', (exitCode, signal) => {
      clearTimeout(timer);
      resolve({
        command,
        args,
        exitCode: exitCode ?? -1,
        signal,
        durationMs: Date.now() - started,
        output,
        truncated,
      });
    });
  });
}

export async function* runCommandStreaming(
  command: string,
  args: string[],
  options: RunCommandOptions,
): AsyncGenerator<StreamChunk | CommandResult> {
  const timeoutMs = Math.max(1, Number(options.timeoutSeconds || 600)) * 1000;
  const started = Date.now();

  const child = spawn(command, args, {
    cwd: options.cwd,
    env: options.env || process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let output = '';
  let truncated = false;
  const appendAndTrack = (data: string) => {
    if (output.length < options.maxOutput) {
      output += data;
      if (output.length > options.maxOutput) {
        output = output.slice(0, options.maxOutput);
        truncated = true;
      }
    } else {
      truncated = true;
    }
  };

  const timer = setTimeout(() => {
    child.kill('SIGTERM');
    setTimeout(() => child.kill('SIGKILL'), 2_000).unref();
  }, timeoutMs);

  type QueueItem = StreamChunk | { type: 'error'; error: Error } | { type: 'close'; exitCode: number; signal?: NodeJS.Signals | null };
  const queue: QueueItem[] = [];
  let resolve: (() => void) | null = null;
  let done = false;

  const push = (item: QueueItem) => {
    queue.push(item);
    if (resolve) {
      resolve();
      resolve = null;
    }
  };

  child.stdout.on('data', (chunk: Buffer) => {
    const data = chunk.toString();
    appendAndTrack(data);
    push({ stream: 'stdout', data });
  });
  child.stderr.on('data', (chunk: Buffer) => {
    const data = chunk.toString();
    appendAndTrack(data);
    push({ stream: 'stderr', data });
  });
  child.on('error', (err) => {
    clearTimeout(timer);
    done = true;
    push({ type: 'error', error: err });
  });
  child.on('close', (exitCode, signal) => {
    clearTimeout(timer);
    done = true;
    push({ type: 'close', exitCode: exitCode ?? -1, signal });
  });

  while (true) {
    while (queue.length > 0) {
      const item = queue.shift()!;
      if ('stream' in item) {
        yield item as StreamChunk;
      } else if ('type' in item && item.type === 'error') {
        yield {
          command,
          args,
          exitCode: -1,
          durationMs: Date.now() - started,
          output: String(item.error),
          truncated,
        } satisfies CommandResult;
        return;
      } else if ('type' in item && item.type === 'close') {
        yield {
          command,
          args,
          exitCode: item.exitCode,
          signal: item.signal,
          durationMs: Date.now() - started,
          output,
          truncated,
        } satisfies CommandResult;
        return;
      }
    }
    if (done && queue.length === 0) return;
    await new Promise<void>((r) => { resolve = r; });
  }
}
