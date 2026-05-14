import { createServer, type Server, type Socket } from 'node:net';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir, homedir } from 'node:os';
import { createHash } from 'node:crypto';

export interface DaemonInfo {
  pid: number;
  socketPath: string;
  workspacePath: string;
  startedAt: string;
  uptime: number;
  activeOps: DaemonOpInfo[];
}

export interface DaemonOpInfo {
  id: string;
  type: 'log_capture' | 'video_recording' | 'lldb_session';
  startedAt: string;
  meta: Record<string, unknown>;
}

interface DaemonOp {
  id: string;
  type: DaemonOpInfo['type'];
  startedAt: Date;
  cleanup: () => void;
  meta: Record<string, unknown>;
}

export interface DaemonRequest {
  method: string;
  params?: Record<string, unknown>;
}

export interface DaemonResponse {
  ok: boolean;
  data?: unknown;
  error?: string;
}

const ops = new Map<string, DaemonOp>();
let opCounter = 0;
let serverInstance: Server | null = null;
let workspacePath = '';
const startedAt = new Date();

export function getDaemonDir(): string {
  const dir = join(homedir(), '.xcodebazelmcp', 'daemons');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

export function socketPathForWorkspace(wsPath: string): string {
  const hash = createHash('sha256').update(wsPath).digest('hex').slice(0, 12);
  return join(tmpdir(), `xbmcp-daemon-${hash}.sock`);
}

export function pidFileForWorkspace(wsPath: string): string {
  const hash = createHash('sha256').update(wsPath).digest('hex').slice(0, 12);
  return join(getDaemonDir(), `${hash}.json`);
}

export function registerOp(
  type: DaemonOp['type'],
  cleanup: () => void,
  meta: Record<string, unknown> = {},
): string {
  const id = `${type}-${++opCounter}`;
  ops.set(id, { id, type, startedAt: new Date(), cleanup, meta });
  return id;
}

export function unregisterOp(id: string): boolean {
  const op = ops.get(id);
  if (!op) return false;
  try { op.cleanup(); } catch { /* best effort */ }
  ops.delete(id);
  return true;
}

export function listOps(): DaemonOpInfo[] {
  return [...ops.values()].map((op) => ({
    id: op.id,
    type: op.type,
    startedAt: op.startedAt.toISOString(),
    meta: op.meta,
  }));
}

function buildInfo(): DaemonInfo {
  return {
    pid: process.pid,
    socketPath: socketPathForWorkspace(workspacePath),
    workspacePath,
    startedAt: startedAt.toISOString(),
    uptime: Math.round((Date.now() - startedAt.getTime()) / 1000),
    activeOps: listOps(),
  };
}

function handleRequest(req: DaemonRequest): DaemonResponse {
  switch (req.method) {
    case 'status':
      return { ok: true, data: buildInfo() };
    case 'list_ops':
      return { ok: true, data: listOps() };
    case 'register_op': {
      const type = req.params?.type as DaemonOp['type'];
      const meta = (req.params?.meta as Record<string, unknown>) || {};
      if (!type) return { ok: false, error: 'type is required' };
      const id = registerOp(type, () => {}, meta);
      return { ok: true, data: { id } };
    }
    case 'unregister_op': {
      const id = req.params?.id as string;
      if (!id) return { ok: false, error: 'id is required' };
      const removed = unregisterOp(id);
      return removed
        ? { ok: true, data: { id } }
        : { ok: false, error: `Unknown op: ${id}` };
    }
    case 'shutdown':
      setTimeout(() => shutdownDaemon(), 100);
      return { ok: true, data: 'shutting down' };
    case 'ping':
      return { ok: true, data: 'pong' };
    default:
      return { ok: false, error: `Unknown method: ${req.method}` };
  }
}

function handleConnection(socket: Socket): void {
  let buffer = '';
  socket.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const req = JSON.parse(line) as DaemonRequest;
        const resp = handleRequest(req);
        socket.write(JSON.stringify(resp) + '\n');
      } catch (err) {
        socket.write(JSON.stringify({ ok: false, error: (err as Error).message }) + '\n');
      }
    }
  });
}

export function startDaemon(wsPath: string): DaemonInfo {
  if (serverInstance) {
    throw new Error('Daemon already running in this process.');
  }

  workspacePath = wsPath;
  const sockPath = socketPathForWorkspace(wsPath);

  if (existsSync(sockPath)) {
    try { unlinkSync(sockPath); } catch { /* stale socket */ }
  }

  const server = createServer(handleConnection);
  server.listen(sockPath);
  serverInstance = server;

  const pidFile = pidFileForWorkspace(wsPath);
  const info = buildInfo();
  writeFileSync(pidFile, JSON.stringify(info, null, 2));

  process.on('SIGTERM', () => shutdownDaemon());
  process.on('SIGINT', () => shutdownDaemon());

  return info;
}

export function shutdownDaemon(): void {
  for (const [id] of ops) {
    unregisterOp(id);
  }

  if (serverInstance) {
    serverInstance.close();
    serverInstance = null;
  }

  const sockPath = socketPathForWorkspace(workspacePath);
  try { if (existsSync(sockPath)) unlinkSync(sockPath); } catch { /* best effort */ }

  const pidFile = pidFileForWorkspace(workspacePath);
  try { if (existsSync(pidFile)) unlinkSync(pidFile); } catch { /* best effort */ }

  process.exit(0);
}

export function readDaemonPidFile(wsPath: string): DaemonInfo | null {
  const pidFile = pidFileForWorkspace(wsPath);
  if (!existsSync(pidFile)) return null;
  try {
    const raw = readFileSync(pidFile, 'utf8');
    return JSON.parse(raw) as DaemonInfo;
  } catch {
    return null;
  }
}

export function isDaemonRunning(wsPath: string): boolean {
  const info = readDaemonPidFile(wsPath);
  if (!info) return false;
  try {
    process.kill(info.pid, 0);
    return true;
  } catch {
    try { unlinkSync(pidFileForWorkspace(wsPath)); } catch { /* stale */ }
    try { unlinkSync(socketPathForWorkspace(wsPath)); } catch { /* stale */ }
    return false;
  }
}
