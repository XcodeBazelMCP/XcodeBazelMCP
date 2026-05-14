# Log Capture

Status: **Implemented**

## Overview

Stateful start/stop tools for capturing simulator logs. Start spawns a background `xcrun simctl spawn <udid> log stream` process; stop terminates it and returns the captured output. The CLI variant streams directly to stdout.

## Tools

### `bazel_ios_log_capture_start`

Start capturing logs from a simulator.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `simulatorId` | string | no | Simulator UDID (default: first booted) |
| `simulatorName` | string | no | Simulator device name |
| `processName` | string | no | Filter logs to a specific process |
| `level` | string | no | Log level: `default`, `info`, or `debug` (default: `default`) |

Returns a `captureId` used to stop the capture.

### `bazel_ios_log_capture_stop`

Stop a running log capture and return the collected output.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `captureId` | string | yes | The capture ID returned by `log_capture_start` |

## CLI

```sh
# Streams logs to stdout until Ctrl+C
xcodebazelmcp log-start
xcodebazelmcp log-start --level debug
xcodebazelmcp log-start --process-name MyApp
```

`log-stop` is MCP-only — the CLI streams directly until interrupted.

## Implementation

- Start spawns `xcrun simctl spawn <udid> log stream --level <level>` as a child process, buffering output in memory keyed by a generated capture ID.
- If `processName` is provided, adds `--predicate 'process == "<name>"'` to the log stream command.
- Stop sends SIGTERM to the child process, collects remaining output, and returns the full buffer.
- Capture state is per-server-process; IDs are not valid across restarts.
