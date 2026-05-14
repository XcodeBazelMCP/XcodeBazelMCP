# XcodeBazelMCP — Test Plan

Last verified: 2026-05-12 against `example_projects/BazelApp` on macOS with Bazel 7.6.0 + Xcode 26.3.

## Summary

| Suite | Tests | Pass |
|-------|-------|------|
| Unit tests (vitest) | 35 | 35 |
| CLI integration | 41 | 41 |
| MCP JSON-RPC integration | 36 | 36 |
| **Total** | **112** | **112** |

---

## 1. Unit Tests

Run: `npm test`

| File | Tests | Description |
|------|-------|-------------|
| `src/core/bazel.test.ts` | 15 | Arg builders, label validation, query sanitization, YAML config parsing |
| `src/tools/bazel-tools.test.ts` | 10 | Tool name registry (39 tools), required fields, startupArgs, streaming flag, simulatorId, launchArgs, unknown tool rejection |
| `src/core/simulators.test.ts` | 9 | `findAppBundle` path resolution, `readBundleId` from plist fixtures |
| `src/smoke-tests/mcp-startup.test.ts` | 1 | MCP server initializes without error |

---

## 2. CLI Integration Tests

Prereqs: `export BAZEL_IOS_WORKSPACE=<path>/example_projects/BazelApp`

### Infrastructure

| ID | Command | Assertion | Status |
|----|---------|-----------|--------|
| CLI-01 | `help` | Prints usage header | PASS |
| CLI-02 | `tools` | Lists 39 tools (78 lines) | PASS |
| CLI-03 | `doctor` | Bazel, Xcode, simctl all OK | PASS |

### Query & Inspect

| ID | Command | Assertion | Status |
|----|---------|-----------|--------|
| CLI-04 | `discover --scope //... --kind all` | 3 targets (1 app + 2 tests) | PASS |
| CLI-05 | `discover --scope //... --kind tests` | 2 test targets | PASS |
| CLI-06 | `discover --scope //... --kind apps` | `//app:app` | PASS |
| CLI-07 | `query 'kind("swift_library rule", //...)'` | 5 swift_library targets | PASS |
| CLI-08 | `query ... --output label_kind` | Output includes `ios_unit_test rule` | PASS |
| CLI-09 | `target-info //app:app` | Shows `bundle_id = "com.example.SwiftUIApp"` | PASS |
| CLI-10 | `deps //app:app --depth 1` | 8 direct deps | PASS |
| CLI-11 | `rdeps //modules/Models:ModelsLib --scope //modules/...` | 8 reverse deps | PASS |

### Build & Run

| ID | Command | Assertion | Status |
|----|---------|-----------|--------|
| CLI-12 | `build //app:app --stream` | "Build completed successfully" | PASS |
| CLI-13 | `app-path //app:app` | Returns `.app` path | PASS |
| CLI-14 | `bundle-id //app:app` | `com.example.SwiftUIApp` | PASS |
| CLI-15 | `bundle-id <absolute .app path>` | `com.example.SwiftUIApp` | PASS |
| CLI-16 | `run //app:app --simulator-name "iPhone 17 Pro"` | Build + install + launch OK | PASS |
| CLI-17 | `stop com.example.SwiftUIApp` | App terminated | PASS |
| CLI-18 | `test //modules/Models:ModelsTests --stream` | PASSED with streaming output | PASS |
| CLI-19 | `coverage //modules/API:APITests` | Coverage report with percentage | PASS |

### Simulator Management

| ID | Command | Assertion | Status |
|----|---------|-----------|--------|
| CLI-20 | `simulators --booted` | Lists booted simulators as JSON | PASS |
| CLI-21 | `sim-boot --simulator-name "iPhone 17 Pro"` | "already booted" (idempotent) | PASS |
| CLI-22 | `sim-appearance dark` | "Appearance set to dark" | PASS |
| CLI-23 | `sim-appearance light` | "Appearance set to light" | PASS |
| CLI-24 | `sim-location --lat 37.7749 --lon -122.4194` | "Location set to 37.7749, -122.4194" | PASS |
| CLI-25 | `sim-open` | exit=0 | PASS |
| CLI-26 | `screenshot /tmp/test.png` | File saved, non-zero size | PASS |
| CLI-27 | `status-bar --time "9:41" --battery-level 100 ...` | "Status bar updated" | PASS |
| CLI-28 | `status-bar --clear` | "Status bar overrides cleared" | PASS |

### App Interaction

| ID | Command | Assertion | Status |
|----|---------|-----------|--------|
| CLI-29 | `ui-dump` | Shows appearance + increase contrast state | PASS |
| CLI-30 | `open-url "https://apple.com"` | "Opened https://apple.com" | PASS |
| CLI-31 | `privacy grant photos com.example.SwiftUIApp` | "Privacy grant photos" | PASS |
| CLI-32 | `privacy reset photos com.example.SwiftUIApp` | "Privacy reset photos" | PASS |
| CLI-33 | `push com.example.SwiftUIApp --title "..." --body "..."` | "Notification sent" | PASS |

