import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getDaemonDir,
  isDaemonRunning,
  listOps,
  readDaemonPidFile,
  registerOp,
  socketPathForWorkspace,
  pidFileForWorkspace,
  startDaemon,
  shutdownDaemon,
  unregisterOp,
} from './index.js';

let tempDir: string;

beforeEach(() => {
  tempDir = join(tmpdir(), `daemon-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(tempDir, { recursive: true });
  vi.clearAllMocks();
});

afterEach(() => {
  if (existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

describe('daemon utilities', () => {
  it('generates deterministic socket path from workspace', () => {
    const a = socketPathForWorkspace('/foo/bar');
    const b = socketPathForWorkspace('/foo/bar');
    expect(a).toBe(b);
    expect(a).toContain('xbmcp-daemon-');
    expect(a).toMatch(/\.sock$/);
  });

  it('generates different paths for different workspaces', () => {
    const a = socketPathForWorkspace('/foo/bar');
    const b = socketPathForWorkspace('/foo/baz');
    expect(a).not.toBe(b);
  });

  it('generates deterministic pid file path', () => {
    const a = pidFileForWorkspace('/foo/bar');
    const b = pidFileForWorkspace('/foo/bar');
    expect(a).toBe(b);
    expect(a).toContain('.json');
  });

  it('returns daemon dir under home', () => {
    const dir = getDaemonDir();
    expect(dir).toContain('.xcodebazelmcp');
    expect(dir).toContain('daemons');
  });

  it('reports daemon not running for nonexistent workspace', () => {
    expect(isDaemonRunning('/tmp/nonexistent-ws-12345')).toBe(false);
  });
});

describe('daemon op management', () => {
  it('registers and lists operations', () => {
    const id = registerOp('log_capture', () => {}, { simulatorId: 'abc' });
    expect(id).toMatch(/^log_capture-/);

    const ops = listOps();
    const found = ops.find((o) => o.id === id);
    expect(found).toBeDefined();
    expect(found!.type).toBe('log_capture');
    expect(found!.meta.simulatorId).toBe('abc');

    unregisterOp(id);
  });

  it('unregisters operations and calls cleanup', () => {
    let cleaned = false;
    const id = registerOp('video_recording', () => { cleaned = true; }, {});
    expect(unregisterOp(id)).toBe(true);
    expect(cleaned).toBe(true);
    expect(unregisterOp(id)).toBe(false);
  });

  it('handles unknown op id gracefully', () => {
    expect(unregisterOp('nonexistent-op')).toBe(false);
  });
});

describe('readDaemonPidFile', () => {
  it('returns null when pid file does not exist', () => {
    const result = readDaemonPidFile('/nonexistent/workspace');
    expect(result).toBeNull();
  });

  it('parses pid file with valid JSON', () => {
    const daemonDir = getDaemonDir();
    mkdirSync(daemonDir, { recursive: true });
    const pidFile = pidFileForWorkspace(tempDir);
    const pidData = { pid: 12345, socketPath: '/tmp/test.sock', startedAt: new Date().toISOString() };
    writeFileSync(pidFile, JSON.stringify(pidData));

    const result = readDaemonPidFile(tempDir);

    expect(result).toEqual(pidData);

    if (existsSync(pidFile)) {
      rmSync(pidFile, { force: true });
    }
  });

  it('returns null on invalid JSON', () => {
    const daemonDir = getDaemonDir();
    mkdirSync(daemonDir, { recursive: true });
    const pidFile = pidFileForWorkspace(tempDir);
    writeFileSync(pidFile, 'not json');

    const result = readDaemonPidFile(tempDir);

    expect(result).toBeNull();

    if (existsSync(pidFile)) {
      rmSync(pidFile, { force: true });
    }
  });
});

describe('startDaemon', () => {
  it('creates a socket server and pid file', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);

    const info = startDaemon(tempDir);

    expect(info.workspacePath).toBe(tempDir);
    expect(info.socketPath).toBe(socketPathForWorkspace(tempDir));
    expect(readDaemonPidFile(tempDir)).toMatchObject({ workspacePath: tempDir });

    shutdownDaemon();
    exitSpy.mockRestore();
    const pidFile = pidFileForWorkspace(tempDir);
    if (existsSync(pidFile)) {
      rmSync(pidFile, { force: true });
    }
  });
});

describe('shutdownDaemon', () => {
  it('cleans up operations and exits', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    const cleanup = vi.fn();
    registerOp('log_capture', cleanup, {});

    shutdownDaemon();

    expect(cleanup).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0);
    exitSpy.mockRestore();
  });
});
