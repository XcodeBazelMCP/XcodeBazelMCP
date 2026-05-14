import { describe, expect, it } from 'vitest';
import {
  getDaemonDir,
  isDaemonRunning,
  listOps,
  registerOp,
  socketPathForWorkspace,
  pidFileForWorkspace,
  unregisterOp,
} from './index.js';

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
