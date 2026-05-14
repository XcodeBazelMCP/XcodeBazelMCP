# Open URL

Status: **Implemented**

## Overview

Opens a URL on a simulator, triggering the registered URL handler (Safari for `http`/`https`, or a custom scheme handler). Wraps `xcrun simctl openurl`.

## Tool

### `bazel_ios_open_url`

Open a URL on a simulator.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `url` | string | yes | URL to open (e.g. `https://apple.com` or `myapp://path`) |
| `simulatorId` | string | no | Simulator UDID (default: first booted) |
| `simulatorName` | string | no | Simulator device name |

## CLI

```sh
xcodebazelmcp open-url https://apple.com
xcodebazelmcp open-url "myapp://deeplink/path"
```

## Implementation

Runs `xcrun simctl openurl <udid> <url>`. Works with any URL scheme registered on the simulator — standard `http`/`https` opens Safari, custom schemes open the registered app.
