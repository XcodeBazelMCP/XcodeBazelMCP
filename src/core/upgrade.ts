import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CommandResult } from '../types/index.js';
import { runCommand } from '../utils/process.js';

export interface VersionInfo {
  current: string;
  latest: string | null;
  updateAvailable: boolean;
  installMethod: InstallMethod;
}

export type InstallMethod = 'npm-global' | 'npm-local' | 'homebrew' | 'source' | 'unknown';

export function detectInstallMethod(): InstallMethod {
  const selfPath = getSelfPath();
  if (!selfPath) return 'unknown';

  if (selfPath.includes('/Cellar/') || selfPath.includes('/homebrew/')) return 'homebrew';
  if (selfPath.includes('/node_modules/.bin/')) return 'npm-local';
  if (selfPath.includes('/lib/node_modules/') || selfPath.includes('/npm/') || selfPath.includes('/pnpm/')) return 'npm-global';

  const pkgJson = findPackageJson(selfPath);
  if (pkgJson) return 'source';

  return 'unknown';
}

export function getCurrentVersion(): string {
  const pkgPath = findPackageJson(getSelfPath() || process.cwd());
  if (pkgPath) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
      return pkg.version || '0.0.0';
    } catch { /* fallback */ }
  }
  return '0.0.0';
}

export async function fetchLatestVersion(): Promise<string | null> {
  try {
    const result = await runCommand('npm', ['view', 'xcodebazelmcp', 'version'], {
      cwd: process.cwd(),
      timeoutSeconds: 15,
      maxOutput: 1_000,
    });
    if (result.exitCode === 0 && result.output.trim()) {
      return result.output.trim();
    }
    return null;
  } catch {
    return null;
  }
}

export async function checkForUpdate(): Promise<VersionInfo> {
  const current = getCurrentVersion();
  const latest = await fetchLatestVersion();
  const method = detectInstallMethod();
  return {
    current,
    latest,
    updateAvailable: latest !== null && latest !== current && compareVersions(latest, current) > 0,
    installMethod: method,
  };
}

export async function performUpgrade(method?: InstallMethod): Promise<CommandResult> {
  const resolved = method || detectInstallMethod();

  switch (resolved) {
    case 'npm-global':
      return runCommand('npm', ['install', '-g', 'xcodebazelmcp@latest'], {
        cwd: process.cwd(),
        timeoutSeconds: 120,
        maxOutput: 200_000,
      });
    case 'npm-local':
      return runCommand('npm', ['update', 'xcodebazelmcp'], {
        cwd: process.cwd(),
        timeoutSeconds: 120,
        maxOutput: 200_000,
      });
    case 'homebrew':
      return runCommand('brew', ['upgrade', 'xcodebazelmcp'], {
        cwd: process.cwd(),
        timeoutSeconds: 300,
        maxOutput: 200_000,
      });
    case 'source': {
      const selfPath = getSelfPath();
      const pkgJsonPath = findPackageJson(selfPath || process.cwd());
      const repoRoot = pkgJsonPath ? dirname(pkgJsonPath) : process.cwd();
      const pullResult = await runCommand('git', ['pull', '--rebase'], {
        cwd: repoRoot,
        timeoutSeconds: 60,
        maxOutput: 100_000,
      });
      if (pullResult.exitCode !== 0) return pullResult;
      const installResult = await runCommand('npm', ['install'], {
        cwd: repoRoot,
        timeoutSeconds: 120,
        maxOutput: 200_000,
      });
      if (installResult.exitCode !== 0) return installResult;
      return runCommand('npm', ['run', 'build'], {
        cwd: repoRoot,
        timeoutSeconds: 120,
        maxOutput: 200_000,
      });
    }
    default:
      return {
        command: 'upgrade',
        args: [],
        exitCode: 1,
        output: `Cannot determine install method. Reinstall via: npm install -g xcodebazelmcp@latest`,
        durationMs: 0,
        truncated: false,
      };
  }
}

export function upgradeHint(method: InstallMethod): string {
  switch (method) {
    case 'npm-global': return 'npm install -g xcodebazelmcp@latest';
    case 'npm-local': return 'npm update xcodebazelmcp';
    case 'homebrew': return 'brew upgrade xcodebazelmcp';
    case 'source': return 'git pull && npm install && npm run build';
    default: return 'npm install -g xcodebazelmcp@latest';
  }
}

export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

function getSelfPath(): string | null {
  try {
    return fileURLToPath(import.meta.url);
  } catch {
    return process.argv[1] || null;
  }
}

function findPackageJson(startPath: string | null): string | null {
  if (!startPath) return null;
  let dir = startPath;
  for (let i = 0; i < 10; i++) {
    const candidate = join(dir, 'package.json');
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}
