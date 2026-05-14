import { getConfig } from '../runtime/config.js';
import type { BuildArgs, BuildMode, BuildPlatform, CommandResult, TargetKind } from '../types/index.js';
import { runCommand, runCommandStreaming, type StreamChunk } from '../utils/process.js';
import { assertBazelWorkspace } from './workspace.js';

let lastCommand: CommandResult | null = null;

export function getLastCommand(): CommandResult | null {
  return lastCommand;
}

export function asStringArray(value: unknown, name: string): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    throw new Error(`${name} must be an array of strings.`);
  }
  return value;
}

export function requireLabel(value: unknown, name = 'target'): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${name} is required.`);
  }
  if (!/^(@{1,2}[\w.+~-]*)?\/\/[A-Za-z0-9_.\-/$+]*(?::[A-Za-z0-9_.\-$%+=~]+|\.\.\.)?$/.test(value)) {
    throw new Error(`${name} must be a Bazel label or package pattern, got: ${value}`);
  }
  return value;
}

export function sanitizeQueryExpression(expression: unknown): string {
  if (typeof expression !== 'string' || expression.trim().length === 0) {
    throw new Error('expression is required.');
  }
  if (/[;&|`$<>]/.test(expression)) {
    throw new Error('expression contains shell-like control characters.');
  }
  return expression;
}

export function simulatorArgs(args: { simulatorName?: unknown; simulatorVersion?: unknown }): string[] {
  const values: string[] = [];
  if (typeof args.simulatorName === 'string' && args.simulatorName.trim()) {
    values.push(`--ios_simulator_device=${args.simulatorName.trim()}`);
  }
  if (typeof args.simulatorVersion === 'string' && args.simulatorVersion.trim()) {
    values.push(`--ios_simulator_version=${args.simulatorVersion.trim()}`);
  }
  return values;
}

export function modeArgs(buildMode?: BuildMode): string[] {
  const mode = buildMode || 'none';
  switch (mode) {
    case 'none':
      return [];
    case 'debug':
      return ['--config=debug'];
    case 'release':
      return ['--config=ios_release'];
    case 'release_with_symbols':
      return ['--config=ios_release', '--config=generate_dsym'];
    default: {
      const _exhaustive: never = mode;
      throw new Error(`Unknown build mode: ${_exhaustive}`);
    }
  }
}

export function platformArgs(platform?: BuildPlatform): string[] {
  const p = platform || 'none';
  switch (p) {
    case 'none':
      return [];
    case 'simulator':
      return ['--ios_multi_cpus=sim_arm64'];
    case 'device':
      return ['--ios_multi_cpus=arm64'];
    case 'macos':
      return [];
    case 'tvos':
      return ['--tvos_cpus=sim_arm64'];
    case 'watchos':
      return ['--watchos_cpus=arm64'];
    case 'visionos':
      return ['--visionos_cpus=sim_arm64'];
    default: {
      const _exhaustive: never = p;
      throw new Error(`Unknown platform: ${_exhaustive}`);
    }
  }
}

export function configArgs(value: unknown): string[] {
  return asStringArray(value, 'configs').map((config) => {
    if (!/^[A-Za-z0-9_.-]+$/.test(config)) {
      throw new Error(`Invalid config value: ${config}`);
    }
    return `--config=${config}`;
  });
}

export function discoverExpression(kind: TargetKind = 'all', scope?: string): string {
  const queryScope = scope || '(//Apps/... union //Packages/...)';
  switch (kind) {
    case 'apps':
      return `kind("ios_application rule", ${queryScope})`;
    case 'tests':
      return `(kind("ios_unit_test rule", ${queryScope}) union kind("ios_ui_test rule", ${queryScope}) union kind("ios_build_test rule", ${queryScope}))`;
    case 'all':
      return `(kind("ios_application rule", ${queryScope}) union kind("ios_unit_test rule", ${queryScope}) union kind("ios_ui_test rule", ${queryScope}) union kind("ios_build_test rule", ${queryScope}))`;
    case 'macos_apps':
      return `kind("macos_application rule", ${queryScope})`;
    case 'macos_tests':
      return `kind("macos_unit_test rule", ${queryScope})`;
    case 'macos_all':
      return `(kind("macos_application rule", ${queryScope}) union kind("macos_unit_test rule", ${queryScope}))`;
    case 'tvos_apps':
      return `kind("tvos_application rule", ${queryScope})`;
    case 'tvos_tests':
      return `kind("tvos_unit_test rule", ${queryScope})`;
    case 'tvos_all':
      return `(kind("tvos_application rule", ${queryScope}) union kind("tvos_unit_test rule", ${queryScope}))`;
    case 'watchos_apps':
      return `kind("watchos_application rule", ${queryScope})`;
    case 'watchos_tests':
      return `kind("watchos_unit_test rule", ${queryScope})`;
    case 'watchos_all':
      return `(kind("watchos_application rule", ${queryScope}) union kind("watchos_unit_test rule", ${queryScope}))`;
    case 'visionos_apps':
      return `kind("visionos_application rule", ${queryScope})`;
    case 'visionos_tests':
      return `kind("visionos_unit_test rule", ${queryScope})`;
    case 'visionos_all':
      return `(kind("visionos_application rule", ${queryScope}) union kind("visionos_unit_test rule", ${queryScope}))`;
    default: {
      const _exhaustive: never = kind;
      throw new Error(`Unknown target kind: ${_exhaustive}`);
    }
  }
}

export async function runBazel(
  args: string[],
  timeoutSeconds?: number,
  startupArgs: string[] = [],
): Promise<CommandResult> {
  const config = getConfig();
  assertBazelWorkspace(config.workspacePath);
  const envStartupArgs = process.env.BAZEL_IOS_STARTUP_ARGS
    ? process.env.BAZEL_IOS_STARTUP_ARGS.split(/\s+/).filter(Boolean)
    : [];
  const result = await runCommand(config.bazelPath, [...envStartupArgs, ...startupArgs, ...args], {
    cwd: config.workspacePath,
    timeoutSeconds,
    maxOutput: config.maxOutput,
  });
  lastCommand = result;
  return result;
}

export async function* runBazelStreaming(
  args: string[],
  timeoutSeconds?: number,
  startupArgs: string[] = [],
): AsyncGenerator<StreamChunk | CommandResult> {
  const config = getConfig();
  assertBazelWorkspace(config.workspacePath);
  const envStartupArgs = process.env.BAZEL_IOS_STARTUP_ARGS
    ? process.env.BAZEL_IOS_STARTUP_ARGS.split(/\s+/).filter(Boolean)
    : [];

  let finalResult: CommandResult | undefined;
  for await (const chunk of runCommandStreaming(
    config.bazelPath,
    [...envStartupArgs, ...startupArgs, ...args],
    {
      cwd: config.workspacePath,
      timeoutSeconds,
      maxOutput: config.maxOutput,
    },
  )) {
    if ('stream' in chunk) {
      yield chunk;
    } else {
      finalResult = chunk;
      lastCommand = finalResult;
      yield finalResult;
    }
  }
}

export function buildCommandArgs(args: BuildArgs): string[] {
  const target = requireLabel(args.target);
  const isDevice = args.platform === 'device';
  return [
    'build',
    ...modeArgs(args.buildMode),
    ...platformArgs(args.platform),
    ...(isDevice ? [] : simulatorArgs(args)),
    ...configArgs(args.configs),
    ...asStringArray(args.extraArgs, 'extraArgs'),
    target,
  ];
}
