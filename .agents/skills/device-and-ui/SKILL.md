---
name: device-and-ui
description: >-
  Work with physical devices and UI automation. Use when implementing device
  commands, touch/swipe simulation, IDB integration, accessibility inspection,
  or editing files under src/core/devices.ts or src/core/ui-interaction.ts.
---

# Device & UI Automation

## Physical Device Commands (via `xcrun devicectl`)

All physical-device interactions use Apple's CoreDevice framework through `xcrun devicectl`. This is the only reliable CLI for iOS 17+ / macOS 15+ (Sonoma/Tahoe) devices.

### Tool Summary

| Tool | Core function | Status |
|------|--------------|--------|
| `bazel_ios_list_devices` | `listDevices()` → `devicectl list devices` | ✅ Stable |
| `bazel_ios_device_info` | `deviceInfo()` → `devicectl device info details` | ✅ Stable |
| `bazel_ios_device_build_and_run` | Build + install + launch chain | ✅ Stable |
| `bazel_ios_device_install_app` | `installAppOnDevice()` → `devicectl device install app` | ✅ Stable |
| `bazel_ios_device_launch_app` | `launchAppOnDevice()` → `devicectl device process launch` | ✅ Stable |
| `bazel_ios_device_stop_app` | `terminateAppOnDevice()` → lookup PID via apps+procs, then `devicectl device process terminate --pid` | ✅ Stable |
| `bazel_ios_device_screenshot` | `screenshotDevice()` → pymobiledevice3 > idevicescreenshot -n > idevicescreenshot | ⚠️ See connectivity notes |
| `bazel_ios_device_log_start/stop` | `startDeviceLogCapture()` → pymobiledevice3 > idevicesyslog | ⚠️ See connectivity notes |
| `bazel_ios_device_test` | `bazel test` with `--test_arg=--destination id=<UDID>` | ✅ Stable |
| `bazel_ios_device_pair/unpair` | `devicectl manage pair/unpair` | ✅ Stable |
| `bazel_ios_device_list_pairs` | `devicectl list devices` | ✅ Stable |

### Device Connectivity & iOS 17+ Limitations

Starting with iOS 17 and macOS 15 (Sonoma), Apple replaced the legacy `lockdownd`/`usbmuxd` protocol with **CoreDevice** (`remoted`). This affects third-party tools:

| Transport | `devicectl` | `idevicescreenshot` | `idevicesyslog` | `pymobiledevice3` |
|-----------|------------|--------------------|-----------------|--------------------|
| USB cable | ✅ | ❌ Invalid service (iOS 17+) | ❌ Cannot connect | ❌ needs `tunneld` |
| Wi-Fi/Network | ✅ | ❌ Device not found | ❌ Device not found | ❌ needs `tunneld` |

**Key implications:**

1. **`devicectl` is the only reliable CLI** for list/info/install/launch/terminate on iOS 17+.
2. **Screenshot & log tools depend on `libimobiledevice` or `pymobiledevice3`**, which cannot access the CoreDevice tunnel without `sudo pymobiledevice3 remote tunneld` running in a separate terminal.
3. **Screenshot workarounds**: Connect via USB and use Xcode's device screen mirror, or run `sudo pymobiledevice3 remote tunneld` in background and then `pymobiledevice3 developer dvt screenshot <path> --udid <UDID>`.
4. **Log workarounds**: Use Xcode's Console.app, or `sudo pymobiledevice3 remote tunneld` + `pymobiledevice3 syslog live --udid <UDID>`.

### Process Termination (`terminateAppOnDevice`)

`devicectl device info processes` returns process entries with only `executable` (a `file://` URL string) and `processIdentifier` — **no `bundleIdentifier` field**. The terminate flow is:

1. Query installed apps via `devicectl device info apps` to find the app's executable name from its `url` field (e.g., `IdentityIntelligenceDemo.app` → `IdentityIntelligenceDemo`).
2. Query running processes via `devicectl device info processes`.
3. Match the executable URL's last path component against the known executable name.
4. Terminate by PID: `devicectl device process terminate --device <UDID> --pid <PID>`.

