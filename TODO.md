# XcodeBazelMCP — Feature Comparison & Roadmap

Comparison baseline: [getsentry/XcodeBuildMCP v2.5.x](https://github.com/getsentry/XcodeBuildMCP) (79 tools, 15 workflows).

## Progress Summary

| | Count |
|---|---|
| **Tools implemented** | 112 |
| **Unit tests** | 114 |
| **P0 tasks** | 6/6 done |
| **P1 tasks** | 10/10 done |
| **P2 tasks** | 17/18 done |

## Feature Comparison

| Category | XcodeBuildMCP | XcodeBazelMCP | Status |
|---|---|---|---|
| **Build system** | `xcodebuild` | `bazel` | ✅ Different by design |
| **Platforms** | iOS, macOS, tvOS, watchOS, visionOS | iOS, macOS, tvOS, watchOS, visionOS | ✅ Full parity |
| **Total tools** | 79 | 112 | ✅ Exceeded |

### Workflow-by-Workflow

| Workflow | XcodeBuildMCP Tools | XcodeBazelMCP Equivalent | Status |
|---|---|---|---|
| **Simulator — build** | `build_sim` | `bazel_ios_build` | ✅ Done |
| **Simulator — build+run+launch** | `build_run_sim`, `install_app_sim`, `launch_app_sim`, `stop_app_sim`, `get_sim_app_path`, `get_app_bundle_id` | `build_and_run`, `install_app`, `launch_app`, `stop_app`, `get_app_path`, `get_bundle_id` | ✅ Done |
| **Simulator — test** | `test_sim` + live progress | `bazel_ios_test` (+ `--stream`) | ✅ Done |
| **Simulator — test coverage** | 2 tools (xcresult analysis) | `bazel_ios_test_coverage` | ✅ Done |
| **Simulator — log capture** | `start_log_capture_sim`, `stop_log_capture_sim` | `bazel_ios_log_capture_start`, `bazel_ios_log_capture_stop` | ✅ Done |
| **Simulator — video recording** | `record_sim_video`, `stop_sim_video` | `video_record_start`, `video_record_stop` | ✅ Done |
| **Simulator management** | 10 tools (boot, erase, location, appearance, statusbar, network) | 10 tools (list, boot, shutdown, erase, location, appearance, open, status_bar, privacy, ui_dump) | ✅ Done |
| **Device** | 15 tools (build, install, launch, test, log, pair) | 13 tools: `list_devices`, `device_build_and_run`, `device_install_app`, `device_launch_app`, `device_stop_app`, `device_test`, `device_screenshot`, `device_log_start`, `device_log_stop`, `device_info`, `device_pair`, `device_unpair`, `device_list_pairs` | ✅ Done (13 tools) |
| **macOS** | 13 tools (build, run, test, launch) | 13 tools: `macos_build`, `macos_run`, `macos_test`, `macos_discover_targets`, `macos_coverage`, `macos_clean`, `macos_launch`, `macos_stop`, `macos_install`, `macos_app_path`, `macos_bundle_id`, `macos_log`, `macos_screenshot` | ✅ Done (13 tools) |
| **tvOS** | — | `tvos_build`, `tvos_run`, `tvos_test`, `tvos_discover_targets` | ✅ Done (4 tools) |
| **watchOS** | — | `watchos_build`, `watchos_run`, `watchos_test`, `watchos_discover_targets` | ✅ Done (4 tools) |
| **visionOS** | — | `visionos_build`, `visionos_run`, `visionos_test`, `visionos_discover_targets` | ✅ Done (4 tools) |
| **Debugging (LLDB)** | 8 tools (attach, breakpoints, variables, call stacks) | `lldb_attach`, `lldb_detach`, `lldb_breakpoint`, `lldb_backtrace`, `lldb_variables`, `lldb_expression`, `lldb_step`, `lldb_threads`, `lldb_command`, `lldb_sessions` | ✅ Done (10 tools) |
| **Simulator — screenshot** | `screenshot` | `screenshot` | ✅ Done |
| **UI Automation** | 10 tools (tap, swipe, type, gesture, accessibility snapshot) | `tap`, `double_tap`, `long_press`, `swipe`, `pinch`, `type_text`, `key_press`, `drag`, `accessibility_snapshot`, `ui_dump`, `open_url`, `push_notification` | ✅ Done (12 tools) |
| **Project Discovery** | 5 tools (schemes, build settings, bundles) | `discover_targets`, `target_info`, `query`, `deps`, `rdeps` | ✅ Done |
| **Project Scaffolding** | 2 tools (iOS + macOS templates) | `bazel_scaffold`, `bazel_scaffold_list_templates` | ✅ Done (6 templates) |
| **Swift Package** | 8 tools (build, test, run, clean) | `swift_package_build`, `swift_package_test`, `swift_package_run`, `swift_package_clean`, `swift_package_resolve`, `swift_package_dump`, `swift_package_init` | ✅ Done (7 tools) |
| **Session Management** | 5 tools (defaults, profiles, monorepo support) | `set_workspace`, `set_defaults`, `show_defaults`, `list_profiles` | ✅ Done |
| **Health / Doctor** | 1 tool | `bazel_ios_health` | ✅ Done |
| **Xcode IDE Bridge** | 5 tools (Xcode MCP bridge) | — | ⚪ N/A for Bazel |
| **Workflow Discovery** | 1 tool (runtime workflow toggling) | `bazel_list_workflows`, `bazel_toggle_workflow` | ✅ Done (2 tools) |
| **Utilities** | 1 tool (`clean`) | `bazel_ios_clean` | ✅ Done |

### Unique to XcodeBazelMCP (not in XcodeBuildMCP)

| Feature | Tool | Status |
|---|---|---|
| **Bazel query** | `bazel_ios_query` | ✅ Done |
| **Bazel target info** | `bazel_ios_target_info` | ✅ Done |
| **Bazel deps** | `bazel_ios_deps` | ✅ Done |
| **Bazel rdeps** | `bazel_ios_rdeps` | ✅ Done |
| **BSP integration** | `bazel_ios_bsp_status` | ✅ Done |
| **Startup args** | Every tool supports `startupArgs` | ✅ Done |
| **Last command replay** | `bazel_ios_last_command` + MCP resource | ✅ Done |
| **Push notification** | `bazel_ios_push_notification` (inline or payload) | ✅ Done |
| **Open URL** | `bazel_ios_open_url` (deep links, universal links) | ✅ Done |
| **Privacy management** | `bazel_ios_privacy` (grant/revoke/reset) | ✅ Done |

### Infrastructure

| Feature | XcodeBuildMCP | XcodeBazelMCP | Status |
|---|---|---|---|
| Config file (YAML) | `.xcodebuildmcp/config.yaml` with full schema, `schemaVersion`, validation | `.xcodebazelmcp/config.yaml` loaded from workspace or `~/` | ✅ Done (no schema validation) |
| Session defaults / profiles | Named profiles, monorepo support, `session_set_defaults` tool | `bazel_ios_set_defaults` (with `--profile`), `bazel_ios_list_profiles` | ✅ Done |
| Enabled workflows config | `enabledWorkflows` array controls which tools are advertised | `enabledWorkflows` in config.yaml + runtime `bazel_toggle_workflow` | ✅ Done |
| Streaming output | `text` / `jsonl` / `json` modes with live progress | `streaming: true` + `notifications/progress` + CLI `--stream` | ✅ Done (text mode only) |
| Per-workspace daemon | Auto-start daemon for stateful ops (log, video, LLDB) | `bazel_daemon_start`, `bazel_daemon_stop`, `bazel_daemon_status` | ✅ Done (3 tools) |
| Xcode IDE proxy | Proxies Xcode's native MCP server (`mcpbridge`), SwiftUI previews, Apple docs | No | 🔴 Not started |
| Xcode 26.3 agent integration | Auto-detects active scheme/simulator from Xcode, hides redundant tools | No | 🔴 Not started |
| Multi-client support | Cursor, Claude Code, VS Code, Windsurf, Xcode, any MCP client | Cursor / Claude Code (manual config) | 🟡 |
| Interactive setup wizard | `xcodebuildmcp setup` generates config interactively | `xcodebazelmcp setup` | ✅ Done |
| Sentry telemetry | Opt-out | None | ⚪ Not planned |
| Self-update CLI | `upgrade` command (auto-detects Homebrew vs npm) | `bazel_check_update`, `bazel_upgrade` | ✅ Done |
| npm published | `xcodebuildmcp` | Local only | 🔴 Not started |
| Homebrew tap | Yes | No | 🔴 Not started |
| Agent skills | MCP + CLI skills, `init` command installs to agent | `xcodebazelmcp init` installs rules | ✅ Done |
| Structured output schemas | JSON schema for tool results | `structuredContent` on build/test results | ✅ Done |
| CI/CD pipeline support | CLI with `jsonl` streaming, `--output json`, daemon | CLI only (basic text) | 🟡 |

---

## Roadmap

### P0 — High Value (core agent workflow) — ALL DONE ✅

- [x] **Simulator build + run + launch** — `bazel_ios_build_and_run`, `bazel_ios_install_app`, `bazel_ios_launch_app`. See [docs/simulator-build-run-launch.md](docs/simulator-build-run-launch.md).
- [x] **Simulator management** — `bazel_ios_boot_simulator`, `bazel_ios_shutdown_simulator`, `bazel_ios_erase_simulator`, `bazel_ios_set_simulator_location`, `bazel_ios_set_simulator_appearance`, `bazel_ios_open_simulator`. See [docs/simulator-management.md](docs/simulator-management.md).
- [x] **Streaming build output** — `streaming: true` param on build/test/query/clean tools + MCP `notifications/progress` + CLI `--stream` flag. See [docs/streaming-output.md](docs/streaming-output.md).
- [x] **Bazel clean** — `bazel_ios_clean` with optional `--expunge`. See [docs/bazel-clean.md](docs/bazel-clean.md).
- [x] **Config file loading** — loads `.xcodebazelmcp/config.yaml` from workspace or `~/.xcodebazelmcp/`. See [docs/config-and-defaults.md](docs/config-and-defaults.md).
- [x] **Session defaults** — `bazel_ios_set_defaults` / `bazel_ios_show_defaults` tools. See [docs/config-and-defaults.md](docs/config-and-defaults.md).

### P1 — Medium Value (richer agent experience) — ALL DONE ✅

- [x] **Test streaming / live progress** — already supported via `streaming: true` on `bazel_ios_test`. See [docs/streaming-output.md](docs/streaming-output.md).
- [x] **Code coverage** — `bazel_ios_test_coverage` tool with lcov parsing and per-file summary. See [docs/test-coverage.md](docs/test-coverage.md).
- [x] **Log capture** — `bazel_ios_log_capture_start` / `bazel_ios_log_capture_stop` with process and level filters. See [docs/log-capture.md](docs/log-capture.md).
- [x] **Session profiles for monorepos** — `bazel_ios_list_profiles` + `set_defaults --profile name`. Config supports `profiles:` section with named presets. See [docs/config-and-defaults.md](docs/config-and-defaults.md).
- [x] **Bazel deps / rdeps query tools** — `bazel_ios_deps` (with depth) and `bazel_ios_rdeps` (with scope). See [docs/deps-and-rdeps.md](docs/deps-and-rdeps.md).
- [x] **CLI subcommands for MCP-only tools** — `target-info`, `bsp-status`, `last-command`, `deps`, `rdeps`, `coverage`, `log-start`, `log-stop`, `profiles`.
- [x] **Publish `bazel_ios_last_command` in tool list** — now in `bazelToolDefinitions`.
- [x] **Structured output** — `toolResult()` returns `structuredContent` with parsed JSON alongside human-readable text.
- [x] **Interactive setup wizard** — `xcodebazelmcp setup` generates `.xcodebazelmcp/config.yaml` interactively.
- [x] **Skill init command** — `xcodebazelmcp init` installs agent skills into `.cursor/rules/` and `.codex/`.

### P2 — Lower Priority (feature parity) — 15/18

- [x] **Stop app** — `bazel_ios_stop_app` via `xcrun simctl terminate`. See [docs/stop-app.md](docs/stop-app.md).
- [x] **Get app path / bundle ID** — `bazel_ios_get_app_path` and `bazel_ios_get_bundle_id`. See [docs/app-path-and-bundle-id.md](docs/app-path-and-bundle-id.md).
- [x] **Screenshot** — `bazel_ios_screenshot` via `xcrun simctl io screenshot` with mask options. See [docs/screenshot.md](docs/screenshot.md).
- [x] **Video recording** — `bazel_ios_video_record_start` / `bazel_ios_video_record_stop`. See [docs/video-recording.md](docs/video-recording.md).
- [x] **Status bar** — `bazel_ios_set_status_bar` overrides time, battery, network. See [docs/status-bar.md](docs/status-bar.md).
- [x] **Privacy** — `bazel_ios_privacy` grant/revoke/reset permissions. See [docs/privacy.md](docs/privacy.md).
- [x] **Push notification** — `bazel_ios_push_notification` sends simulated push. See [docs/push-notification.md](docs/push-notification.md).
- [x] **Open URL** — `bazel_ios_open_url` opens deep links, universal links, or web URLs. See [docs/open-url.md](docs/open-url.md).
- [x] **UI state** — `bazel_ios_ui_dump` reports appearance mode and increase contrast state.
- [x] **Device support** — 5 tools via `xcrun devicectl`. See [docs/device-support.md](docs/device-support.md).
- [x] **LLDB debugging** — 10 tools for interactive debugging. See [docs/lldb-debugging.md](docs/lldb-debugging.md).
- [x] **macOS targets** — 4 tools for `macos_application` / `macos_unit_test`. See [docs/macos-targets.md](docs/macos-targets.md).
- [x] **tvOS / watchOS / visionOS** — 4 tools per platform. See [docs/tvos-watchos-visionos.md](docs/tvos-watchos-visionos.md).
- [x] **Swift Package support** — 7 tools for SPM workflows. See [docs/swift-package.md](docs/swift-package.md).
- [x] **Project scaffolding** — `bazel_scaffold` with 6 templates. See [docs/project-scaffolding.md](docs/project-scaffolding.md).
- [x] **Per-workspace daemon** — 3 tools for background stateful ops. See [docs/daemon.md](docs/daemon.md).
- [x] **Self-update** — `bazel_check_update` + `bazel_upgrade`. See [docs/self-update.md](docs/self-update.md).
- [x] **UI Automation** — 9 tools for tap, swipe, type, gesture, accessibility. See [docs/ui-automation.md](docs/ui-automation.md).
- [ ] **npm publish + Homebrew** — publish to npm registry and create Homebrew formula.
