import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/index.ts'],
      reporter: ['text', 'text-summary', 'lcov'],
      thresholds: {
        'src/core/scaffold.ts': { statements: 80 },
        'src/core/workflows.ts': { statements: 80 },
        'src/core/workspace.ts': { statements: 80 },
        'src/core/bazel.ts': { statements: 60 },
        'src/core/upgrade.ts': { statements: 50 },
        'src/runtime/config.ts': { statements: 70 },
        'src/utils/output.ts': { statements: 80 },
        'src/tools/bazel-tools.ts': { statements: 80 },
        'src/tools/helpers.ts': { statements: 80 },
      },
    },
  },
});
