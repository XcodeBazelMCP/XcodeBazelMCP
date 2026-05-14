---
name: tool-handler-development
description: >-
  Create or modify Bazel MCP tool handlers. Use when adding new tools, editing
  tool definitions, creating handler modules, or working with files under
  src/tools/handlers/.
---

# Tool Handler Development

## Handler Contract

Every handler file under `src/tools/handlers/` must export:

```typescript
export const definitions: ToolDefinition[] = [...]
export function canHandle(name: string): boolean { ... }
export function handle(name: string, args: Record<string, unknown>): Promise<ToolResult | undefined>
```

- `canHandle` returns `true` for tool names this handler owns.
- `handle` returns `undefined` for unknown tools (not an error).
- `definitions` is an array of tool definitions with `name`, `description`, `inputSchema`, and optional `startupArgs`, `streaming`, `required` fields.

## Adding a New Tool

1. Pick the right handler file based on domain (build, simulator, device, etc.) or create a new one.
2. Add the tool definition to `definitions`.
3. Add the case to `handle()`.
4. If it's a new handler file, register it in `src/tools/bazel-tools.ts` (import + add to the aggregated arrays).
5. Update the expected tool count in `handlers/handlers.test.ts`.
6. If the tool uses Bazel commands, include `startupArgs` in the schema.

## Tool Definition Schema

```typescript
{
  name: 'bazel_ios_<action>',
  description: 'One-line description of what the tool does',
  inputSchema: {
    type: 'object',
    properties: { ... },
    required: ['target'],
  },
  startupArgs: true,    // if tool accepts --startup_arg flags
  streaming: true,      // if tool supports streaming output
}
```

## Workflow Categories

Tools belong to one of 19 workflows: `build`, `test`, `simulator`, `app_lifecycle`, `capture`, `ui_automation`, `deep_links`, `device`, `lldb`, `macos`, `tvos`, `watchos`, `visionos`, `spm`, `project`, `scaffold`, `session`, `daemon`, `update`.

Assign the workflow in the handler or the workflow mapping. `bazel_list_workflows` and `bazel_toggle_workflow` are always included regardless of filtering.

## Common Patterns

- Use `asStringArray(args.configs, 'configs')` for array params — don't double-wrap with `configArgs()`.
- Use `resolveSimulatorFromArgs(args)` for simulator resolution (returns `{ sim, warning }`).
- Use `prependWarning(message, warning)` to attach resolution warnings to output.
- Wrap `readBundleId` calls in try/catch — they can throw after a successful build+install.
- Escape quotes in `--predicate` strings: `.replace(/"/g, '\\"')` on interpolated values.

## Testing

- Tool name ordering in tests must use `.sort()` — import order across modules is not guaranteed.
- Add the new tool name to `bazel-tools.test.ts` expected set.
- Many handlers shell out to external tools — E2E testing against `example_projects/BazelApp` is the primary validation.
