# Simulator Build + Run + Launch

Status: **Implemented**

## Overview

Three new MCP tools complete the simulator development loop for Bazel iOS apps. After building with Bazel, agents can install and launch the app on a simulator — matching XcodeBuildMCP's `build_run_sim` / `install_app_sim` / `launch_app_sim` workflow.

## Tools

### `bazel_ios_build_and_run`

One-shot tool: builds the target, locates the `.app` bundle in `bazel-bin`, boots a simulator if needed, installs the app, and launches it.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `target` | string | yes | Bazel target label (e.g. `//:MyApp`) |
| `buildMode` | enum | no | `none` / `debug` / `release` / `release_with_symbols` |
| `platform` | enum | no | Forced to `simulator` |
| `simulatorName` | string | no | Simulator device name (e.g. `iPhone 16 Pro`) |
| `simulatorVersion` | string | no | iOS version (e.g. `18.4`) |
| `simulatorId` | string | no | Simulator UDID. Takes precedence over name. |
| `configs` | string[] | no | Extra `--config=` flags |
| `startupArgs` | string[] | no | Bazel startup args |
| `extraArgs` | string[] | no | Extra Bazel build args |
| `launchArgs` | string[] | no | Args passed to the launched app process |
| `launchEnv` | object | no | Env vars injected into the launched app |
| `timeoutSeconds` | number | no | Build timeout (default 1800) |

### `bazel_ios_install_app`

Installs a previously built `.app` bundle onto a simulator.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `appPath` | string | yes | Absolute path to the `.app` bundle |
| `simulatorId` | string | no | Simulator UDID (default: first booted) |
| `simulatorName` | string | no | Simulator name to boot if none booted |

### `bazel_ios_launch_app`

Launches an installed app on a simulator by bundle ID.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `bundleId` | string | yes | App bundle identifier |
| `simulatorId` | string | no | Simulator UDID (default: first booted) |
| `launchArgs` | string[] | no | Args passed to the app process |
| `launchEnv` | object | no | Env vars for the app process |

## CLI Commands

```sh
# Build + install + launch in one step
xcodebazelmcp run //:MyApp --debug --simulator-name "iPhone 16 Pro"

# Install a pre-built .app
xcodebazelmcp install /path/to/MyApp.app

# Launch by bundle ID
xcodebazelmcp launch com.example.MyApp
```

## Implementation Details

### App bundle discovery

After `bazel build`, the `.app` bundle location is resolved via `bazel cquery` with `--output=starlark` to get the output files for the target. The tool looks for `.app` bundles under `bazel-bin/` using the target label path.

Strategy (in order):
1. Run `bazel cquery '<target>' --output=files` to get output paths
2. Scan the output for `.app` bundles
3. If cquery fails, fall back to globbing `bazel-bin/` using the target's package path

### Simulator resolution

1. If `simulatorId` is provided, use it directly
2. If `simulatorName` is provided, find matching device from `simctl list`
3. Otherwise, pick the first booted simulator
4. If no simulator is booted, boot one (prefer `simulatorName` or the first available iPhone)

### Boot behavior

The tool boots a simulator only when no booted simulator is available. It uses `xcrun simctl boot <udid>` and waits for the device to reach `Booted` state.

### Install + Launch

- Install: `xcrun simctl install <udid> <app-path>`
- Launch: `xcrun simctl launch <udid> <bundle-id> [--args ...]`
- The bundle ID is extracted from the app's `Info.plist` using `plutil -convert json`.

### Error handling

Each step reports its command and output. If the build fails, the tool returns the build error without attempting install/launch. If install fails, launch is skipped. The full command chain is visible for debugging.
