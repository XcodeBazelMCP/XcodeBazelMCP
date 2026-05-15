import { connect } from 'node:net';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import {
  isDaemonRunning,
  readDaemonPidFile,
  socketPathForWorkspace,
  type DaemonInfo,
  type DaemonRequest,
  type DaemonResponse,
} from './index.js';

function sendRequest(sockPath: string, req: DaemonRequest, timeoutMs = 5_000): Promise<DaemonResponse> {
  return new Promise((resolvePromise, reject) => {
    const socket = connect(sockPath);
    let buffer = '';
    let done = false;

    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        socket.destroy();
        reject(new Error('Daemon request timed out'));
      }
    }, timeoutMs);

    socket.on('connect', () => {
      socket.write(JSON.stringify(req) + '\n');
    });

    socket.on('data', (chunk) => {
      buffer += chunk.toString();
      const idx = buffer.indexOf('\n');
      if (idx >= 0) {
        done = true;
        clearTimeout(timer);
        const line = buffer.slice(0, idx);
        socket.destroy();
        try {
          resolvePromise(JSON.parse(line) as DaemonResponse);
        } catch {
          reject(new Error(`Invalid daemon response: ${line}`));
        }
      }
    });

    socket.on('error', (err) => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        reject(err);
      }
    });
  });
}

export async function daemonStatus(workspacePath: string): Promise<DaemonInfo | null> {
  if (!isDaemonRunning(workspacePath)) return null;
  try {
    const resp = await sendRequest(
      socketPathForWorkspace(workspacePath),
      { method: 'status' },
    );
    if (resp.ok) return resp.data as DaemonInfo;
    return readDaemonPidFile(workspacePath);
  } catch {
    return readDaemonPidFile(workspacePath);
  }
}


export async function daemonShutdown(workspacePath: string): Promise<void> {
  if (!isDaemonRunning(workspacePath)) return;
  try {
    await sendRequest(
      socketPathForWorkspace(workspacePath),
      { method: 'shutdown' },
      3_000,
    );
  } catch {
    const info = readDaemonPidFile(workspacePath);
    if (info) {
      try { process.kill(info.pid, 'SIGTERM'); } catch { /* already dead */ }
    }
  }
}

function spawnDaemon(workspacePath: string): { pid: number } {
  if (isDaemonRunning(workspacePath)) {
    const info = readDaemonPidFile(workspacePath);
    if (info) return { pid: info.pid };
    throw new Error('Daemon appears running but no pid file found.');
  }

  const resolved = resolve(workspacePath);
  const child = spawn(
    process.execPath,
    [process.argv[1], 'daemon', '--workspace', resolved],
    {
      detached: true,
      stdio: 'ignore',
      env: { ...process.env, XBMCP_DAEMON: '1' },
    },
  );

  child.unref();
  return { pid: child.pid || -1 };
}

export async function ensureDaemon(workspacePath: string): Promise<DaemonInfo> {
  if (isDaemonRunning(workspacePath)) {
    const info = await daemonStatus(workspacePath);
    if (info) return info;
  }

  spawnDaemon(workspacePath);

  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 250));
    if (isDaemonRunning(workspacePath)) {
      const info = await daemonStatus(workspacePath);
      if (info) return info;
    }
  }

  throw new Error('Daemon failed to start within 5 seconds.');
}
