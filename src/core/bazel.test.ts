import { describe, expect, it } from 'vitest';
import {
  asStringArray,
  buildCommandArgs,
  configArgs,
  discoverExpression,
  modeArgs,
  platformArgs,
  requireLabel,
  sanitizeQueryExpression,
  simulatorArgs,
} from './bazel.js';
import {
  parseSimpleYaml,
  parseConfigYaml,
  activateProfile,
  setEnabledWorkflows,
  getEnabledWorkflows,
  setWorkspace,
  clearDefaults,
} from '../runtime/config.js';

describe('Bazel argument helpers', () => {
  it('accepts normal Bazel labels and package patterns', () => {
    expect(requireLabel('//:MyApp')).toBe('//:MyApp');
    expect(requireLabel('//Apps/SampleApp/...')).toBe('//Apps/SampleApp/...');
    expect(requireLabel('@some_repo//pkg/subpkg:Target.name')).toBe('@some_repo//pkg/subpkg:Target.name');
    expect(requireLabel('@rules_swift~override//swift:swift')).toBe('@rules_swift~override//swift:swift');
    expect(requireLabel('@@rules_foo//pkg:target')).toBe('@@rules_foo//pkg:target');
    expect(requireLabel('@//pkg:target')).toBe('@//pkg:target');
    expect(requireLabel('//my-pkg:my-target')).toBe('//my-pkg:my-target');
  });

  it('rejects missing or shell-like target values', () => {
    expect(() => requireLabel(undefined)).toThrow('target is required');
    expect(() => requireLabel('//Apps/Foo:Bar; rm -rf /')).toThrow('must be a Bazel label');
    expect(() => requireLabel('Apps/Foo:Bar')).toThrow('must be a Bazel label');
  });

  it('validates string arrays used for Bazel args', () => {
    expect(asStringArray(undefined, 'extraArgs')).toEqual([]);
    expect(asStringArray(['--nobuild'], 'extraArgs')).toEqual(['--nobuild']);
    expect(() => asStringArray(['--nobuild', 1], 'extraArgs')).toThrow(
      'extraArgs must be an array of strings.',
    );
  });

  it('rejects unsafe query expressions', () => {
    expect(sanitizeQueryExpression('kind("ios_unit_test rule", //Apps/SampleApp/...)')).toBe(
      'kind("ios_unit_test rule", //Apps/SampleApp/...)',
    );
    expect(() => sanitizeQueryExpression('')).toThrow('expression is required');
    expect(() => sanitizeQueryExpression('//Apps/...; rm -rf /')).toThrow(
      'shell-like control characters',
    );
  });

  it('builds discovery expressions for apps, tests, and all iOS targets', () => {
    expect(discoverExpression('apps', '//Apps/SampleApp/...')).toBe(
      'kind("ios_application rule", //Apps/SampleApp/...)',
    );
    expect(discoverExpression('tests', '//Apps/SampleApp/...')).toContain('ios_unit_test rule');
    expect(discoverExpression('tests', '//Apps/SampleApp/...')).toContain('ios_ui_test rule');
    expect(discoverExpression('tests', '//Apps/SampleApp/...')).toContain('ios_build_test rule');
    expect(discoverExpression('all')).toContain('//Apps/... union //Packages/...');
  });

  it('builds discovery expressions for macOS targets', () => {
    expect(discoverExpression('macos_apps', '//mac/...')).toBe(
      'kind("macos_application rule", //mac/...)',
    );
    expect(discoverExpression('macos_tests', '//mac/...')).toBe(
      'kind("macos_unit_test rule", //mac/...)',
    );
    expect(discoverExpression('macos_all', '//mac/...')).toContain('macos_application rule');
    expect(discoverExpression('macos_all', '//mac/...')).toContain('macos_unit_test rule');
  });

  it('builds discovery expressions for tvOS targets', () => {
    expect(discoverExpression('tvos_apps', '//tvos/...')).toBe('kind("tvos_application rule", //tvos/...)');
    expect(discoverExpression('tvos_tests', '//tvos/...')).toBe('kind("tvos_unit_test rule", //tvos/...)');
    expect(discoverExpression('tvos_all', '//tvos/...')).toContain('tvos_application rule');
    expect(discoverExpression('tvos_all', '//tvos/...')).toContain('tvos_unit_test rule');
  });

  it('builds discovery expressions for watchOS targets', () => {
    expect(discoverExpression('watchos_apps', '//watch/...')).toBe('kind("watchos_application rule", //watch/...)');
    expect(discoverExpression('watchos_tests', '//watch/...')).toBe('kind("watchos_unit_test rule", //watch/...)');
    expect(discoverExpression('watchos_all', '//watch/...')).toContain('watchos_application rule');
    expect(discoverExpression('watchos_all', '//watch/...')).toContain('watchos_unit_test rule');
  });

  it('builds discovery expressions for visionOS targets', () => {
    expect(discoverExpression('visionos_apps', '//vision/...')).toBe('kind("visionos_application rule", //vision/...)');
    expect(discoverExpression('visionos_tests', '//vision/...')).toBe('kind("visionos_unit_test rule", //vision/...)');
    expect(discoverExpression('visionos_all', '//vision/...')).toContain('visionos_application rule');
    expect(discoverExpression('visionos_all', '//vision/...')).toContain('visionos_unit_test rule');
  });

  it('maps build mode and platform options to Bazel flags', () => {
    expect(modeArgs('none')).toEqual([]);
    expect(modeArgs('debug')).toEqual(['--config=debug']);
    expect(modeArgs('release')).toEqual(['--config=ios_release']);
    expect(modeArgs('release_with_symbols')).toEqual(['--config=ios_release', '--config=generate_dsym']);

    expect(platformArgs('none')).toEqual([]);
    expect(platformArgs('simulator')).toEqual(['--ios_multi_cpus=sim_arm64']);
    expect(platformArgs('device')).toEqual(['--ios_multi_cpus=arm64']);
    expect(platformArgs('macos')).toEqual([]);
    expect(platformArgs('tvos')).toEqual(['--tvos_cpus=sim_arm64']);
    expect(platformArgs('watchos')).toEqual(['--watchos_cpus=arm64']);
    expect(platformArgs('visionos')).toEqual(['--visionos_cpus=sim_arm64']);
  });

  it('maps simulator and config options to Bazel flags', () => {
    expect(
      simulatorArgs({
        simulatorName: 'iPhone 16 Pro',
        simulatorVersion: '18.4',
      }),
    ).toEqual(['--ios_simulator_device=iPhone 16 Pro', '--ios_simulator_version=18.4']);

    expect(configArgs(['test', 'debug.local'])).toEqual(['--config=test', '--config=debug.local']);
    expect(() => configArgs(['bad;config'])).toThrow('Invalid config value');
  });

  it('builds a simulator build command with stable flag ordering', () => {
    expect(
      buildCommandArgs({
        target: '//:MyApp',
        buildMode: 'debug',
        platform: 'simulator',
        simulatorName: 'iPhone 16 Pro',
        configs: ['local'],
        extraArgs: ['--nobuild', '--verbose_failures'],
      }),
    ).toEqual([
      'build',
      '--config=debug',
      '--ios_multi_cpus=sim_arm64',
      '--ios_simulator_device=iPhone 16 Pro',
      '--config=local',
      '--nobuild',
      '--verbose_failures',
      '//:MyApp',
    ]);
  });

  it('excludes simulator flags when platform is device', () => {
    expect(
      buildCommandArgs({
        target: '//:MyApp',
        buildMode: 'release',
        platform: 'device',
        simulatorName: 'iPhone 16 Pro',
        simulatorVersion: '18.0',
      }),
    ).toEqual([
      'build',
      '--config=ios_release',
      '--ios_multi_cpus=arm64',
      '//:MyApp',
    ]);
  });
});

