# Gotchas & Known Issues

## Build & Config

- Don't hardcode `--config=test` in test/coverage commands — not all projects define that Bazel config. Users pass it via `configs` array if needed.
- `dist/` must be rebuilt after source changes — `npm run build` regenerates it.
- `npm run lint` uses ESLint 9 flat config — `--ext .ts` flag is invalid. Just `eslint src`.
- `scaffold.ts`: `moduleBazel` always generates with `needsAppleRules = true` — the template parameter was removed since it was never actually used.

## Simulator

- `xcrun simctl io` does NOT support UI interaction commands (tap, swipe) — only screenshots, video recording, IO port enumeration.
- `rules_apple` places `.app` bundles inside `<target>_archive-root/Payload/` — `findAppBundle` must search recursively.
- Simulator tools (`set_simulator_location`, `set_simulator_appearance`) should use `resolveSimulator()` to support both `simulatorId` and `simulatorName`.
- The Simulator.app window position matters for CGEvent — events are posted to absolute screen coordinates.

## Device

- `xcrun devicectl list devicePairs` is deprecated/invalid in modern Xcode. Use `xcrun devicectl list devices`.
- `listDevicePairs` in `core/devices.ts` is misleadingly named — it runs `devicectl list devices`, same as `listDevices`.
- **iOS 17+ / macOS 15+**: Apple replaced `lockdownd`/`usbmuxd` with CoreDevice (`remoted`). `devicectl` is the only CLI that works reliably. `idevicescreenshot`, `idevicesyslog`, and `pymobiledevice3` (without `tunneld`) **cannot connect** to devices — even over USB.
- **Screenshot limitation**: No `devicectl` subcommand exists for screenshots. `idevicescreenshot` fails with "Invalid service" (iOS 17+ DDI change). Workaround: `sudo pymobiledevice3 remote tunneld` in background → `pymobiledevice3 developer dvt screenshot <path> --udid <UDID>`.
- **Log limitation**: `idevicesyslog` cannot connect to iOS 17+ devices. `startDeviceLogCapture()` now tries `pymobiledevice3 syslog live` first (with 1.5s early-exit detection for failures), falling back to `idevicesyslog` for older devices.
- **Process termination**: `devicectl device info processes` only returns `executable` (file:// URL) and `processIdentifier` — no `bundleIdentifier`. Must lookup app executable name via `devicectl device info apps` first, then match by executable path.
- **Device names with Unicode**: Smart quotes in device names (e.g., `Matheus\u2019s iPhone`) must be normalized to ASCII apostrophes before string comparison.
- **Build for device**: `buildCommandArgs()` must exclude simulator-specific flags (`--ios_simulator_device`, `sim_arm64`) when `platform === 'device'`. Device builds use `--ios_multi_cpus=arm64`.
- **Implicit Bazel targets**: `findAppBundle()` handles both `//pkg:target` (explicit) and `//pkg` (implicit, where target name = last path component).

## Logging

- `print()` output is only visible with `xcrun simctl launch --console-pty` — the `run` command does this internally.
- `Logger.info()` messages are **transient** in Apple's unified logging — they don't appear in `log stream` unless a logging profile is installed. Use `.notice` or higher.
- `xcrun simctl spawn <udid> log stream` uses `--process` flag, not `--predicate processImagePath ENDSWITH`.

## LLDB

- `lldb-attach` by PID is the most reliable approach. Attaching by process name can fail if the simulator process name doesn't match the bundle ID.
- **LLDB works on both simulator and physical device**. For devices, use `target: 'device'` with `deviceId`. Internally uses `device select <CoreDevice-UUID>` + `device process attach -p <PID>`. The app should be launched with `--start-stopped` via `devicectl` for reliable attach.
- **Device attach is async**: `device process attach` returns immediately while the connection is established. `waitForProcessStop()` polls the output for `stopped` to confirm the process is ready before returning.
- **Attaching to system apps (Safari, etc.) fails** with "Not allowed to attach to process" due to macOS SIP. Only user-built apps can be debugged.
- `sendCommand` uses `script print("__XBMCP_BEGIN/END__")` markers to delimit command output. `cleanLldbOutput()` strips these markers, `(lldb) script print(...)` echo lines, and orphaned quote fragments from the returned text.
- `sendCommand` Promise must handle the LLDB child process exiting prematurely — `child.on('close')` calls `reject`.
- Per-call `data` listeners on stdout/stderr could leak or cross-talk if commands overlap. `waitForPrompt` doesn't remove its listener on timeout.
- The `quit` command is blocked in `runLldbCommand` — users must use `lldb_detach` instead to properly clean up the session.

## MCP Server

- `handleMessage` fires `void handleMessage()` with no stdout write serialization — concurrent `tools/call` responses could theoretically interleave JSON-RPC lines. Unlikely since MCP clients send sequentially.
- `SERVER_VERSION` in `mcp/server.ts` is hardcoded to `'0.1.0'` and can drift from `package.json`.
- The `~` home dir shorthand in paths may not expand in all MCP clients — prefer absolute paths in config.

## Other

- `compareVersions` splits on `.` and coerces to Number — pre-release segments like `1.0.0-beta` become NaN.
- `simulatorPinch` doesn't actually perform a pinch gesture — just taps at the center point. `scale`/`velocity` params are ignored.
- Daemon `shutdownDaemon` calls `process.exit(0)` unconditionally — importing this module in tests and calling it would kill the test runner.
- Scaffold `name` is validated with `^[A-Za-z][A-Za-z0-9_-]*$` to prevent path traversal.
- Log `--predicate` strings escape quotes on interpolated values to prevent predicate injection.

## Content Cleanup History

- Original project had company-specific references in fixtures, test data, tool descriptions, README examples, and hardcoded personal paths. All replaced with generic names (`MyApp`, `SampleApp`, `/path/to/your/ios-workspace`).
- Default workspace fallback changed from hardcoded path to `process.cwd()`.
