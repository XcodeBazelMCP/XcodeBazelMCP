# Workflow Discovery

Status: **Implemented**

## Overview

Two MCP tools for runtime workflow discovery and toggling. Agents can list all available workflow categories, see which tools belong to each, and enable/disable categories at runtime. When workflows are filtered, only tools from enabled workflows appear in `tools/list`, reducing noise for agents that only need a subset of capabilities.

Workflow filtering can also be configured statically via `enabledWorkflows` in `config.yaml`.

## Tools

### `bazel_list_workflows`

List all workflow categories with their tools and enabled/disabled status.

No parameters.

Returns each workflow with:
- ID, name, description
- Tool count and tool names
- Enabled status (✅ / ⛔)

### `bazel_toggle_workflow`

Enable or disable a workflow category at runtime.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Workflow ID (e.g. `build`, `test`, `device`, `macos`) or `"all"` to reset. |
| `enabled` | boolean | yes | `true` to enable, `false` to disable. |

## Workflow Categories

| ID | Name | Tools |
|---|---|---|
| `build` | iOS Build | 2 |
| `test` | iOS Test | 2 |
| `simulator` | Simulator Management | 10 |
| `app_lifecycle` | App Lifecycle | 5 |
| `capture` | Capture & Recording | 5 |
| `ui_automation` | UI Automation | 9 |
| `deep_links` | Deep Links & Push | 2 |
| `device` | Physical Device | 13 |
| `lldb` | LLDB Debugging | 10 |
| `macos` | macOS | 13 |
| `tvos` | tvOS | 4 |
| `watchos` | watchOS | 4 |
| `visionos` | visionOS | 4 |
| `spm` | Swift Package Manager | 7 |
| `project` | Project Discovery & Query | 6 |
| `scaffold` | Project Scaffolding | 2 |
| `session` | Session & Config | 7 |
| `daemon` | Per-workspace Daemon | 3 |
| `update` | Self-update | 2 |

## Config

Add `enabledWorkflows` to `.xcodebazelmcp/config.yaml` to statically control which workflows are advertised:

```yaml
enabledWorkflows: build, test, simulator, app_lifecycle, session
```

Omit or leave empty to advertise all tools (default behavior).

## CLI

```sh
xcodebazelmcp workflows                      # list all workflow categories
xcodebazelmcp toggle-workflow device off      # disable device tools
xcodebazelmcp toggle-workflow device on       # re-enable device tools
xcodebazelmcp toggle-workflow all on          # reset to all workflows
```

## Implementation

- `WORKFLOWS` is a static array of `WorkflowInfo` objects in `src/core/workflows.ts`, each mapping a category ID to a list of tool names.
- `getEnabledToolNames(enabledWorkflows)` returns a `Set<string>` of tool names from enabled workflows (or `null` if all are enabled).
- The MCP server (`src/mcp/server.ts`) filters `bazelToolDefinitions` through `getEnabledToolNames()` before responding to `tools/list`.
- `bazel_list_workflows` and `bazel_toggle_workflow` (plus `set_workspace` and `show_defaults`) are always included regardless of filtering, so the agent can always discover and toggle workflows.
- `bazel_toggle_workflow` with `id: "all"` clears the filter, restoring all tools.