### Device Resolution

`resolveDevice()` finds a device by UDID or name from connected devices:
- Unicode normalization handles smart quotes in device names (e.g., `Matheus\u2019s iPhone` → `Matheus's iPhone`).
- Connection state derived from `connectionProperties.tunnelState === 'connected'` or `pairingState === 'paired'` with `visibilityClass === 'default'`.

### Build for Device

`buildCommandArgs()` conditionally excludes simulator flags when `platform === 'device'`:
- Device builds use `--ios_multi_cpus=arm64` (no `sim_` prefix).
- Simulator-specific args like `--ios_simulator_device` are omitted.

### App Bundle Discovery for Device

`findAppBundle()` supports both explicit (`//pkg:target`) and implicit (`//pkg`) Bazel labels:
- Implicit `//Apps/Foo` resolves to target name `Foo` (last path component).
- Searches `bazel-bin/<pkg>/<name>.app` and `<name>_archive-root/Payload/<name>.app`.

## UI Automation — IDB (preferred, simulators only)

Facebook IDB (`idb`) sends real HID touch events to the simulator runtime. All UI interaction functions in `src/core/ui-interaction.ts` check `findIdb()` first, fall back to CGEvent/osascript.

### IDB Commands

```
idb ui tap --udid <UDID> -- X Y
idb ui swipe --udid <UDID> -- X1 Y1 X2 Y2
idb ui text --udid <UDID> -- "hello"
idb ui key --udid <UDID> -- <hid_code>
idb ui button --udid <UDID> -- HOME
idb ui describe-all --udid <UDID>    # accessibility tree
```

- Coordinates are in iOS points (app coordinate space), not macOS screen pixels.
- `idb ui describe-all` returns real accessibility elements with `AXFrame`, `AXLabel`, `AXUniqueId`, `role`, `type`.
- Install: `brew install idb-companion`. The `idb` Python CLI wraps `idb_companion`.

## UI Automation — Fallback (CGEvent/osascript, simulators only)

- Touch/drag/swipe/pinch: dynamically compiled Swift scripts with `CoreGraphics` `CGEvent` — posts mouse events at screen coordinates.
- Text typing/key presses: `osascript` (AppleScript) with `System Events` `keystroke` / `key code`.
- `osascript` brings Simulator.app to the front before touch events (CGEvent uses absolute screen coordinates).

**Important**: macOS `CGEvent` does NOT translate to iOS touch events in the simulator. IDB is required for reliable touch simulation.

## Accessibility

`simulatorAccessibilitySnapshot` has no reliable programmatic API from outside the app process. Falls back to `simctl listapps` with a descriptive message. Proper implementation would require an in-app accessibility bridge or XCTest.

## Logging

### Simulator Logs

Two distinct log channels:

| Channel | Captured via | Visibility |
|---------|-------------|------------|
| `print()` / stdout | `simctl launch --console-pty` | Only with console-pty flag |
| `os.log` / `Logger` | `simctl spawn <UDID> log stream` | Unified log system |

- `Logger.info()` is transient — use `.notice` or higher for guaranteed capture.
- `--predicate` supports `subsystem == "..."`, `process == "..."`, `composedMessage CONTAINS "..."` with `AND`/`OR` logic.

### Device Logs

`startDeviceLogCapture()` mirrors the screenshot strategy — tries pymobiledevice3 first, falls back to idevicesyslog:

1. **pymobiledevice3** (`syslog live --udid <UDID>`) — works on iOS 17+ with CoreDevice tunnel. Detects early failures (device not found, no tunneld) within 1.5s and falls through.
2. **idevicesyslog** (`-u <UDID> -n`) — fallback for pre-iOS 17 or when pymobiledevice3 is unavailable.

- Process filtering via `--process-name` (pymobiledevice3) or `-p` (idevicesyslog).
- Logs are captured in memory and returned on `log_stop`.
- The response includes which backend was selected (`tool` field).
