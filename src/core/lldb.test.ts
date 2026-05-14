import { describe, expect, it } from 'vitest';
import { getSession, listSessions } from './lldb.js';

describe('LLDB session management', () => {
  it('throws for unknown session ID', () => {
    expect(() => getSession('lldb-nonexistent')).toThrow('Unknown LLDB session');
  });

  it('returns empty list when no sessions active', () => {
    const sessions = listSessions();
    expect(sessions).toEqual([]);
  });
});
