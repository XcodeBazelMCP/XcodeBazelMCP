import { describe, expect, it } from 'vitest';
import { WORKFLOWS, getEnabledToolNames, validateWorkflowIds, compactToolSchema } from './workflows.js';

describe('Workflows', () => {
  it('defines at least 15 workflow categories', () => {
    expect(WORKFLOWS.length).toBeGreaterThanOrEqual(15);
  });

  it('every workflow has a unique id', () => {
    const ids = WORKFLOWS.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every workflow has at least one tool', () => {
    for (const wf of WORKFLOWS) {
      expect(wf.tools.length, `${wf.id} should have tools`).toBeGreaterThan(0);
    }
  });

  it('validates known workflow IDs', () => {
    expect(() => validateWorkflowIds(['build', 'test'])).not.toThrow();
  });

  it('rejects unknown workflow IDs', () => {
    expect(() => validateWorkflowIds(['build', 'nonexistent'])).toThrow('Unknown workflow IDs: nonexistent');
  });

  it('returns null when no filter is active', () => {
    expect(getEnabledToolNames(undefined)).toBeNull();
    expect(getEnabledToolNames([])).toBeNull();
  });

  it('returns only tools from enabled workflows', () => {
    const enabled = getEnabledToolNames(['build']);
    expect(enabled).not.toBeNull();
    expect(enabled!.has('bazel_ios_build')).toBe(true);
    expect(enabled!.has('bazel_ios_build_and_run')).toBe(true);
    expect(enabled!.has('bazel_ios_test')).toBe(false);
    // workflow discovery tools are always included
    expect(enabled!.has('bazel_list_workflows')).toBe(true);
    expect(enabled!.has('bazel_toggle_workflow')).toBe(true);
  });

  it('includes multiple workflows', () => {
    const enabled = getEnabledToolNames(['build', 'test', 'macos']);
    expect(enabled).not.toBeNull();
    expect(enabled!.has('bazel_ios_build')).toBe(true);
    expect(enabled!.has('bazel_ios_test')).toBe(true);
    expect(enabled!.has('bazel_macos_build')).toBe(true);
    expect(enabled!.has('bazel_ios_tap')).toBe(false);
  });
});

describe('compactToolSchema', () => {
  it('strips description from properties while keeping other fields', () => {
    const tool = {
      name: 'my_tool',
      description: 'Does stuff',
      inputSchema: {
        type: 'object',
        properties: {
          target: { type: 'string', description: 'The build target', default: '//...' },
          verbose: { type: 'boolean', description: 'Enable verbose output' },
        },
      },
    };
    const result = compactToolSchema(tool);
    expect(result.inputSchema.properties).toEqual({
      target: { type: 'string', default: '//...' },
      verbose: { type: 'boolean' },
    });
  });

  it('preserves schema with no properties', () => {
    const tool = {
      name: 'no_props',
      description: 'No props tool',
      inputSchema: { type: 'object' },
    };
    const result = compactToolSchema(tool);
    expect(result.inputSchema).toEqual({ type: 'object' });
  });

  it('preserves name and description of the tool itself', () => {
    const tool = {
      name: 'keep_me',
      description: 'Important tool description',
      inputSchema: {
        type: 'object',
        properties: {
          arg: { type: 'string', description: 'removed' },
        },
      },
    };
    const result = compactToolSchema(tool);
    expect(result.name).toBe('keep_me');
    expect(result.description).toBe('Important tool description');
  });
});
