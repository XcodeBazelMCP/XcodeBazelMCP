# Video Recording

Status: **Implemented**

## Overview

Stateful start/stop tools for recording the simulator screen. Start begins a background `xcrun simctl io <udid> recordVideo` process; stop sends SIGINT to finalize the file and returns the output path. The CLI variant records until Ctrl+C.

## Tools

### `bazel_ios_video_record_start`

Start recording the simulator screen.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `outputPath` | string | yes | File path for the recorded video (e.g. `/tmp/demo.mp4`) |
| `simulatorId` | string | no | Simulator UDID (default: first booted) |
| `simulatorName` | string | no | Simulator device name |
| `codec` | string | no | Video codec: `h264` or `hevc` (default: `h264`) |

Returns a `recordingId` used to stop the recording.

### `bazel_ios_video_record_stop`

Stop a running video recording and finalize the file.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `recordingId` | string | yes | The recording ID returned by `video_record_start` |

Returns the output file path upon successful finalization.

## CLI

```sh
# Records until Ctrl+C
xcodebazelmcp video-record /tmp/demo.mp4
xcodebazelmcp video-record /tmp/demo.mp4 --codec hevc
```

`video-stop` is MCP-only — the CLI records until interrupted.

## Implementation

- Start spawns `xcrun simctl io <udid> recordVideo --codec=<codec> <outputPath>` as a child process.
- Stop sends SIGINT (not SIGTERM) to the recording process — this is required for `simctl recordVideo` to properly finalize the video file container.
- Recording state is per-server-process; IDs are not valid across restarts.
- The CLI uses `video-record` which runs the recording in the foreground, finalized by Ctrl+C (SIGINT).
