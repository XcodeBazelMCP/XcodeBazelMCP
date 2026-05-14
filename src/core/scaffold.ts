import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export type ScaffoldTemplate =
  | 'ios_app'
  | 'ios_test'
  | 'ios_app_with_tests'
  | 'macos_app'
  | 'macos_test'
  | 'macos_app_with_tests';

export interface ScaffoldOptions {
  outputPath: string;
  name: string;
  template: ScaffoldTemplate;
  bundleId?: string;
  minimumOs?: string;
  rulesVersion?: string;
}

export interface ScaffoldResult {
  filesCreated: string[];
  outputPath: string;
  template: ScaffoldTemplate;
}

export function getAvailableTemplates(): Array<{ id: ScaffoldTemplate; description: string }> {
  return [
    { id: 'ios_app', description: 'Minimal Bazel iOS application (SwiftUI)' },
    { id: 'ios_test', description: 'Bazel iOS unit test target' },
    { id: 'ios_app_with_tests', description: 'Bazel iOS application with unit test target' },
    { id: 'macos_app', description: 'Minimal Bazel macOS application (SwiftUI)' },
    { id: 'macos_test', description: 'Bazel macOS unit test target' },
    { id: 'macos_app_with_tests', description: 'Bazel macOS application with unit test target' },
  ];
}

