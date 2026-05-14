# Device Support

Status: **Implemented**

## Overview

Physical device support via `xcrun devicectl`. Provides tools for listing connected devices, building and deploying Bazel targets to devices, managing app lifecycle (install, launch, stop) on real hardware, running on-device tests, capturing screenshots and logs, querying device info, and pairing/unpairing devices.

## Tools

### `bazel_ios_list_devices`

List available physical iOS devices.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `onlyConnected` | boolean | no | If true, only return currently connected devices. Default: false. |

### `bazel_ios_device_build_and_run`

Build a Bazel target for device and deploy + launch on a physical device.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `target` | string | yes | Bazel target label (e.g. `//app:app`) |
| `buildMode` | string | no | `debug` or `release` |
| `deviceId` | string | no | Device UDID |
| `deviceName` | string | no | Device name |
| `configs` | string[] | no | Bazel `--config` flags |
| `startupArgs` | string[] | no | Bazel startup args |
| `extraArgs` | string[] | no | Extra `bazel build` args |
| `launchArgs` | string[] | no | Arguments passed to the app at launch |
| `timeoutSeconds` | number | no | Build timeout |

### `bazel_ios_device_install_app`

Install a pre-built `.app` bundle onto a physical device.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `appPath` | string | yes | Path to the `.app` bundle |
| `deviceId` | string | no | Device UDID |
| `deviceName` | string | no | Device name |

### `bazel_ios_device_launch_app`

Launch an installed app on a physical device by bundle ID.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `bundleId` | string | yes | App bundle identifier |
| `deviceId` | string | no | Device UDID |
| `deviceName` | string | no | Device name |
| `launchArgs` | string[] | no | Arguments passed to the app at launch |

### `bazel_ios_device_stop_app`

Terminate a running app on a physical device.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `bundleId` | string | yes | App bundle identifier |
| `deviceId` | string | no | Device UDID |
| `deviceName` | string | no | Device name |

### `bazel_ios_device_test`

Run Bazel iOS tests on a connected physical device.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `target` | string | yes | Bazel test target label |
| `testFilter` | string | no | Test filter expression |
| `deviceId` | string | no | Device UDID |
| `deviceName` | string | no | Device name |
| `configs` | string[] | no | Bazel `--config` flags |
| `startupArgs` | string[] | no | Bazel startup args |
| `extraArgs` | string[] | no | Extra `bazel test` args |
| `timeoutSeconds` | number | no | Test timeout |
| `streaming` | boolean | no | Stream test output incrementally |

### `bazel_ios_device_screenshot`

Take a screenshot of a physical device screen.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `outputPath` | string | yes | Destination file path for the screenshot |
| `deviceId` | string | no | Device UDID |
| `deviceName` | string | no | Device name |

### `bazel_ios_device_log_start`

Start capturing logs from a physical device.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `deviceId` | string | no | Device UDID |
| `deviceName` | string | no | Device name |
| `processName` | string | no | Filter logs to a specific process |

### `bazel_ios_device_log_stop`

Stop a running device log capture.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `captureId` | string | yes | ID of the log capture to stop |

### `bazel_ios_device_info`

Get detailed information about a physical device.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `deviceId` | string | no | Device UDID |
| `deviceName` | string | no | Device name |

### `bazel_ios_device_pair`

Pair with a physical device.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `deviceId` | string | no | Device UDID |
| `deviceName` | string | no | Device name |

### `bazel_ios_device_unpair`

Unpair a physical device.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `deviceId` | string | no | Device UDID |
| `deviceName` | string | no | Device name |

### `bazel_ios_device_list_pairs`

List all paired devices.

_No parameters._

## CLI

