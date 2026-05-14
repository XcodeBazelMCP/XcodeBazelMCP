# Screenshot

Status: **Implemented**

## Overview

Captures a screenshot of the simulator screen. Wraps `xcrun simctl io <udid> screenshot`.

## Tool

### `bazel_ios_screenshot`

Take a screenshot of a simulator.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `outputPath` | string | yes | File path for the screenshot (e.g. `/tmp/screen.png`) |
| `simulatorId` | string | no | Simulator UDID (default: first booted) |
| `simulatorName` | string | no | Simulator device name |
| `mask` | string | no | Status bar mask: `alpha`, `black`, or `ignored` |

## CLI

```sh
xcodebazelmcp screenshot /tmp/screen.png
xcodebazelmcp screenshot /tmp/screen.png --mask alpha
```

## Implementation

Runs `xcrun simctl io <udid> screenshot <outputPath>`. When `mask` is provided, appends `--mask=<mask>` to control how the status bar and other system UI overlays appear in the captured image.
