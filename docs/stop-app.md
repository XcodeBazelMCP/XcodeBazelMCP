# Stop App

Status: **Implemented**

## Overview

Terminates a running app on the simulator. Wraps `xcrun simctl terminate`.

## Tool

### `bazel_ios_stop_app`

Terminate a running app on a simulator.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `bundleId` | string | yes | Bundle identifier of the app to terminate |
| `simulatorId` | string | no | Simulator UDID (default: first booted) |
| `simulatorName` | string | no | Simulator device name |

## CLI

```sh
xcodebazelmcp stop com.example.MyApp
```

## Implementation

Runs `xcrun simctl terminate <udid> <bundleId>`. Returns an error if the app is not currently running ("found nothing to terminate").
