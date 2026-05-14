import { spawn, type ChildProcess } from 'node:child_process';

export interface LldbSession {
  child: ChildProcess;
  output: string;
  pid: number;
  processName: string;
  target: 'simulator' | 'device';
}

const MAX_OUTPUT = 500_000;
const sessions = new Map<string, LldbSession>();
let sessionCounter = 0;

export function getSession(sessionId: string): LldbSession {
  const session = sessions.get(sessionId);
  if (!session) throw new Error(`Unknown LLDB session: ${sessionId}. Use lldb_attach first.`);
  if (session.child.killed || session.child.exitCode !== null) {
    sessions.delete(sessionId);
    throw new Error(`LLDB session ${sessionId} has terminated. Attach again.`);
  }
  return session;
}

export function listSessions(): Array<{ sessionId: string; pid: number; processName: string; target: string }> {
  const result: Array<{ sessionId: string; pid: number; processName: string; target: string }> = [];
  for (const [id, session] of sessions) {
    if (session.child.killed || session.child.exitCode !== null) {
      sessions.delete(id);
      continue;
    }
    result.push({ sessionId: id, pid: session.pid, processName: session.processName, target: session.target });
  }
  return result;
}

export async function attachToProcess(
  pid: number,
  processName: string,
  target: 'simulator' | 'device' = 'simulator',
  deviceName?: string,
): Promise<{ sessionId: string; output: string }> {
  const sessionId = `lldb-${++sessionCounter}`;

  const child = spawn('xcrun', ['lldb', '--no-use-colors'], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  const session: LldbSession = { child, output: '', pid, processName, target };
  sessions.set(sessionId, session);

  child.stdout!.on('data', (chunk: Buffer) => {
    if (session.output.length < MAX_OUTPUT) {
      session.output += chunk.toString();
    }
  });
  child.stderr!.on('data', (chunk: Buffer) => {
    if (session.output.length < MAX_OUTPUT) {
      session.output += chunk.toString();
    }
  });

  child.on('close', () => {
    sessions.delete(sessionId);
  });

  await waitForPrompt(session, 5_000);

  let attachOutput: string;
  if (target === 'device' && deviceName) {
    await sendCommand(session, `device select ${deviceName}`, 10_000);
    // device process attach is async — command returns before the process is stopped.
    // Send the attach, then poll process status until the process stops.
    await sendCommand(session, `device process attach -p ${pid}`, 10_000);
    attachOutput = await waitForProcessStop(session, 30_000);
  } else {
    attachOutput = await sendCommand(session, `process attach --pid ${pid}`, 15_000);
  }

  return { sessionId, output: attachOutput };
}

export async function attachByName(
  processName: string,
  waitFor: boolean = false,
  target: 'simulator' | 'device' = 'simulator',
  deviceName?: string,
): Promise<{ sessionId: string; output: string }> {
  const sessionId = `lldb-${++sessionCounter}`;

  const child = spawn('xcrun', ['lldb', '--no-use-colors'], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  const session: LldbSession = { child, output: '', pid: 0, processName, target };
  sessions.set(sessionId, session);

  child.stdout!.on('data', (chunk: Buffer) => {
    if (session.output.length < MAX_OUTPUT) {
      session.output += chunk.toString();
    }
  });
  child.stderr!.on('data', (chunk: Buffer) => {
    if (session.output.length < MAX_OUTPUT) {
      session.output += chunk.toString();
    }
  });

  child.on('close', () => {
    sessions.delete(sessionId);
  });

  await waitForPrompt(session, 5_000);

  let attachOutput: string;
  if (target === 'device' && deviceName) {
    await sendCommand(session, `device select ${deviceName}`, 10_000);
    const cmd = waitFor
      ? `device process attach --name "${processName}" --waitfor`
      : `device process attach --name "${processName}"`;
    await sendCommand(session, cmd, waitFor ? 60_000 : 10_000);
    attachOutput = await waitForProcessStop(session, waitFor ? 60_000 : 30_000);
  } else {
    const cmd = waitFor
      ? `process attach --name "${processName}" --waitfor`
      : `process attach --name "${processName}"`;
    attachOutput = await sendCommand(session, cmd, waitFor ? 60_000 : 15_000);
  }

  // Try to extract the PID from attach output
  const pidMatch = attachOutput.match(/Process (\d+)/);
  if (pidMatch) {
    session.pid = parseInt(pidMatch[1], 10);
  }

  return { sessionId, output: attachOutput };
}

export async function detach(sessionId: string): Promise<string> {
  const session = getSession(sessionId);
  const output = await sendCommand(session, 'process detach', 5_000);
  await sendCommand(session, 'quit', 3_000).catch(() => {});
  session.child.kill('SIGTERM');
  sessions.delete(sessionId);
  return output;
}

export async function setBreakpoint(
  sessionId: string,
  options: {
    file?: string;
    line?: number;
    symbol?: string;
    module?: string;
    condition?: string;
    oneShot?: boolean;
  },
): Promise<string> {
  const session = getSession(sessionId);
  const parts = ['breakpoint set'];
  if (options.file) parts.push(`--file "${options.file}"`);
  if (options.line !== undefined) parts.push(`--line ${options.line}`);
  if (options.symbol) parts.push(`--name "${options.symbol}"`);
  if (options.module) parts.push(`--shlib "${options.module}"`);
  if (options.condition) parts.push(`--condition '${options.condition}'`);
  if (options.oneShot) parts.push('--one-shot true');
  return sendCommand(session, parts.join(' '));
}

export async function deleteBreakpoint(sessionId: string, breakpointId: number): Promise<string> {
  const session = getSession(sessionId);
  return sendCommand(session, `breakpoint delete ${breakpointId}`);
}

export async function listBreakpoints(sessionId: string): Promise<string> {
  const session = getSession(sessionId);
  return sendCommand(session, 'breakpoint list');
}

export async function continueExecution(sessionId: string): Promise<string> {
  const session = getSession(sessionId);
  return sendCommand(session, 'continue', 5_000);
}

export async function stepOver(sessionId: string): Promise<string> {
  const session = getSession(sessionId);
  return sendCommand(session, 'next', 10_000);
}

export async function stepInto(sessionId: string): Promise<string> {
  const session = getSession(sessionId);
  return sendCommand(session, 'step', 10_000);
}

export async function stepOut(sessionId: string): Promise<string> {
  const session = getSession(sessionId);
  return sendCommand(session, 'finish', 10_000);
}

export async function getBacktrace(sessionId: string, threadIndex?: number): Promise<string> {
  const session = getSession(sessionId);
  const cmd = threadIndex !== undefined ? `thread backtrace --thread ${threadIndex}` : 'thread backtrace';
  return sendCommand(session, cmd);
}

export async function getVariables(sessionId: string, scope: 'local' | 'args' | 'all' = 'all'): Promise<string> {
  const session = getSession(sessionId);
  switch (scope) {
    case 'local':
      return sendCommand(session, 'frame variable --no-args');
    case 'args':
      return sendCommand(session, 'frame variable --no-locals');
    case 'all':
      return sendCommand(session, 'frame variable');
  }
}

export async function evaluateExpression(sessionId: string, expression: string): Promise<string> {
  const session = getSession(sessionId);
  return sendCommand(session, `expression -- ${expression}`);
}

export async function getThreadList(sessionId: string): Promise<string> {
  const session = getSession(sessionId);
  return sendCommand(session, 'thread list');
}

export async function selectThread(sessionId: string, threadIndex: number): Promise<string> {
  const session = getSession(sessionId);
  return sendCommand(session, `thread select ${threadIndex}`);
}

export async function selectFrame(sessionId: string, frameIndex: number): Promise<string> {
  const session = getSession(sessionId);
  return sendCommand(session, `frame select ${frameIndex}`);
}

export async function runLldbCommand(sessionId: string, command: string): Promise<string> {
  const session = getSession(sessionId);
  if (/^\s*quit\s*$/i.test(command)) {
    throw new Error('Use lldb_detach to end a session instead of quit.');
  }
  return sendCommand(session, command);
}

function cleanLldbOutput(raw: string): string {
  return raw
    .replace(/__XBMCP_(BEGIN|END)_\d+__/g, '')
    .replace(/\(lldb\)\s*script\s+print\("[^"]*"?\)?\s*/g, '')
    .replace(/^\s*script\s+print\("[^"]*"?\)?\s*$/gm, '')
    .replace(/^"\)\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function sendCommand(session: LldbSession, command: string, timeoutMs = 10_000): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const markerBegin = `__XBMCP_BEGIN_${Date.now()}__`;
    const markerEnd = `__XBMCP_END_${Date.now()}__`;

    const outputBefore = session.output.length;
    let collected = '';
    let capturing = false;

    const onData = () => {
      const newOutput = session.output.slice(outputBefore);
      if (!capturing) {
        const beginIdx = newOutput.indexOf(markerBegin);
        if (beginIdx !== -1) {
          capturing = true;
          collected = newOutput.slice(beginIdx + markerBegin.length);
        }
      } else {
        collected = session.output.slice(outputBefore);
        const beginIdx = collected.indexOf(markerBegin);
        if (beginIdx !== -1) {
          collected = collected.slice(beginIdx + markerBegin.length);
        }
      }
      if (capturing) {
        const endIdx = collected.indexOf(markerEnd);
        if (endIdx !== -1) {
          cleanup();
          resolve(cleanLldbOutput(collected.slice(0, endIdx)));
        }
      }
    };

    const timer = setTimeout(() => {
      cleanup();
      const allNew = session.output.slice(outputBefore).trim();
      resolve(cleanLldbOutput(allNew) || '(timeout waiting for LLDB response)');
    }, timeoutMs);

    const dataHandler = () => onData();
    session.child.stdout!.on('data', dataHandler);
    session.child.stderr!.on('data', dataHandler);

    const closeHandler = () => {
      cleanup();
      reject(new Error('LLDB process exited before command completed'));
    };

    const cleanup = () => {
      clearTimeout(timer);
      session.child.stdout!.removeListener('data', dataHandler);
      session.child.stderr!.removeListener('data', dataHandler);
      session.child.removeListener('close', closeHandler);
    };

    session.child.on('close', closeHandler);

    const stdin = session.child.stdin!;
    stdin.write(`script print("${markerBegin}")\n`);
    stdin.write(`${command}\n`);
    stdin.write(`script print("${markerEnd}")\n`);
  });
}

async function waitForProcessStop(session: LldbSession, timeoutMs: number): Promise<string> {
  return new Promise<string>((resolve) => {
    const startLen = session.output.length;
    const timer = setTimeout(() => {
      session.child.stdout!.removeListener('data', check);
      const statusOut = sendCommand(session, 'process status', 5_000)
        .then(s => cleanLldbOutput(s))
        .catch(() => '(process status unavailable)');
      statusOut.then(resolve);
    }, timeoutMs);

    const check = () => {
      const newOut = session.output.slice(startLen);
      if (newOut.includes('stopped') || newOut.includes('Process ')) {
        clearTimeout(timer);
        session.child.stdout!.removeListener('data', check);
        setTimeout(() => {
          const captured = session.output.slice(startLen);
          resolve(cleanLldbOutput(captured));
        }, 500);
      }
    };

    session.child.stdout!.on('data', check);
    check();
  });
}

async function waitForPrompt(session: LldbSession, timeoutMs: number): Promise<void> {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, timeoutMs);
    const check = () => {
      if (session.output.includes('(lldb)')) {
        clearTimeout(timer);
        session.child.stdout!.removeListener('data', check);
        resolve();
      }
    };
    session.child.stdout!.on('data', check);
    // Also resolve immediately if already there
    check();
  });
}