```sh
xcodebazelmcp devices
xcodebazelmcp devices --only-connected
xcodebazelmcp device-run //app:app --device-name "iPhone"
xcodebazelmcp device-install --app-path ./build/App.app --device-id <UDID>
xcodebazelmcp device-launch --bundle-id com.example.app --device-name "iPhone"
xcodebazelmcp device-stop --bundle-id com.example.app --device-id <UDID>
xcodebazelmcp device-test //tests:device_tests --filter "TestSuite/testCase" --device-id <UDID> --stream
xcodebazelmcp device-screenshot output.png --device-id <UDID>
xcodebazelmcp device-log-start --device-id <UDID> --process MyApp
xcodebazelmcp device-log-stop <captureId>
xcodebazelmcp device-info --device-id <UDID>
xcodebazelmcp device-pair --device-id <UDID>
xcodebazelmcp device-unpair --device-id <UDID>
xcodebazelmcp device-list-pairs
```

## Implementation

### Core device operations (via `xcrun devicectl`)

- `devicectl list devices --json-output` — enumerate available devices (JSON parsed for UDID, name, OS, connection state)
- `devicectl device install app --device <UDID> <path>` — install app bundle
- `devicectl device process launch --device <UDID> <bundleId>` — launch app
- `devicectl device process terminate --device <UDID> --pid <PID>` — stop app (see "Process termination" below)
- `devicectl device info details --device <UDID>` — get device information
- `devicectl device info apps --device <UDID> --json-output` — list installed apps (used for PID lookup)
- `devicectl device info processes --device <UDID> --json-output` — list running processes
- `devicectl manage pair/unpair --device <UDID>` — pair/unpair device
- `devicectl list devices` — list paired devices

### Screenshots (`screenshotDevice`)

No `devicectl` subcommand exists for screenshots. Fallback chain:

1. **pymobiledevice3** (`developer dvt screenshot <path> --udid <UDID>`) — requires CoreDevice tunnel (`sudo pymobiledevice3 remote tunneld`). Checks both exit code and file existence.
2. **idevicescreenshot** with `-n` (network) flag — works on pre-iOS 17 USB devices.
3. **idevicescreenshot** without network flag — legacy USB fallback.

On iOS 17+, both `idevicescreenshot` paths fail ("Invalid service" / "No device found"). The error includes actionable hints.

### Device logs (`startDeviceLogCapture`)

Mirrors the screenshot strategy — pymobiledevice3 first, idevicesyslog fallback:

1. **pymobiledevice3** (`syslog live --udid <UDID>`) — works on iOS 17+ with or without tunneld (wired devices may work directly). Detects early failures (device not found, no tunneld, stderr errors) within 1.5s and falls through.
2. **idevicesyslog** (`-u <UDID> -n`) — fallback for pre-iOS 17 or when pymobiledevice3 is unavailable.

The response includes which backend was selected. Process filtering is supported via `--process-name` (pymobiledevice3) or `-p` (idevicesyslog). `bazel_ios_device_log_stop` sends SIGINT and returns all captured output.

### Process termination (`terminateAppOnDevice`)

`devicectl device info processes` only returns `executable` (file:// URL) and `processIdentifier` — no `bundleIdentifier`. The two-step lookup:

1. Query installed apps (`device info apps`) to find the executable name matching the bundle ID.
2. Query running processes (`device info processes`) and match by executable path.
3. Terminate by PID: `device process terminate --pid`.

Falls back to matching the last segment of the bundle ID (e.g. `com.example.MyApp` → `MyApp`) against executable names.

### Build & test

- Builds with `--ios_multi_cpus=arm64` (no simulator slice). Simulator-specific flags (`--ios_simulator_device`, `sim_arm64`) are excluded.
- Device tests pass `--test_arg=--destination --test_arg=id=<UDID>` to route to the physical device.

### Device resolution (`resolveDevice`)

- Accepts UDID or device name; errors if neither matches a connected device.
- Unicode normalization handles smart quotes in device names (e.g. `Matheus's iPhone` with U+2019 → ASCII `'`).
- Connection state derived from `tunnelState` or `pairingState` + `visibilityClass` in the devicectl JSON output.
