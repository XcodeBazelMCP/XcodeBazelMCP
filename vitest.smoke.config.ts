import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/smoke-tests/**/*.test.ts'],
  },
});
