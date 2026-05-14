# UI Automation

Status: **Implemented**

## Overview

Nine MCP tools for automating UI interactions on iOS simulators using `xcrun simctl io`. Supports taps, swipes, text input, key presses, drag gestures, and accessibility tree inspection.

## Tools

### `bazel_ios_tap`

Tap at a screen coordinate.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `x` | number | yes | X coordinate |
| `y` | number | yes | Y coordinate |
| `simulatorId` | string | no | Simulator UDID |
| `simulatorName` | string | no | Simulator device name |

### `bazel_ios_double_tap`

Double-tap at a screen coordinate.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `x` | number | yes | X coordinate |
| `y` | number | yes | Y coordinate |

### `bazel_ios_long_press`

Long-press at a screen coordinate.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `x` | number | yes | X coordinate |
| `y` | number | yes | Y coordinate |
| `durationSeconds` | number | no | Press duration (default: 1.0) |

### `bazel_ios_swipe`

Swipe gesture in a direction.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `direction` | string | yes | `up`, `down`, `left`, or `right` |
| `x` | number | no | Starting X coordinate |
| `y` | number | no | Starting Y coordinate |
| `distance` | number | no | Swipe distance in points (default: 300) |
| `velocity` | number | no | Swipe velocity in points/sec (default: 1500) |

### `bazel_ios_pinch`

Pinch gesture for zoom in/out.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `x` | number | no | Center X coordinate |
| `y` | number | no | Center Y coordinate |
| `scale` | number | yes | Scale factor: >1 zooms in, <1 zooms out |
| `velocity` | number | no | Pinch velocity |

### `bazel_ios_type_text`

Type text into the focused input field.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `text` | string | yes | Text to type |

### `bazel_ios_key_press`

Send a key press event.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `key` | string | yes | Key name: `Return`, `Escape`, `Home`, `Tab`, `Delete`, etc. |

### `bazel_ios_drag`

Drag from one coordinate to another.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `fromX` | number | yes | Starting X coordinate |
| `fromY` | number | yes | Starting Y coordinate |
| `toX` | number | yes | Ending X coordinate |
| `toY` | number | yes | Ending Y coordinate |
| `durationSeconds` | number | no | Drag duration (default: 0.5) |

### `bazel_ios_accessibility_snapshot`

Capture the accessibility tree of the running app.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `simulatorId` | string | no | Simulator UDID |
| `simulatorName` | string | no | Simulator device name |

## CLI

```sh
xcodebazelmcp tap --x 200 --y 400
xcodebazelmcp double-tap --x 200 --y 400
xcodebazelmcp long-press --x 200 --y 400 --duration 2.0
xcodebazelmcp swipe --direction up --distance 500
xcodebazelmcp pinch --scale 2.0
xcodebazelmcp type --text "Hello World"
xcodebazelmcp key-press --key Return
xcodebazelmcp drag --from-x 100 --from-y 200 --to-x 300 --to-y 400
xcodebazelmcp a11y
xcodebazelmcp a11y --simulator-name "iPhone 17 Pro"
```

## Implementation

- All interaction tools use `xcrun simctl io` subcommands to synthesize touch/keyboard events on the target simulator.
- Simulator resolution reuses the existing `resolveSimulator` function — accepts UDID or name, auto-picks first booted if neither provided.
- `bazel_ios_accessibility_snapshot` runs `simctl io <udid> enumerate` to capture the accessibility element tree, useful for agents to understand on-screen UI structure without screenshots.
