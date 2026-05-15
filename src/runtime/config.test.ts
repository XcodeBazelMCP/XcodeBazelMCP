import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  activateProfile,
  clearDefaults,
  getActiveProfile,
  getConfig,
  getDefaults,
  getEnabledWorkflows,
  getProfiles,
  parseConfigYaml,
  setDefaults,
  setEnabledWorkflows,
  setWorkspace,
} from './config.js';

let tempDir: string;
let configDir: string;

beforeEach(() => {
  tempDir = join(tmpdir(), `config-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(tempDir, { recursive: true });
  configDir = join(tempDir, '.xcodebazelmcp');
  mkdirSync(configDir, { recursive: true });
  clearDefaults();
});

afterEach(() => {
  if (existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

describe('parseConfigYaml', () => {
  it('parses workspace and bazel paths', () => {
    const yaml = `
workspacePath: /path/to/workspace
bazelPath: /custom/bazel
    `.trim();
    const config = parseConfigYaml(yaml);
    expect(config.workspacePath).toBe('/path/to/workspace');
    expect(config.bazelPath).toBe('/custom/bazel');
  });

  it('parses defaults', () => {
    const yaml = `
defaultSimulatorName: iPhone 15 Pro
defaultBuildMode: release
defaultTarget: //Apps/MyApp:MyApp
    `.trim();
    const config = parseConfigYaml(yaml);
    expect(config.defaultSimulatorName).toBe('iPhone 15 Pro');
    expect(config.defaultBuildMode).toBe('release');
    expect(config.defaultTarget).toBe('//Apps/MyApp:MyApp');
  });

  it('parses profiles', () => {
    const yaml = `
profiles:
  myapp:
    defaultTarget: //Apps/MyApp:MyApp
    defaultSimulatorName: iPhone 15
  myapp2:
    defaultTarget: //Apps/MyApp2:MyApp2
    `.trim();
    const config = parseConfigYaml(yaml);
    expect(config.profiles).toBeDefined();
    expect(config.profiles!.myapp.defaultTarget).toBe('//Apps/MyApp:MyApp');
    expect(config.profiles!.myapp2.defaultTarget).toBe('//Apps/MyApp2:MyApp2');
  });

  it('parses enabledWorkflows as comma-separated list', () => {
    const yaml = `enabledWorkflows: build,test,simulator`.trim();
    const config = parseConfigYaml(yaml);
    expect(config.enabledWorkflows).toEqual(['build', 'test', 'simulator']);
  });

  it('handles boolean values', () => {
    const yaml = `someFlag: true\notherFlag: false`.trim();
    const config = parseConfigYaml(yaml);
    expect((config as unknown as Record<string, unknown>).someFlag).toBe(true);
    expect((config as unknown as Record<string, unknown>).otherFlag).toBe(false);
  });

  it('handles numeric values', () => {
    const yaml = `maxOutput: 50000\nratio: 3.14`.trim();
    const config = parseConfigYaml(yaml);
    expect((config as unknown as Record<string, unknown>).maxOutput).toBe(50000);
    expect((config as unknown as Record<string, unknown>).ratio).toBe(3.14);
  });
});

describe('getConfig', () => {
  it('returns default config when no config file exists', () => {
    setWorkspace(tempDir);
    const config = getConfig();
    expect(config.workspacePath).toBe(tempDir);
    expect(config.bazelPath).toBe('bazel');
  });

  it('loads config from workspace .xcodebazelmcp directory', () => {
    writeFileSync(
      join(configDir, 'config.yaml'),
      `
workspacePath: /custom/workspace
bazelPath: /custom/bazel
      `.trim(),
    );
    setWorkspace(tempDir);
    const config = getConfig();
    expect(config.workspacePath).toBe('/custom/workspace');
    expect(config.bazelPath).toBe('/custom/bazel');
  });

  it('merges profiles from config file', () => {
    writeFileSync(
      join(configDir, 'config.yaml'),
      `
profiles:
  myapp:
    defaultTarget: //Apps/MyApp:MyApp
      `.trim(),
    );
    setWorkspace(tempDir);
    const config = getConfig();
    expect(config.profiles.myapp).toBeDefined();
    expect(config.profiles.myapp.defaultTarget).toBe('//Apps/MyApp:MyApp');
  });

});

describe('setWorkspace', () => {
  it('updates workspace path and resets config load flag', () => {
    setWorkspace('/first/workspace');
    let config = getConfig();
    expect(config.workspacePath).toBe('/first/workspace');

    setWorkspace('/second/workspace');
    config = getConfig();
    expect(config.workspacePath).toBe('/second/workspace');
  });

  it('can set bazelPath at the same time', () => {
    setWorkspace('/my/workspace', '/custom/bazel');
    const config = getConfig();
    expect(config.workspacePath).toBe('/my/workspace');
    expect(config.bazelPath).toBe('/custom/bazel');
  });
});

describe('setDefaults / getDefaults / clearDefaults', () => {
  it('sets and gets defaults', () => {
    setDefaults({ target: '//:MyApp', simulatorName: 'iPhone 15' });
    const defaults = getDefaults();
    expect(defaults.target).toBe('//:MyApp');
    expect(defaults.simulatorName).toBe('iPhone 15');
  });

  it('merges defaults', () => {
    setDefaults({ target: '//:MyApp' });
    setDefaults({ simulatorName: 'iPhone 15' });
    const defaults = getDefaults();
    expect(defaults.target).toBe('//:MyApp');
    expect(defaults.simulatorName).toBe('iPhone 15');
  });

  it('clears defaults', () => {
    setDefaults({ target: '//:MyApp', simulatorName: 'iPhone 15' });
    clearDefaults();
    const defaults = getDefaults();
    expect(defaults).toEqual({});
  });

  it('clears active profile when clearing defaults', () => {
    writeFileSync(
      join(configDir, 'config.yaml'),
      `
profiles:
  myapp:
    defaultTarget: //Apps/MyApp:MyApp
      `.trim(),
    );
    setWorkspace(tempDir);
    activateProfile('myapp');
    expect(getActiveProfile()).toBe('myapp');

    clearDefaults();
    expect(getActiveProfile()).toBeUndefined();
  });
});

describe('activateProfile', () => {
  beforeEach(() => {
    writeFileSync(
      join(configDir, 'config.yaml'),
      `
profiles:
  myapp:
    defaultTarget: //Apps/MyApp:MyApp
    defaultSimulatorName: iPhone 15
    defaultBuildMode: release
  otherapp:
    defaultTarget: //Apps/OtherApp:OtherApp
      `.trim(),
    );
    setWorkspace(tempDir);
    clearDefaults();
  });

  it('activates a profile and merges into defaults', () => {
    const defaults = activateProfile('myapp');
    expect(defaults.target).toBe('//Apps/MyApp:MyApp');
    expect(defaults.simulatorName).toBe('iPhone 15');
    expect(defaults.buildMode).toBe('release');
  });

  it('sets active profile', () => {
    activateProfile('myapp');
    expect(getActiveProfile()).toBe('myapp');
  });

  it('preserves existing defaults when activating profile', () => {
    setDefaults({ simulatorId: 'ABC-123' });
    activateProfile('myapp');
    const defaults = getDefaults();
    expect(defaults.target).toBe('//Apps/MyApp:MyApp');
    expect(defaults.simulatorId).toBe('ABC-123');
  });

  it('overwrites defaults with profile values', () => {
    setDefaults({ target: '//:OldTarget' });
    activateProfile('myapp');
    const defaults = getDefaults();
    expect(defaults.target).toBe('//Apps/MyApp:MyApp');
  });

  it('throws on unknown profile', () => {
    expect(() => activateProfile('nonexistent')).toThrow('Unknown profile "nonexistent"');
  });

  it('includes available profiles in error message', () => {
    try {
      activateProfile('nonexistent');
    } catch (e) {
      expect((e as Error).message).toContain('myapp');
      expect((e as Error).message).toContain('otherapp');
    }
  });
});

describe('getProfiles', () => {
  it('returns all profiles from config', () => {
    writeFileSync(
      join(configDir, 'config.yaml'),
      `
profiles:
  myapp:
    defaultTarget: //Apps/MyApp:MyApp
  otherapp:
    defaultTarget: //Apps/OtherApp:OtherApp
      `.trim(),
    );
    setWorkspace(tempDir);
    const profiles = getProfiles();
    expect(Object.keys(profiles)).toEqual(['myapp', 'otherapp']);
    expect(profiles.myapp.defaultTarget).toBe('//Apps/MyApp:MyApp');
    expect(profiles.otherapp.defaultTarget).toBe('//Apps/OtherApp:OtherApp');
  });
});

describe('getActiveProfile', () => {
  it('returns undefined when no profile is active', () => {
    setWorkspace(tempDir);
    expect(getActiveProfile()).toBeUndefined();
  });

  it('returns active profile name after activation', () => {
    writeFileSync(
      join(configDir, 'config.yaml'),
      `
profiles:
  myapp:
    defaultTarget: //Apps/MyApp:MyApp
      `.trim(),
    );
    setWorkspace(tempDir);
    activateProfile('myapp');
    expect(getActiveProfile()).toBe('myapp');
  });
});

describe('setEnabledWorkflows / getEnabledWorkflows', () => {
  it('sets and gets enabled workflows', () => {
    setEnabledWorkflows(['build', 'test']);
    expect(getEnabledWorkflows()).toEqual(['build', 'test']);
  });

  it('clears workflows when set to undefined', () => {
    setEnabledWorkflows(['build']);
    setEnabledWorkflows(undefined);
    expect(getEnabledWorkflows()).toBeUndefined();
  });

  it('loads workflows from config file', () => {
    writeFileSync(join(configDir, 'config.yaml'), `enabledWorkflows: build,test,simulator`.trim());
    setWorkspace(tempDir);
    const config = getConfig();
    expect(config.enabledWorkflows).toEqual(['build', 'test', 'simulator']);
  });
});
