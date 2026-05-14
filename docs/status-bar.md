# Status Bar

Status: **Implemented**

## Overview

Overrides the simulator status bar appearance for consistent screenshots and recordings. Wraps `xcrun simctl status_bar <udid> override`.

## Tool

### `bazel_ios_set_status_bar`

Override status bar values on a simulator.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `simulatorId` | string | no | Simulator UDID (default: first booted) |
| `simulatorName` | string | no | Simulator device name |
| `time` | string | no | Time string (e.g. `"9:41"`) |
| `dataNetwork` | string | no | Data network type (e.g. `wifi`, `3g`, `4g`, `lte`, `lte-a`, `lte+`, `5g`, `5g+`, `5g-uwb`) |
| `wifiMode` | string | no | Wi-Fi mode: `searching`, `failed`, or `active` |
| `wifiBars` | number | no | Wi-Fi signal bars (0–3) |
| `cellularMode` | string | no | Cellular mode: `notSupported`, `searching`, `failed`, or `active` |
| `cellularBars` | number | no | Cellular signal bars (0–4) |
| `operatorName` | string | no | Carrier name |
| `batteryState` | string | no | Battery state: `charging`, `charged`, or `discharging` |
| `batteryLevel` | number | no | Battery percentage (0–100) |
| `clear` | boolean | no | If true, clears all status bar overrides instead of setting them |

## CLI

```sh
xcodebazelmcp status-bar --time "9:41" --battery-level 100
xcodebazelmcp status-bar --time "9:41" --battery-level 100 --battery-state charged --operator-name "Carrier"
xcodebazelmcp status-bar --clear
```

## Implementation

- When `clear` is true, runs `xcrun simctl status_bar <udid> clear`.
- Otherwise, builds `xcrun simctl status_bar <udid> override` with flags for each provided parameter (e.g. `--time "9:41"`, `--batteryLevel 100`).
- Only provided parameters are included — omitted fields keep their current values.
