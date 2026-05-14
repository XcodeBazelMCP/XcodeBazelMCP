---
name: example-project
description: >-
  Use the BazelApp example project for testing XcodeBazelMCP tools end-to-end.
  Reference when building, running, testing iOS/macOS targets, or validating
  device and simulator workflows against a real Bazel workspace.
---

# BazelApp Example Project

Location: `example_projects/BazelApp/`

## Quick Reference

| Target | Label | Type | Platform |
|--------|-------|------|----------|
| iOS app | `//app:app` | `ios_application` | iPhone + iPad |
| macOS app | `//mac:mac` | `macos_application` | macOS 14+ |
| API tests | `//modules/API:APITests` | `ios_unit_test` | Simulator |
| Models tests | `//modules/Models:ModelsTests` | `ios_unit_test` | Simulator |
| macOS tests | `//mac:MacTests` | `macos_unit_test` | macOS |

## App Identity

Defined in `tools/shared.bzl`:

- **Bundle ID**: `com.example.SwiftUIApp`
- **Bundle Name**: `SwiftUIApp`
- **Minimum iOS**: 18.0
- **macOS Bundle ID**: `com.example.SwiftUIMacApp`
- **Minimum macOS**: 14.0

## XcodeBazelMCP Config

`example_projects/BazelApp/.xcodebazelmcp/config.yaml` defines profiles:

| Profile | Target | Platform | Build Mode |
|---------|--------|----------|------------|
| `app` | `//app:app` | simulator | debug |
| `mac` | `//mac:mac` | macos | debug |
| `models` | `//modules/Models:ModelsLib` | simulator | none |
| `mac-tests` | `//mac:MacTests` | macos | debug |

## Testing Workflows

### Simulator (iOS)

```
bazel_ios_build_and_run  target=//app:app
bazel_ios_test           target=//modules/API:APITests
bazel_ios_test           target=//modules/Models:ModelsTests
```

### Device (physical iPhone/iPad)

```
bazel_ios_device_build_and_run  target=//app:app  deviceName=iPad
bazel_ios_device_test           target=//modules/API:APITests  deviceId=<UDID>
```

Device builds use `--ios_multi_cpus=arm64`. The `families` field in the iOS target includes both `iphone` and `ipad`.

### macOS

```
bazel_macos_build   target=//mac:mac
bazel_macos_test    target=//mac:MacTests
bazel_macos_run     target=//mac:mac
```

## Setting Workspace

Before running any build/test tool, set the workspace:

```
bazel_ios_set_workspace  workspacePath=<absolute_path>/example_projects/BazelApp
```

Or use the CLI:

```bash
xcodebazelmcp mcp --workspace <path>/example_projects/BazelApp
```

## Project Structure

```
BazelApp/
├── app/                          # iOS SwiftUI app
│   ├── source/                   # MainApp.swift, ContentView.swift
│   ├── Assets/                   # App icons, accent color
│   ├── Info.plist
│   ├── ios app.entitlements
│   └── BUILD.bazel               # ios_application + swift_library
├── mac/                          # macOS SwiftUI app
│   ├── source/                   # MacApp.swift, MacContentView.swift
│   ├── Tests/MacTests.swift
│   └── BUILD.bazel               # macos_application + macos_unit_test
├── modules/
│   ├── API/                      # Shared API library + ios_unit_test
│   └── Models/                   # Shared Models library + ios_unit_test
├── tools/
│   ├── shared.bzl                # Bundle IDs, version constants
│   ├── repositories.bzl          # External dependencies
│   └── extensions.bzl            # Bzlmod extensions
├── .xcodebazelmcp/config.yaml    # MCP profiles
├── .bazelrc                      # Build flags, remote cache config
├── .bazelversion                 # Bazel version pin
├── MODULE.bazel                  # Bzlmod deps (rules_apple 4.2.0, rules_swift 3.1.2)
└── BUILD.bazel                   # xcodeproj generator + lint genrule
```

## Dependencies (MODULE.bazel)

- `rules_apple` 4.2.0
- `rules_swift` 3.1.2
- `rules_xcodeproj` 3.2.0
- `apple_support` 1.23.1

## Notes

- `.bazelrc` hardcodes `--ios_simulator_version=18.5` for CI — override with `simulatorVersion` param or `user.bazelrc`.
- Device builds require code signing — for local dev Bazel uses automatic signing. For CI, provisioning profiles must be configured in the build rules.
- The `//app:app` target supports both iPhone and iPad families.
- `xcodeproj` generator target (`:xcodeproj`) creates an Xcode project for IDE integration.
