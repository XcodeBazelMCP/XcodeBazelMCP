# Push Notification

Status: **Implemented**

## Overview

Sends a simulated push notification to an app on the simulator. Wraps `xcrun simctl push` with support for inline payload parameters or a pre-built payload file.

## Tool

### `bazel_ios_push_notification`

Send a push notification to a simulator.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `bundleId` | string | yes | Target app bundle identifier |
| `title` | string | no | Notification title |
| `body` | string | no | Notification body text |
| `badge` | number | no | Badge count |
| `sound` | string | no | Sound name (e.g. `default`) |
| `payloadPath` | string | no | Path to an APNS JSON payload file (overrides inline params) |
| `simulatorId` | string | no | Simulator UDID (default: first booted) |
| `simulatorName` | string | no | Simulator device name |

## CLI

```sh
xcodebazelmcp push com.example.MyApp --title "Hello" --body "World"
xcodebazelmcp push com.example.MyApp --title "Alert" --badge 3 --sound default
xcodebazelmcp push com.example.MyApp --payload /path/to/payload.json
```

## Implementation

- If `payloadPath` is provided, passes it directly to `xcrun simctl push <udid> <bundleId> <payloadPath>`.
- Otherwise, constructs a temporary APNS JSON payload from the inline parameters (`title`, `body`, `badge`, `sound`), writes it to a temp file, and passes that to `simctl push`.
- The temporary file is cleaned up after the push completes.
