# Privacy

Status: **Implemented**

## Overview

Manages simulator privacy permissions for apps. Wraps `xcrun simctl privacy` to grant, revoke, or reset access to protected services.

## Tool

### `bazel_ios_privacy`

Grant, revoke, or reset a privacy permission on a simulator.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `action` | string | yes | `grant`, `revoke`, or `reset` |
| `service` | string | yes | Privacy service (e.g. `photos`, `camera`, `microphone`, `location`, `contacts`, `calendars`, `reminders`, `motion`, `health`, `siri`, `speech-recognition`) |
| `bundleId` | string | no | App bundle identifier (required for `grant`/`revoke`, optional for `reset`) |
| `simulatorId` | string | no | Simulator UDID (default: first booted) |
| `simulatorName` | string | no | Simulator device name |

## CLI

```sh
xcodebazelmcp privacy grant photos com.example.MyApp
xcodebazelmcp privacy revoke camera com.example.MyApp
xcodebazelmcp privacy reset location com.example.MyApp
xcodebazelmcp privacy reset all
```

## Implementation

Runs `xcrun simctl privacy <udid> <action> <service> <bundleId>`. The `reset` action can be used with or without a bundle ID — without one, it resets the permission for all apps. Using `all` as the service resets every permission.
