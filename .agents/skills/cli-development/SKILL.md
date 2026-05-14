---
name: cli-development
description: >-
  Develop CLI commands and parsers. Use when adding CLI subcommands, modifying
  argument parsing, working on streaming output, or editing files under
  src/cli/.
---

# CLI Development

## Conventions

- Positional arg is the target/path/bundleId. Flags use `--kebab-case`.
- Repeatable flags (`--arg`, `--config`, `--launch-arg`, `--startup-arg`) accumulate into arrays via `append()` helper.
- `printTool` is the universal CLI→MCP bridge: calls `callBazelTool`, prints text content, sets `process.exitCode` on error.
- `ToolContent` is a union type (`{ type: 'text'; text } | { type: 'resource'; ... }`). Use `extractText()` helper to safely map to `.text`.

## File Layout

| File | Responsibility |
|------|---------------|
| `src/cli.ts` | Thin dispatcher (~400 lines) |
| `src/cli/parsers.ts` | 48 parse functions (~730 lines) |
| `src/cli/commands.ts` | `runUpgrade`, `runDaemon`, etc. (~240 lines) |
| `src/cli/help.ts` | `printHelp` (~160 lines) |

## Streaming

- `--stream` flag on build/test/clean/query uses `callBazelToolStreaming` which pipes chunks directly to `process.stdout.write`.
- MCP streaming uses `notifications/progress` with `progressToken` from the client's `_meta`.
- Structured output: `toolResult()` returns both `content` (human-readable) and `structuredContent` (machine-parseable JSON with `exitCode`, `command`, `output`, `target`).

## Log Streaming

- `log-start` in CLI mode streams directly to stdout via `spawn('xcrun', [...], { stdio: ['ignore', 'inherit', 'inherit'] })` — stops on Ctrl+C.
- The MCP `log_capture_start`/`log_capture_stop` pair uses in-memory capture (server stays alive between calls).
- `sim-appearance` accepts both `--appearance dark` flag and `dark` as a positional arg.

## Session Defaults

- Session defaults are in-memory per process — don't persist across CLI invocations (each `node dist/cli.js` is a new process).
- In MCP server mode, they persist for the session.
- Profiles loaded from `config.yaml` under `profiles:` key. `activateProfile` merges profile defaults into session defaults.
- `loadConfigFile()` is lazy — called only once via a `configLoaded` guard.
