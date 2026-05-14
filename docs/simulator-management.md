# Simulator Management

Status: **Implemented**

## Overview

Six new MCP tools for managing iOS simulator lifecycle and environment, wrapping `xcrun simctl` commands. Matches XcodeBuildMCP's `simulator-management` workflow.

## Tools

### `bazel_ios_boot_simulator`

Boot a simulator device.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `simulatorId` | string | no | Simulator UDID |
| `simulatorName` | string | no | Simulator device name |

### `bazel_ios_shutdown_simulator`

Shutdown a running simulator.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `simulatorId` | string | no | Simulator UDID (default: first booted) |
| `all` | boolean | no | Shutdown all booted simulators |

### `bazel_ios_erase_simulator`

Erase all content and settings from a simulator, restoring it to factory state.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `simulatorId` | string | yes | Simulator UDID |

### `bazel_ios_set_simulator_location`

Set the simulated GPS location on a simulator.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `simulatorId` | string | no | Simulator UDID (default: first booted) |
| `latitude` | number | yes | GPS latitude |
| `longitude` | number | yes | GPS longitude |

### `bazel_ios_set_simulator_appearance`

Set the simulator appearance (light/dark mode).

| Parameter | Type | Required | Description |
|---|---|---|---|
| `simulatorId` | string | no | Simulator UDID (default: first booted) |
| `appearance` | string | yes | `light` or `dark` |

### `bazel_ios_open_simulator`

Open Simulator.app and optionally bring a specific device to the foreground.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `simulatorId` | string | no | Simulator UDID to focus |

## CLI Commands

```sh
xcodebazelmcp sim-boot --simulator-name "iPhone 17 Pro"
xcodebazelmcp sim-shutdown --simulator-id <UDID>
xcodebazelmcp sim-shutdown --all
xcodebazelmcp sim-erase --simulator-id <UDID>
xcodebazelmcp sim-location --latitude 37.7749 --longitude -122.4194
xcodebazelmcp sim-appearance --appearance dark
xcodebazelmcp sim-open
```

## Implementation Details

All tools wrap `xcrun simctl` subcommands:
- `boot <udid>` / `shutdown <udid>` / `shutdown all`
- `erase <udid>`
- `location <udid> set <lat>,<lng>`
- `ui <udid> appearance <light|dark>`
- `open` opens Simulator.app, optionally with `--udid`

Simulator resolution reuses the existing `resolveSimulator` function — accepts UDID or name, auto-picks first booted if neither provided.
