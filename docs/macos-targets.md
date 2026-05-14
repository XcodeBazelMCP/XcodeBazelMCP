# macOS Targets

Status: **Implemented**

## Overview

MCP tools for building, running, testing, discovering, and managing macOS Bazel targets. Mirrors the iOS tool surface but targets the host platform — no extra CPU flags needed since Bazel builds for the host architecture by default. Also includes utilities for coverage, app lifecycle (launch, stop, install), log streaming, and screenshots.

## Tools

### `bazel_macos_build`

Build a macOS Bazel target.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `target` | string | yes | Bazel target label |
| `buildMode` | string | no | `debug` or `release` |
| `configs` | string[] | no | Bazel `--config` flags |
| `startupArgs` | string[] | no | Bazel startup args |
| `extraArgs` | string[] | no | Extra `bazel build` args |
| `timeoutSeconds` | number | no | Build timeout |
| `streaming` | boolean | no | Stream build output incrementally |

### `bazel_macos_run`

Build and run a macOS Bazel target.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `target` | string | yes | Bazel target label |
| `buildMode` | string | no | `debug` or `release` |
| `configs` | string[] | no | Bazel `--config` flags |
| `startupArgs` | string[] | no | Bazel startup args |
| `extraArgs` | string[] | no | Extra `bazel build` args |
| `runArgs` | string[] | no | Arguments passed to the executable |
| `timeoutSeconds` | number | no | Run timeout |
| `streaming` | boolean | no | Stream output incrementally |

### `bazel_macos_test`

Run tests for a macOS Bazel target.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `target` | string | yes | Bazel test target label |
| `testFilter` | string | no | Test filter expression |
| `configs` | string[] | no | Bazel `--config` flags |
| `startupArgs` | string[] | no | Bazel startup args |
| `extraArgs` | string[] | no | Extra `bazel test` args |
| `timeoutSeconds` | number | no | Test timeout |
| `streaming` | boolean | no | Stream test output incrementally |

### `bazel_macos_discover_targets`

Discover macOS targets in the workspace.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `scope` | string | no | Bazel package pattern (default: `//...`) |
| `kind` | string | no | `macos_apps`, `macos_tests`, or `macos_all` (default: `macos_all`) |
| `extraArgs` | string[] | no | Extra query args |
| `startupArgs` | string[] | no | Bazel startup args |

### `bazel_macos_coverage`

Run macOS tests with code coverage collection.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `target` | string | yes | Bazel test target label |
| `testFilter` | string | no | Test filter expression |
| `configs` | string[] | no | Bazel `--config` flags |
| `startupArgs` | string[] | no | Bazel startup args |
| `extraArgs` | string[] | no | Extra `bazel coverage` args |
| `timeoutSeconds` | number | no | Test timeout |

### `bazel_macos_clean`

Clean Bazel macOS build outputs.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `expunge` | boolean | no | If true, run `bazel clean --expunge` |
| `startupArgs` | string[] | no | Bazel startup args |

### `bazel_macos_launch`

Launch a macOS application.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `appPath` | string | no | Path to the `.app` bundle |
| `target` | string | no | Bazel target label (used to locate `.app` in `bazel-bin`) |
| `launchArgs` | string[] | no | Arguments passed to the app at launch |
| `launchEnv` | Record<string, string> | no | Environment variables for the launched app |

### `bazel_macos_stop`

Terminate a running macOS application.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `bundleId` | string | no | App bundle identifier |
| `processName` | string | no | Process name to terminate |

### `bazel_macos_install`

Copy a macOS `.app` bundle to a destination directory.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `appPath` | string | no | Path to the `.app` bundle |
| `target` | string | no | Bazel target label (used to locate `.app` in `bazel-bin`) |
| `destination` | string | no | Destination directory (default: `/Applications`) |

### `bazel_macos_app_path`

Find the `.app` output path in `bazel-bin` for a macOS target.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `target` | string | yes | Bazel target label |

### `bazel_macos_bundle_id`

Read `CFBundleIdentifier` from a macOS app's `Info.plist`.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `appPath` | string | yes | Path to the `.app` bundle |

### `bazel_macos_log`

Stream macOS system logs.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `processName` | string | no | Filter logs to a specific process |
| `level` | string | no | Log level: `default`, `info`, or `debug` |
| `timeoutSeconds` | number | no | Duration to capture logs |

### `bazel_macos_screenshot`

Take a screenshot of the macOS screen.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `outputPath` | string | yes | Destination file path for the screenshot |
| `windowOnly` | boolean | no | If true, capture only the frontmost window |

## CLI

```sh
xcodebazelmcp macos-build //app:macapp
xcodebazelmcp macos-run //app:macapp --stream
xcodebazelmcp macos-test //tests:mac_tests --test-filter "TestSuite/testCase"
xcodebazelmcp macos-discover
xcodebazelmcp macos-discover --kind macos_apps
xcodebazelmcp macos-coverage //tests:mac_tests --filter "TestSuite/testCase"
xcodebazelmcp macos-clean --expunge
xcodebazelmcp macos-launch //app:macapp --launch-arg --verbose
xcodebazelmcp macos-stop com.example.macapp --process MacApp
xcodebazelmcp macos-install //app:macapp --destination /Applications
xcodebazelmcp macos-app-path //app:macapp
xcodebazelmcp macos-bundle-id ./bazel-bin/app/MacApp.app
xcodebazelmcp macos-log --process MacApp --level debug --timeout 30
xcodebazelmcp macos-screenshot output.png --window
```

## Implementation

- Platform flag: none required — Bazel uses the host architecture by default.
- Discovery queries `rules_apple` rule kinds: `macos_application` (for apps) and `macos_unit_test` (for tests) via `bazel query "kind(...)"`.
- Streaming support uses the same `runBazelStreaming` / `callBazelToolStreaming` infrastructure as the iOS tools.
- `bazel_macos_clean` behaves the same as `bazel_ios_clean`.
- `bazel_macos_launch` uses `open <appPath>` to launch the application.
- `bazel_macos_stop` uses `pkill -f` to terminate the process.
- `bazel_macos_install` uses `cp -R` to copy the `.app` bundle to the destination.
- `bazel_macos_log` uses `log stream --style compact` filtered by process and level.
- `bazel_macos_screenshot` uses `screencapture -o <path>` (with `-w` for window-only mode).