export function scaffold(options: ScaffoldOptions): ScaffoldResult {
  const { outputPath, name, template } = options;

  if (!name || !/^[A-Za-z][A-Za-z0-9_-]*$/.test(name)) {
    throw new Error(`Invalid project name "${name}". Use alphanumeric characters, hyphens, and underscores only.`);
  }

  const bundleId = options.bundleId || `com.example.${name}`;
  const minimumOs = options.minimumOs || (template.startsWith('macos') ? '14.0' : '17.0');

  if (existsSync(join(outputPath, 'MODULE.bazel')) || existsSync(join(outputPath, 'WORKSPACE'))) {
    throw new Error(`A Bazel workspace already exists in ${outputPath}. Aborting to avoid overwriting.`);
  }

  const filesCreated: string[] = [];
  const write = (relPath: string, content: string) => {
    const fullPath = join(outputPath, relPath);
    const dir = join(outputPath, relPath.split('/').slice(0, -1).join('/'));
    if (dir !== outputPath && !existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(fullPath, content);
    filesCreated.push(relPath);
  };

  if (!existsSync(outputPath)) {
    mkdirSync(outputPath, { recursive: true });
  }

  const rulesAppleVersion = options.rulesVersion || '3.16.1';

  write('MODULE.bazel', moduleBazel(name, rulesAppleVersion));
  write('.bazelrc', bazelrc(template));
  write('.bazelversion', '7.6.1\n');
  write('.gitignore', bazelGitignore());

  switch (template) {
    case 'ios_app':
      writeIosApp(write, name, bundleId, minimumOs);
      break;
    case 'ios_test':
      writeIosTest(write, name, minimumOs);
      break;
    case 'ios_app_with_tests':
      writeIosApp(write, name, bundleId, minimumOs);
      writeIosAppTest(write, name, minimumOs);
      break;
    case 'macos_app':
      writeMacosApp(write, name, bundleId, minimumOs);
      break;
    case 'macos_test':
      writeMacosTest(write, name, minimumOs);
      break;
    case 'macos_app_with_tests':
      writeMacosApp(write, name, bundleId, minimumOs);
      writeMacosAppTest(write, name, minimumOs);
      break;
  }

  write('.xcodebazelmcp/config.yaml', `workspacePath: .\nbazelPath: bazel\n`);

  return { filesCreated, outputPath, template };
}

function moduleBazel(name: string, rulesAppleVersion: string): string {
  const needsAppleRules = true;
  const lines = [
    `module(name = "${name.toLowerCase()}", version = "0.0.1")`,
    '',
  ];

  if (needsAppleRules) {
    lines.push(
      `bazel_dep(name = "rules_apple", version = "${rulesAppleVersion}")`,
      `bazel_dep(name = "rules_swift", version = "2.6.0")`,
      `bazel_dep(name = "apple_support", version = "1.21.1")`,
      '',
    );
  }

  return lines.join('\n');
}

function bazelrc(template: ScaffoldTemplate): string {
  const lines = [
    '# Common settings',
    'common --enable_bzlmod',
    '',
    '# Build settings',
    'build --verbose_failures',
    '',
  ];

  if (template.startsWith('ios')) {
    lines.push(
      '# iOS simulator settings',
      'build:sim --ios_multi_cpus=sim_arm64',
      '',
      '# iOS device settings',
      'build:device --ios_multi_cpus=arm64',
      '',
    );
  }

  lines.push(
    '# Debug / Release configs',
    'build:debug --compilation_mode=dbg',
    'build:release --compilation_mode=opt --strip=always',
    '',
  );

  return lines.join('\n');
}

function bazelGitignore(): string {
  return [
    '/bazel-*',
    '/.build',
    '*.xcodeproj',
    '*.xcworkspace',
    '.DS_Store',
    '',
  ].join('\n');
}

type WriteFunc = (relPath: string, content: string) => void;

function writeIosApp(write: WriteFunc, name: string, bundleId: string, minimumOs: string): void {
  write(`${name}/BUILD.bazel`, `load("@rules_apple//apple:ios.bzl", "ios_application")
load("@rules_swift//swift:swift.bzl", "swift_library")

swift_library(
    name = "${name}Lib",
    srcs = glob(["Sources/**/*.swift"]),
    module_name = "${name}",
    visibility = ["//visibility:public"],
)

ios_application(
    name = "${name}",
    bundle_id = "${bundleId}",
    families = ["iphone", "ipad"],
    infoplists = ["Info.plist"],
    minimum_os_version = "${minimumOs}",
    deps = [":${name}Lib"],
)
`);

  write(`${name}/Info.plist`, infoPlist(name, bundleId));

  write(`${name}/Sources/${name}App.swift`, `import SwiftUI

@main
struct ${name}App: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
`);

  write(`${name}/Sources/ContentView.swift`, `import SwiftUI

struct ContentView: View {
    var body: some View {
        VStack {
            Image(systemName: "globe")
                .imageScale(.large)
                .foregroundStyle(.tint)
            Text("Hello, world!")
        }
        .padding()
    }
}
`);
}

function writeIosTest(write: WriteFunc, name: string, minimumOs: string): void {
  const testName = `${name}Tests`;
  write(`${testName}/BUILD.bazel`, `load("@rules_apple//apple:ios.bzl", "ios_unit_test")
load("@rules_swift//swift:swift.bzl", "swift_library")

swift_library(
    name = "${testName}Lib",
    testonly = True,
    srcs = glob(["Sources/**/*.swift"]),
    module_name = "${testName}",
)

ios_unit_test(
    name = "${testName}",
    minimum_os_version = "${minimumOs}",
    deps = [":${testName}Lib"],
)
`);

  write(`${testName}/Sources/${testName}.swift`, `import XCTest

final class ${testName}: XCTestCase {
    func testExample() {
        XCTAssertTrue(true, "Example test passes")
    }
}
`);
}

function writeIosAppTest(write: WriteFunc, name: string, minimumOs: string): void {
  const testName = `${name}Tests`;
  write(`${testName}/BUILD.bazel`, `load("@rules_apple//apple:ios.bzl", "ios_unit_test")
load("@rules_swift//swift:swift.bzl", "swift_library")

swift_library(
    name = "${testName}Lib",
    testonly = True,
    srcs = glob(["Sources/**/*.swift"]),
    module_name = "${testName}",
    deps = ["//${name}:${name}Lib"],
)

ios_unit_test(
    name = "${testName}",
    minimum_os_version = "${minimumOs}",
    test_host = "//${name}:${name}",
    deps = [":${testName}Lib"],
)
`);

  write(`${testName}/Sources/${testName}.swift`, `import XCTest
@testable import ${name}

final class ${testName}: XCTestCase {
    func testContentViewExists() {
        let view = ContentView()
        XCTAssertNotNil(view)
    }
}
`);
}

function writeMacosApp(write: WriteFunc, name: string, bundleId: string, minimumOs: string): void {
  write(`${name}/BUILD.bazel`, `load("@rules_apple//apple:macos.bzl", "macos_application")
load("@rules_swift//swift:swift.bzl", "swift_library")

swift_library(
    name = "${name}Lib",
    srcs = glob(["Sources/**/*.swift"]),
    module_name = "${name}",
    visibility = ["//visibility:public"],
)

macos_application(
    name = "${name}",
    bundle_id = "${bundleId}",
    infoplists = ["Info.plist"],
    minimum_os_version = "${minimumOs}",
    deps = [":${name}Lib"],
)
`);

  write(`${name}/Info.plist`, infoPlist(name, bundleId));

  write(`${name}/Sources/${name}App.swift`, `import SwiftUI

@main
struct ${name}App: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
`);

  write(`${name}/Sources/ContentView.swift`, `import SwiftUI

struct ContentView: View {
    var body: some View {
        VStack {
            Image(systemName: "globe")
                .imageScale(.large)
                .foregroundStyle(.tint)
            Text("Hello, world!")
        }
        .padding()
    }
}
`);
}

function writeMacosTest(write: WriteFunc, name: string, minimumOs: string): void {
  const testName = `${name}Tests`;
  write(`${testName}/BUILD.bazel`, `load("@rules_apple//apple:macos.bzl", "macos_unit_test")
load("@rules_swift//swift:swift.bzl", "swift_library")

swift_library(
    name = "${testName}Lib",
    testonly = True,
    srcs = glob(["Sources/**/*.swift"]),
    module_name = "${testName}",
)

macos_unit_test(
    name = "${testName}",
    minimum_os_version = "${minimumOs}",
    deps = [":${testName}Lib"],
)
`);

  write(`${testName}/Sources/${testName}.swift`, `import XCTest

final class ${testName}: XCTestCase {
    func testExample() {
        XCTAssertTrue(true, "Example test passes")
    }
}
`);
}

function writeMacosAppTest(write: WriteFunc, name: string, minimumOs: string): void {
  const testName = `${name}Tests`;
  write(`${testName}/BUILD.bazel`, `load("@rules_apple//apple:macos.bzl", "macos_unit_test")
load("@rules_swift//swift:swift.bzl", "swift_library")

swift_library(
    name = "${testName}Lib",
    testonly = True,
    srcs = glob(["Sources/**/*.swift"]),
    module_name = "${testName}",
    deps = ["//${name}:${name}Lib"],
)

macos_unit_test(
    name = "${testName}",
    minimum_os_version = "${minimumOs}",
    test_host = "//${name}:${name}",
    deps = [":${testName}Lib"],
)
`);

  write(`${testName}/Sources/${testName}.swift`, `import XCTest
@testable import ${name}

final class ${testName}: XCTestCase {
    func testContentViewExists() {
        let view = ContentView()
        XCTAssertNotNil(view)
    }
}
`);
}

function infoPlist(name: string, bundleId: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key>
    <string>${name}</string>
    <key>CFBundleIdentifier</key>
    <string>${bundleId}</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
</dict>
</plist>
`;
}
