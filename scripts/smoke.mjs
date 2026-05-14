import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const required = [
  'package.json',
  'server.json',
  'tsup.config.ts',
  'src/cli.ts',
  'src/doctor-cli.ts',
  'src/server/index.ts',
  'src/mcp/server.ts',
  'src/tools/bazel-tools.ts',
  'src/core/bazel.ts',
];

for (const file of required) {
  if (!existsSync(join(root, file))) {
    throw new Error(`Missing required file: ${file}`);
  }
}

const handlersDir = join(root, 'src/tools/handlers');
const handlerFiles = ['build.ts', 'session.ts', 'simulator.ts', 'device.ts'];
const allHandlerContent = handlerFiles
  .map((f) => readFileSync(join(handlersDir, f), 'utf8'))
  .join('\n');
for (const toolName of ['bazel_ios_build', 'bazel_ios_test', 'bazel_ios_discover_targets']) {
  if (!allHandlerContent.includes(toolName)) {
    throw new Error(`Missing tool: ${toolName}`);
  }
}

console.log('smoke ok');