describe('Config file parser', () => {
  it('parses simple key-value YAML', () => {
    const config = parseSimpleYaml(`
workspacePath: /path/to/workspace
bazelPath: /opt/homebrew/bin/bazel
defaultSimulatorName: iPhone 16 Pro
maxOutput: 500000
    `);
    expect(config.workspacePath).toBe('/path/to/workspace');
    expect(config.bazelPath).toBe('/opt/homebrew/bin/bazel');
    expect(config.defaultSimulatorName).toBe('iPhone 16 Pro');
    expect(config.maxOutput).toBe(500000);
  });

  it('ignores comments and blank lines', () => {
    const config = parseSimpleYaml(`
# This is a comment
workspacePath: /path

# Another comment
bazelPath: bazel
    `);
    expect(config.workspacePath).toBe('/path');
    expect(config.bazelPath).toBe('bazel');
  });

  it('handles boolean values', () => {
    const config = parseSimpleYaml(`someFlag: true\nanotherFlag: false`);
    expect((config as Record<string, unknown>).someFlag).toBe(true);
    expect((config as Record<string, unknown>).anotherFlag).toBe(false);
  });

  it('handles decimal number values', () => {
    const config = parseSimpleYaml(`maxOutput: 200000\ntimeout: 1.5`);
    expect(config.maxOutput).toBe(200000);
    expect((config as Record<string, unknown>).timeout).toBe(1.5);
  });

  it('parses named profiles from config', () => {
    const config = parseConfigYaml(`
workspacePath: /path/to/workspace
bazelPath: bazel
profiles:
  mainapp:
    defaultTarget: //Apps/MainApp:MainApp
    defaultSimulatorName: iPhone 16 Pro
    defaultBuildMode: debug
  liteapp:
    defaultTarget: //Apps/LiteApp:LiteApp
    defaultPlatform: simulator
    `);
    expect(config.workspacePath).toBe('/path/to/workspace');
    expect(config.profiles).toBeDefined();
    expect(Object.keys(config.profiles!)).toEqual(['mainapp', 'liteapp']);
    expect(config.profiles!.mainapp.defaultTarget).toBe('//Apps/MainApp:MainApp');
    expect(config.profiles!.mainapp.defaultSimulatorName).toBe('iPhone 16 Pro');
    expect(config.profiles!.mainapp.defaultBuildMode).toBe('debug');
    expect(config.profiles!.liteapp.defaultTarget).toBe('//Apps/LiteApp:LiteApp');
    expect(config.profiles!.liteapp.defaultPlatform).toBe('simulator');
  });

  it('returns empty profiles when none defined', () => {
    const config = parseConfigYaml(`workspacePath: /path`);
    expect(config.profiles).toBeUndefined();
  });

  it('preserves colons inside values', () => {
    const config = parseSimpleYaml(`bazelPath: /usr/local/bin:bazel\nworkspacePath: C:\\Users\\foo`);
    expect(config.bazelPath).toBe('/usr/local/bin:bazel');
  });

  it('parses enabledWorkflows as comma-separated list', () => {
    const config = parseConfigYaml(`enabledWorkflows: build, test, query`);
    expect(config.enabledWorkflows).toEqual(['build', 'test', 'query']);
  });

  it('parses enabledWorkflows single value', () => {
    const config = parseConfigYaml(`enabledWorkflows: build`);
    expect(config.enabledWorkflows).toEqual(['build']);
  });

  it('handles enabledWorkflows with extra commas/spaces', () => {
    const config = parseConfigYaml(`enabledWorkflows: build,,test, , run`);
    expect(config.enabledWorkflows).toEqual(['build', 'test', 'run']);
  });

  it('flushes previous profile when encountering a new indent-0 key', () => {
    const config = parseConfigYaml(`
profiles:
  first:
    defaultTarget: //Apps/First:First
maxOutput: 100000
    `);
    expect(config.profiles).toBeDefined();
    expect(config.profiles!.first.defaultTarget).toBe('//Apps/First:First');
    expect(config.maxOutput).toBe(100000);
  });

  it('parses multiple profiles in sequence correctly', () => {
    const config = parseConfigYaml(`
profiles:
  alpha:
    defaultTarget: //Apps/Alpha:Alpha
    defaultBuildMode: debug
  beta:
    defaultTarget: //Apps/Beta:Beta
    defaultPlatform: device
  gamma:
    defaultTarget: //Apps/Gamma:Gamma
    defaultSimulatorName: iPhone 15
    `);
    expect(Object.keys(config.profiles!)).toEqual(['alpha', 'beta', 'gamma']);
    expect(config.profiles!.alpha.defaultBuildMode).toBe('debug');
    expect(config.profiles!.beta.defaultPlatform).toBe('device');
    expect(config.profiles!.gamma.defaultSimulatorName).toBe('iPhone 15');
  });

  it('parses boolean and numeric values inside profiles', () => {
    const config = parseConfigYaml(`
profiles:
  myapp:
    defaultTarget: //Apps/MyApp:MyApp
    someFlag: true
    anotherFlag: false
    timeout: 30
    `);
    const profile = config.profiles!.myapp as unknown as Record<string, unknown>;
    expect(profile.someFlag).toBe(true);
    expect(profile.anotherFlag).toBe(false);
    expect(profile.timeout).toBe(30);
  });

  it('skips lines with no valid colon separator', () => {
    const config = parseConfigYaml(`
workspacePath: /path
invalidline
: alsoInvalid
bazelPath: bazel
    `);
    expect(config.workspacePath).toBe('/path');
    expect(config.bazelPath).toBe('bazel');
  });

  it('handles empty content', () => {
    const config = parseConfigYaml('');
    expect(config).toEqual({});
  });

  it('handles content with only comments and blank lines', () => {
    const config = parseConfigYaml(`
# just a comment

# another one
    `);
    expect(config).toEqual({});
  });

  it('handles profile with no properties (empty profile)', () => {
    const config = parseConfigYaml(`
profiles:
  emptyprofile:
workspacePath: /path
    `);
    expect(config.profiles).toBeDefined();
    expect(config.profiles!.emptyprofile).toEqual({});
    expect(config.workspacePath).toBe('/path');
  });

  it('handles trailing profile at end of file (no newline flush)', () => {
    const config = parseConfigYaml(`profiles:
  trailing:
    defaultTarget: //Apps/Trailing:Trailing`);
    expect(config.profiles!.trailing.defaultTarget).toBe('//Apps/Trailing:Trailing');
  });

  it('parses key with colon but no space (bare colon)', () => {
    const config = parseConfigYaml(`profiles:\n  myapp:\n    defaultTarget://Foo:Bar`);
    const profile = config.profiles!.myapp as unknown as Record<string, unknown>;
    expect(profile.defaultTarget).toBe('//Foo:Bar');
  });

  it('parseValue handles float values at top-level', () => {
    const config = parseConfigYaml(`ratio: 3.14`);
    expect((config as Record<string, unknown>).ratio).toBe(3.14);
  });

  it('parseValue treats non-numeric strings as strings', () => {
    const config = parseConfigYaml(`name: hello-world`);
    expect((config as Record<string, unknown>).name).toBe('hello-world');
  });
});

describe('activateProfile', () => {
  it('activates a valid profile and merges defaults', () => {
    setWorkspace('/tmp/test-workspace');
    clearDefaults();

    const config = parseConfigYaml(`
profiles:
  myapp:
    defaultTarget: //Apps/MyApp:MyApp
    defaultSimulatorName: iPhone 16 Pro
    defaultBuildMode: debug
    `);
    expect(config.profiles!.myapp.defaultTarget).toBe('//Apps/MyApp:MyApp');
  });

  it('throws on unknown profile name', () => {
    setWorkspace('/tmp/nonexistent-workspace');
    clearDefaults();
    expect(() => activateProfile('nonexistent')).toThrow('Unknown profile "nonexistent"');
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
});