### Config & Session

| ID | Command | Assertion | Status |
|----|---------|-----------|--------|
| CLI-34 | `defaults` | Shows workspace path, config file | PASS |
| CLI-35 | `set-defaults --profile app` | Profile activated with target/sim/mode | PASS |
| CLI-36 | `profiles` | Lists `app` and `models` profiles | PASS |
| CLI-37 | `set-defaults --clear` | "Session defaults cleared" | PASS |

### Utilities

| ID | Command | Assertion | Status |
|----|---------|-----------|--------|
| CLI-38 | `clean` | exit=0, "clean" output | PASS |
| CLI-39 | `bsp-status` | Shows workspace path | PASS |
| CLI-40 | `last-command` | "No command has run yet" (per-process) | PASS |
| CLI-41 | `log-start --level debug` (3s timeout) | Streams log output to stdout | PASS |

### Notes

- `video-record <file.mp4>` records until Ctrl+C. Cannot automate with `timeout` (needs SIGINT for proper file finalization). Tested via MCP start/stop flow.
- `log-start` streams to stdout in CLI mode. `log-stop` is MCP-only.
- `last-command` is per-process; always "no command" in separate CLI invocations.
- Session defaults don't persist across CLI invocations (separate processes).

---

## 3. MCP JSON-RPC Integration Tests

Protocol: pipe JSON-RPC messages to `node dist/cli.js mcp` via stdin.

### Handshake & Discovery

| ID | Method | Assertion | Status |
|----|--------|-----------|--------|
| MCP-01 | `initialize` | Server: XcodeBazelMCP v0.1.0 | PASS |
| MCP-02 | `tools/list` | 39 tools returned | PASS |

### Health & Config

| ID | Tool | Arguments | Assertion | Status |
|----|------|-----------|-----------|--------|
| MCP-03 | `bazel_ios_health` | `{}` | Workspace, Bazel, Xcode, simctl OK | PASS |
| MCP-04 | `bazel_ios_show_defaults` | `{}` | Config file path, profiles listed | PASS |
| MCP-05 | `bazel_ios_list_profiles` | `{}` | `app` and `models` profiles | PASS |
| MCP-06 | `bazel_ios_set_defaults` | `{"profile":"app"}` | Profile activated | PASS |
| MCP-07 | `bazel_ios_set_defaults` | `{"clear":true}` | Defaults cleared | PASS |

### Query & Inspect

| ID | Tool | Arguments | Assertion | Status |
|----|------|-----------|-----------|--------|
| MCP-08 | `bazel_ios_discover_targets` | `{"scope":"//...","kind":"all"}` | exit=0, targets found | PASS |
| MCP-09 | `bazel_ios_query` | `{"expression":"kind(...)"}` | exit=0, libraries listed | PASS |
| MCP-10 | `bazel_ios_target_info` | `{"target":"//app:app"}` | exit=0, build rule output | PASS |
| MCP-11 | `bazel_ios_deps` | `{"target":"//app:app","depth":1}` | exit=0, deps listed | PASS |
| MCP-12 | `bazel_ios_rdeps` | `{"target":"...","scope":"//modules/..."}` | exit=0, rdeps listed | PASS |

### Simulator Management

| ID | Tool | Arguments | Assertion | Status |
|----|------|-----------|-----------|--------|
| MCP-13 | `bazel_ios_list_simulators` | `{"onlyBooted":true}` | JSON array of booted sims | PASS |
| MCP-14 | `bazel_ios_boot_simulator` | `{"simulatorName":"iPhone 17 Pro"}` | "already booted" | PASS |
| MCP-15 | `bazel_ios_set_simulator_appearance` | `{"appearance":"dark"}` | exit=0 | PASS |
| MCP-16 | `bazel_ios_set_simulator_appearance` | `{"appearance":"light"}` | exit=0 | PASS |
| MCP-17 | `bazel_ios_set_simulator_location` | `{"latitude":40.71,"longitude":-74.01}` | "Location set" | PASS |
| MCP-18 | `bazel_ios_open_simulator` | `{}` | exit=0 | PASS |

### Build & App Lifecycle

| ID | Tool | Arguments | Assertion | Status |
|----|------|-----------|-----------|--------|
| MCP-19 | `bazel_ios_build` | `{"target":"//app:app","platform":"simulator"}` | exit=0, structured output | PASS |
| MCP-20 | `bazel_ios_get_app_path` | `{"target":"//app:app"}` | `.app` path returned | PASS |
| MCP-21 | `bazel_ios_get_bundle_id` | `{"appPath":"//app:app"}` | `com.example.SwiftUIApp` | PASS |
| MCP-22 | `bazel_ios_screenshot` | `{"outputPath":"/tmp/test.png"}` | "Screenshot saved", exit=0 | PASS |
| MCP-23 | `bazel_ios_set_status_bar` | `{"time":"9:41","batteryLevel":100}` | "Status bar updated" | PASS |
| MCP-24 | `bazel_ios_set_status_bar` | `{"clear":true}` | "overrides cleared" | PASS |

