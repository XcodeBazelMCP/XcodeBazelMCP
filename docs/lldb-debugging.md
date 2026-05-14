# LLDB Debugging

Status: **Implemented**

## Overview

Ten MCP tools for interactive LLDB debugging of iOS apps running on simulators or physical devices. Supports attaching to processes, setting breakpoints, inspecting state, evaluating expressions, and stepping through code — all from an agent or CLI.

## Tools

### `bazel_ios_lldb_attach`

Attach the debugger to a running process.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `pid` | number | no | Process ID to attach to |
| `processName` | string | no | Process name to attach to |
| `waitFor` | boolean | no | Wait for the process to launch before attaching |
| `target` | string | no | `device` or `simulator` (default: simulator) |

At least one of `pid` or `processName` must be provided.

### `bazel_ios_lldb_detach`

Detach the debugger and end a session.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `sessionId` | string | yes | LLDB session ID |

### `bazel_ios_lldb_breakpoint`

Manage breakpoints in a debug session.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `sessionId` | string | yes | LLDB session ID |
| `action` | string | yes | `set`, `delete`, or `list` |
| `file` | string | no | Source file path (for `set`) |
| `line` | number | no | Line number (for `set`) |
| `symbol` | string | no | Symbol/function name (for `set`) |
| `module` | string | no | Module filter |
| `condition` | string | no | Breakpoint condition expression |
| `oneShot` | boolean | no | Auto-delete after first hit |

### `bazel_ios_lldb_backtrace`

Print the call stack.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `sessionId` | string | yes | LLDB session ID |
| `thread` | number | no | Thread index (default: current thread) |
| `all` | boolean | no | Show backtrace for all threads |

### `bazel_ios_lldb_variables`

Inspect local variables, arguments, or both.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `sessionId` | string | yes | LLDB session ID |
| `scope` | string | no | `local`, `args`, or `all` (default: `all`) |
| `frame` | number | no | Stack frame index (default: current frame) |

### `bazel_ios_lldb_expression`

Evaluate an expression in the current frame context.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `sessionId` | string | yes | LLDB session ID |
| `expression` | string | yes | Expression to evaluate (e.g. `self.view.frame`) |

### `bazel_ios_lldb_step`

Step execution control.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `sessionId` | string | yes | LLDB session ID |
| `action` | string | yes | `over`, `into`, `out`, or `continue` |

### `bazel_ios_lldb_threads`

List threads or select a thread/frame.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `sessionId` | string | yes | LLDB session ID |
| `selectThread` | number | no | Thread index to select |
| `selectFrame` | number | no | Frame index to select |

### `bazel_ios_lldb_command`

Send a raw LLDB command.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `sessionId` | string | yes | LLDB session ID |
| `command` | string | yes | Raw LLDB command string |

### `bazel_ios_lldb_sessions`

List all active LLDB debug sessions.

No parameters.

## CLI

```sh
xcodebazelmcp lldb-attach --process-name MyApp --wait-for
xcodebazelmcp lldb-attach --pid 12345
xcodebazelmcp lldb-detach --session-id <id>
xcodebazelmcp lldb-break --session-id <id> --action set --file main.swift --line 42
xcodebazelmcp lldb-break --session-id <id> --action set --symbol viewDidLoad
xcodebazelmcp lldb-break --session-id <id> --action list
xcodebazelmcp lldb-bt --session-id <id>
xcodebazelmcp lldb-bt --session-id <id> --all
xcodebazelmcp lldb-vars --session-id <id> --scope local
xcodebazelmcp lldb-expr --session-id <id> --expression "self.title"
xcodebazelmcp lldb-step --session-id <id> --action over
xcodebazelmcp lldb-threads --session-id <id>
xcodebazelmcp lldb-cmd --session-id <id> --command "memory read 0x1000"
xcodebazelmcp lldb-sessions
```

## Implementation

- Spawns `xcrun lldb` as a child process per session. Each session is stored in an in-memory session map keyed by a generated session ID.
- Commands are written to the LLDB process stdin; output is captured by scanning for custom delimiters `__XBMCP_BEGIN__` and `__XBMCP_END__` injected via `script` commands, ensuring reliable output parsing even with multi-line results.
- Sessions are cleaned up on detach or when the LLDB process exits.
- `lldb-sessions` reports all active sessions with their PID, process name, and session ID.
