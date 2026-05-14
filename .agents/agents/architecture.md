# Architecture

## Overview

Bazel-first MCP server + CLI for iOS, modeled after `getsentry/XcodeBuildMCP` but swapping `xcodebuild` for `bazel`.

## Entry Points

- `src/cli.ts` — CLI + MCP via `mcp` subcommand (~400 lines, thin dispatcher)
- `src/doctor-cli.ts` — standalone health check

## Module Layout

### Tools

- `src/tools/bazel-tools.ts` — thin orchestrator (~33 lines), aggregates definitions from all handler modules and dispatches `callBazelTool` to the matching handler.
- `src/tools/helpers.ts` — shared state (log captures, video recordings, device log captures) and utilities (`applyDefaults`, `resolveSimulatorFromArgs`, `prependWarning`, `stringOrUndefined`, `numberOrUndefined`).
- `src/tools/streaming.ts` — streaming tool logic and post-build actions, separated from main dispatch.
- `src/tools/handlers/` — 10 domain-specific files, each exports `definitions`, `canHandle()`, and `handle()`:
  - `session.ts`, `build.ts`, `simulator.ts`, `device.ts`, `lldb.ts`, `macos.ts`, `multi-platform.ts`, `spm.ts`, `scaffold.ts`, `ui-automation.ts`

### CLI

- `src/cli/parsers.ts` — 48 parse functions (~730 lines)
- `src/cli/commands.ts` — `runUpgrade`, `runDaemon`, etc. (~240 lines)
- `src/cli/help.ts` — `printHelp` (~160 lines)

### Core

- `src/core/bazel.ts` — arg builders, `runBazel`, label validation, query sanitization
- `src/core/simulators.ts` — simctl wrappers
- `src/core/workspace.ts` — workspace validation, BSP

### Runtime & Config

- `src/runtime/config.ts` — env vars `BAZEL_IOS_WORKSPACE`, `BAZEL_PATH`, `BAZEL_IOS_MCP_MAX_OUTPUT`, plus `.xcodebazelmcp/config.yaml` loading (workspace or `~/.xcodebazelmcp/`).
- Custom lightweight YAML parser: handles flat key-value and nested `profiles:` blocks without external deps. Cannot handle values containing `: ` (splits on first occurrence).

### Process Execution

- `src/utils/process.ts` — `spawn` (no shell) with timeout + output cap. All Bazel commands go through `runBazel` which tracks `lastCommand`.
- `runCommandStreaming` is an `AsyncGenerator<StreamChunk | CommandResult>` — yields `{ stream: 'stdout'|'stderr', data }` chunks, then the final `CommandResult`.

## Tool Count

112 tools across 19 workflow categories: `build`, `test`, `simulator`, `app_lifecycle`, `capture`, `ui_automation`, `deep_links`, `device`, `lldb`, `macos`, `tvos`, `watchos`, `visionos`, `spm`, `project`, `scaffold`, `session`, `daemon`, `update`.

## Workflow Discovery & Token Optimization

- `enabledWorkflows` in `config.yaml` controls which tool categories are advertised via MCP `tools/list`.
- Smart defaults: when unconfigured, MCP advertises only 6 core workflows (~34 tools instead of 112, ~75% token reduction).
- Compact schemas: property-level `description` fields stripped from `tools/list` JSON.
- `bazel_list_workflows` and `bazel_toggle_workflow` are always included regardless of filtering.

## MCP Resources

- `xcodebazel://last-command` — most recent command result (text/plain)
- `xcodebazel://session-status` — workspace, active profile, defaults, workflow config, process stats as JSON

## Unique Value vs XcodeBuildMCP

- Bazel-native query/build/test, BSP integration (`sourcekit-bazel-bsp`), startup args on every tool, `bazel query` with sanitization, `deps`/`rdeps` query tools, monorepo profiles.
- Additional platforms: tvOS, watchOS, visionOS (4 tools each).
- Not implemented (N/A for Bazel): Xcode IDE proxy (`mcpbridge`), Xcode 26.3 agent integration, Sentry telemetry.
- Remaining: npm publish + Homebrew tap, CI/CD pipeline support (jsonl/json output modes).
