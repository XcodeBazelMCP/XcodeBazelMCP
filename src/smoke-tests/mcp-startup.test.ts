import { describe, expect, it } from 'vitest';
import { bazelToolDefinitions } from '../tools/index.js';

describe('MCP tool registration', () => {
  it('registers core Bazel iOS tools', () => {
    const names = bazelToolDefinitions.map((tool) => tool.name);
    expect(names).toContain('bazel_ios_build');
    expect(names).toContain('bazel_ios_test');
    expect(names).toContain('bazel_ios_discover_targets');
  });
});
