import { describe, expect, it } from 'vitest';
import { resolveDevice } from './devices.js';

describe('resolveDevice error paths', () => {
  it('throws when deviceId is not found', async () => {
    await expect(resolveDevice({ deviceId: 'nonexistent-uuid' })).rejects.toThrow(
      /not found/,
    );
  }, 15_000);

  it('throws when deviceName is not found', async () => {
    await expect(resolveDevice({ deviceName: 'Nonexistent Phone' })).rejects.toThrow(
      /not found/,
    );
  }, 15_000);
});