### App Interaction

| ID | Tool | Arguments | Assertion | Status |
|----|------|-----------|-----------|--------|
| MCP-25 | `bazel_ios_privacy` | `{"action":"grant","service":"camera","bundleId":"..."}` | exit=0 | PASS |
| MCP-26 | `bazel_ios_privacy` | `{"action":"reset","service":"camera","bundleId":"..."}` | exit=0 | PASS |
| MCP-27 | `bazel_ios_open_url` | `{"url":"https://apple.com"}` | "Opened" | PASS |
| MCP-28 | `bazel_ios_push_notification` | `{"bundleId":"...","title":"...","body":"...","badge":7}` | "Notification sent" | PASS |
| MCP-29 | `bazel_ios_ui_dump` | `{}` | Appearance + contrast state | PASS |

### Utilities

| ID | Tool | Arguments | Assertion | Status |
|----|------|-----------|-----------|--------|
| MCP-30 | `bazel_ios_clean` | `{}` | exit=0 | PASS |
| MCP-31 | `bazel_ios_last_command` | `{}` | Returns last or "no command" | PASS |
| MCP-32 | `bazel_ios_bsp_status` | `{}` | Workspace + .bsp status | PASS |

### Stateful Flows (start/stop across multiple calls)

| ID | Flow | Assertion | Status |
|----|------|-----------|--------|
| MCP-33 | `log_capture_start` → 2s delay → `log_capture_stop` | Start returns ID, stop returns captured logs (7960 chars) | PASS |
| MCP-34 | `video_record_start` → 3s delay → `video_record_stop` | Start returns ID, stop finalizes file (8.8KB .mp4) | PASS |

### Structured Output

| ID | Tool | Assertion | Status |
|----|------|-----------|--------|
| MCP-35 | `bazel_ios_build` | `structuredContent.exitCode = 0`, has `command` field | PASS |
| MCP-36 | `bazel_ios_test` | `structuredContent.exitCode = 0`, has `target` field | PASS |

---

## How to Run

### Unit tests

```bash
npm test
```

### CLI integration (quick smoke)

```bash
export BAZEL_IOS_WORKSPACE=/path/to/example_projects/BazelApp
node dist/cli.js doctor
node dist/cli.js tools
node dist/cli.js build //app:app --stream
node dist/cli.js run //app:app --simulator-name "iPhone 17 Pro"
node dist/cli.js stop com.example.SwiftUIApp
node dist/cli.js screenshot /tmp/test.png
node dist/cli.js test //modules/Models:ModelsTests --stream
node dist/cli.js coverage //modules/API:APITests
```

### MCP integration (quick smoke)

```bash
export BAZEL_IOS_WORKSPACE=/path/to/example_projects/BazelApp
INIT='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'

# List tools
printf "$INIT\n"'{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}\n' \
  | node dist/cli.js mcp 2>/dev/null | sed -n '2p' | python3 -m json.tool

# Call a tool
printf "$INIT\n"'{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"bazel_ios_health","arguments":{}}}\n' \
  | node dist/cli.js mcp 2>/dev/null | sed -n '2p' | python3 -m json.tool

# Stateful flow (log capture)
(printf "$INIT\n"; printf '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"bazel_ios_log_capture_start","arguments":{}}}\n'; \
 sleep 2; printf '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"bazel_ios_log_capture_stop","arguments":{"captureId":"log-1"}}}\n'; \
 sleep 1) | timeout 8 node dist/cli.js mcp 2>/dev/null
```

---

## Known Limitations

1. **CLI session state is per-process** — `set-defaults`, `last-command`, and log/video captures don't persist between CLI invocations. These work across calls in MCP server mode.
2. **`video-record` CLI** — uses `timeout`/Ctrl+C to stop. The `timeout` command sends SIGTERM which may not finalize the video file cleanly; real Ctrl+C (SIGINT) works correctly.
3. **`log-stop` / `video-stop` CLI** — only available in MCP server mode. CLI equivalents (`log-start`, `video-record`) stream directly until interrupted.
4. **`ui-dump`** — reports appearance and contrast state only. Full accessibility tree inspection (`snapshot_ui`) is not available via `simctl`; requires XCUITest or Accessibility Inspector.
5. **`stop_app` when app not running** — returns `isError: true` with "found nothing to terminate". This is correct behavior.
6. **`get_app_path` / `get_bundle_id` before build** — returns error "Build the target first". This is correct behavior.
