import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

export function assertBazelWorkspace(workspacePath: string): void {
  if (!existsSync(workspacePath) || !statSync(workspacePath).isDirectory()) {
    throw new Error(`Workspace does not exist or is not a directory: ${workspacePath}`);
  }

  const markers = ['MODULE.bazel', 'WORKSPACE', 'WORKSPACE.bazel'];
  if (!markers.some((marker) => existsSync(join(workspacePath, marker)))) {
    throw new Error(`Workspace has no MODULE.bazel, WORKSPACE, or WORKSPACE.bazel: ${workspacePath}`);
  }
}

export function readBspStatus(workspacePath: string): string[] {
  const bspPath = join(workspacePath, '.bsp', 'skbsp.json');
  const lines = [
    `workspace: ${workspacePath}`,
    `.bsp/skbsp.json: ${existsSync(bspPath) ? 'found' : 'missing'}`,
  ];

  if (existsSync(bspPath)) {
    try {
      const config = JSON.parse(readFileSync(bspPath, 'utf8')) as {
        name?: string;
        argv?: string[];
      };
      lines.push(`name: ${config.name || '(unknown)'}`);
      lines.push(`argv: ${Array.isArray(config.argv) ? config.argv.join(' ') : '(missing)'}`);
    } catch (err) {
      lines.push(`parse error: ${(err as Error).message}`);
    }
  }

  return lines;
}
