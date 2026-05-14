import { spawn } from 'node:child_process';
import { resolveSimulator, type SimulatorDevice } from '../core/simulators.js';
import { getDefaults } from '../runtime/config.js';
import type { JsonObject, ToolCallResult, ToolDefinition } from '../types/index.js';

export const logCaptures = new Map<string, { child: ReturnType<typeof spawn>; output: string; simulatorId: string }>();
export let logCaptureCounter = 0;
export function nextLogCaptureId(): number { return ++logCaptureCounter; }

export const videoRecordings = new Map<string, { child: ReturnType<typeof spawn>; outputPath: string; simulatorId: string }>();
export let videoRecordingCounter = 0;
export function nextVideoRecordingId(): number { return ++videoRecordingCounter; }

export const deviceLogCaptures = new Map<string, { child: ReturnType<typeof spawn>; getCaptured: () => string; tool?: string }>();

export function applyDefaults(args: JsonObject): JsonObject {
  const defaults = getDefaults();
  if (!defaults || Object.keys(defaults).length === 0) return args;
  const merged = { ...args };
  if (defaults.target && merged.target === undefined) merged.target = defaults.target;
  if (defaults.simulatorName && merged.simulatorName === undefined) merged.simulatorName = defaults.simulatorName;
  if (defaults.simulatorId && merged.simulatorId === undefined) merged.simulatorId = defaults.simulatorId;
  if (defaults.buildMode && defaults.buildMode !== 'none' && merged.buildMode === undefined) merged.buildMode = defaults.buildMode;
  if (defaults.platform && defaults.platform !== 'none' && merged.platform === undefined) merged.platform = defaults.platform;
  return merged;
}

export async function resolveSimulatorFromArgs(args: JsonObject): Promise<{ sim: SimulatorDevice; warning?: string }> {
  const { device, warning } = await resolveSimulator({
    simulatorId: stringOrUndefined(args.simulatorId),
    simulatorName: stringOrUndefined(args.simulatorName),
  });
  return { sim: device, warning };
}

export function prependWarning(message: string, warning?: string): string {
  return warning ? `${warning}\n\n${message}` : message;
}

export function stringOrUndefined(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export function numberOrUndefined(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

export type ToolHandler = (name: string, args: JsonObject) => Promise<ToolCallResult> | ToolCallResult | undefined;

export interface HandlerModule {
  definitions: ToolDefinition[];
  handle: ToolHandler;
}
