# Testing

## Framework

230 unit tests via Vitest, coverage via `@vitest/coverage-v8`.

## Test Organization

| File | Covers |
|------|--------|
| `bazel-tools.test.ts` | Tool name set (order-independent via `.sort()`), `startupArgs` schema, `required` fields, streaming flag, unknown tool rejection |
| `handlers/handlers.test.ts` | Every handler exports non-empty `definitions`, `canHandle` correctness, `handle` returns `undefined` for unknown tools, no duplicates across handlers, total tool count (112) |
| `helpers.test.ts` | `stringOrUndefined`, `numberOrUndefined`, `prependWarning`, `applyDefaults` (default merging vs explicit arg priority) |
| `simulators.test.ts` | `findAppBundle`, `readBundleId` — uses real filesystem fixtures (`.test-fixtures/` dir, created in `beforeAll`, cleaned in `afterAll`) |
| `bazel.test.ts` | Arg builders, label validation, query sanitization, YAML config parsing (flat + nested profiles, `enabledWorkflows`, boolean/numeric values, comments, empty content, `activateProfile` errors) |
| `workspace.test.ts` | `assertBazelWorkspace` (non-existent/file/missing markers/valid), `readBspStatus` (missing dir, valid JSON, malformed JSON) |
| `upgrade.test.ts` | `upgradeHint` fallback, `compareVersions` edge cases, `detectInstallMethod` |
| MCP smoke test | Server initializes without error |

## Key Conventions

- All tests are pure unit tests — no actual Bazel builds or simulator boots in CI.
- When refactoring handlers into separate modules, tool name ordering in tests must use `.sort()` since import order is not guaranteed.
- Many tool handlers are hard to unit-test (they shell out to `bazel`, `simctl`, `devicectl`). E2E testing against `example_projects/BazelApp` is the primary validation.
- MCP JSON-RPC can be tested by piping `printf` JSON lines into `node dist/cli.js mcp`. Use `sleep` between sequential calls since the server processes sequentially.

## Known Test Infrastructure Issues

- Global mutable `config` + `configLoaded` in `runtime/config.ts` leaks state across test files. No current tests call `runBazel` or `assertBazelWorkspace` so it doesn't cause failures — watch out when adding integration tests.
- Module-level mutable counters (`logCaptureCounter`, `videoRecordingCounter`) in `helpers.ts` have no reset function. Tests share state across runs.
