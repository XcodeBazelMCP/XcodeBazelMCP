import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { findAppBundle, readBundleId } from './simulators.js';

const fixtureDir = join(import.meta.dirname, '..', '..', '.test-fixtures');
const fakeWorkspace = join(fixtureDir, 'workspace');
const bazelBin = join(fakeWorkspace, 'bazel-bin');

beforeAll(() => {
  mkdirSync(join(bazelBin, 'BazelApp.app'), { recursive: true });
  writeFileSync(
    join(bazelBin, 'BazelApp.app', 'Info.plist'),
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleIdentifier</key>
  <string>com.example.BazelApp</string>
</dict>
</plist>`,
  );

  mkdirSync(join(bazelBin, 'Apps', 'MyApp', 'MyApp.app'), { recursive: true });
  writeFileSync(
    join(bazelBin, 'Apps', 'MyApp', 'MyApp.app', 'Info.plist'),
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleIdentifier</key>
  <string>com.example.MyApp</string>
</dict>
</plist>`,
  );

  // rules_apple archive layout: <target>_archive-root/Payload/<BundleName>.app
  mkdirSync(join(bazelBin, 'app', 'app_archive-root', 'Payload', 'SwiftUIApp.app'), { recursive: true });
  writeFileSync(
    join(bazelBin, 'app', 'app_archive-root', 'Payload', 'SwiftUIApp.app', 'Info.plist'),
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleIdentifier</key>
  <string>com.example.SwiftUIApp</string>
</dict>
</plist>`,
  );
});

afterAll(() => {
  if (existsSync(fixtureDir)) {
    rmSync(fixtureDir, { recursive: true, force: true });
  }
});

describe('findAppBundle', () => {
  it('finds an app at the root of bazel-bin for //:Target', () => {
    const result = findAppBundle(fakeWorkspace, '//:BazelApp');
    expect(result).toBe(join(bazelBin, 'BazelApp.app'));
  });

  it('finds an app in a package subdirectory for //Apps/MyApp:MyApp', () => {
    const result = findAppBundle(fakeWorkspace, '//Apps/MyApp:MyApp');
    expect(result).toBe(join(bazelBin, 'Apps', 'MyApp', 'MyApp.app'));
  });

  it('returns null for a target with no .app output', () => {
    const result = findAppBundle(fakeWorkspace, '//:NonExistent');
    expect(result).toBeNull();
  });

  it('returns null when bazel-bin does not exist', () => {
    const result = findAppBundle('/tmp/no-such-workspace', '//:Anything');
    expect(result).toBeNull();
  });

  it('returns null for malformed labels', () => {
    const result = findAppBundle(fakeWorkspace, 'not-a-label');
    expect(result).toBeNull();
  });

  it('finds an app inside _archive-root/Payload/ (rules_apple layout)', () => {
    const result = findAppBundle(fakeWorkspace, '//app:app');
    expect(result).toBe(join(bazelBin, 'app', 'app_archive-root', 'Payload', 'SwiftUIApp.app'));
  });
});

describe('readBundleId', () => {
  it('reads CFBundleIdentifier from an Info.plist', () => {
    const appPath = join(bazelBin, 'BazelApp.app');
    expect(readBundleId(appPath)).toBe('com.example.BazelApp');
  });

  it('reads bundle ID from a nested package app', () => {
    const appPath = join(bazelBin, 'Apps', 'MyApp', 'MyApp.app');
    expect(readBundleId(appPath)).toBe('com.example.MyApp');
  });

  it('throws when Info.plist is missing', () => {
    expect(() => readBundleId('/tmp/no-such-app.app')).toThrow('Info.plist not found');
  });
});
