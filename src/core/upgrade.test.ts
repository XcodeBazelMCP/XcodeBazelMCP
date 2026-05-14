import { describe, expect, it } from 'vitest';
import { compareVersions, detectInstallMethod, getCurrentVersion, upgradeHint, type InstallMethod } from './upgrade.js';

describe('compareVersions', () => {
  it('returns 0 for equal versions', () => {
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
  });

  it('returns 1 when first is newer', () => {
    expect(compareVersions('2.0.0', '1.0.0')).toBe(1);
    expect(compareVersions('1.1.0', '1.0.0')).toBe(1);
    expect(compareVersions('1.0.1', '1.0.0')).toBe(1);
  });

  it('returns -1 when first is older', () => {
    expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
    expect(compareVersions('0.9.0', '1.0.0')).toBe(-1);
  });

  it('handles different segment counts', () => {
    expect(compareVersions('1.0.0', '1.0')).toBe(0);
    expect(compareVersions('1.0.1', '1.0')).toBe(1);
  });
});

describe('detectInstallMethod', () => {
  it('returns a known install method', () => {
    const method = detectInstallMethod();
    expect(['npm-global', 'npm-local', 'homebrew', 'source', 'unknown']).toContain(method);
  });
});

describe('getCurrentVersion', () => {
  it('returns a semver string', () => {
    const version = getCurrentVersion();
    expect(version).toMatch(/^\d+\.\d+\.\d+/);
  });
});

describe('upgradeHint', () => {
  it('returns npm command for npm-global', () => {
    expect(upgradeHint('npm-global')).toContain('npm install -g');
  });

  it('returns brew command for homebrew', () => {
    expect(upgradeHint('homebrew')).toContain('brew upgrade');
  });

  it('returns git pull for source', () => {
    expect(upgradeHint('source')).toContain('git pull');
  });

  it('returns npm update for npm-local', () => {
    expect(upgradeHint('npm-local')).toContain('npm update');
  });

  it('returns npm install command for unknown method', () => {
    expect(upgradeHint('unknown')).toBe('npm install -g xcodebazelmcp@latest');
  });

  it('falls back to npm install for any unrecognized method', () => {
    expect(upgradeHint('something-else' as unknown as InstallMethod)).toBe('npm install -g xcodebazelmcp@latest');
  });
});

describe('compareVersions – edge cases', () => {
  it('treats empty string segments as 0', () => {
    expect(compareVersions('', '')).toBe(0);
    expect(compareVersions('1', '')).toBe(1);
    expect(compareVersions('', '1')).toBe(-1);
  });

  it('handles single-segment versions', () => {
    expect(compareVersions('3', '2')).toBe(1);
    expect(compareVersions('2', '3')).toBe(-1);
    expect(compareVersions('5', '5')).toBe(0);
  });

  it('compares versions with many segments', () => {
    expect(compareVersions('1.2.3.4', '1.2.3.3')).toBe(1);
    expect(compareVersions('1.2.3.4', '1.2.3.4')).toBe(0);
    expect(compareVersions('1.2.3', '1.2.3.1')).toBe(-1);
  });

  it('handles mismatched segment lengths with trailing zeros', () => {
    expect(compareVersions('1.0.0.0.0', '1')).toBe(0);
    expect(compareVersions('1.0.0.0.1', '1')).toBe(1);
  });
});

describe('detectInstallMethod – value check', () => {
  it('returns one of the valid InstallMethod values', () => {
    const valid = ['npm-global', 'npm-local', 'homebrew', 'source', 'unknown'];
    expect(valid).toContain(detectInstallMethod());
  });

  it('returns the same value on repeated calls', () => {
    const first = detectInstallMethod();
    const second = detectInstallMethod();
    expect(first).toBe(second);
  });
});
