import { describe, it, expect, afterEach } from 'vitest';
import { stringOrUndefined, numberOrUndefined, prependWarning, applyDefaults } from './helpers.js';
import { clearDefaults, setDefaults } from '../runtime/config.js';

describe('stringOrUndefined', () => {
  it('returns string for string input', () => expect(stringOrUndefined('hello')).toBe('hello'));
  it('returns undefined for number', () => expect(stringOrUndefined(42)).toBeUndefined());
  it('returns undefined for boolean', () => expect(stringOrUndefined(true)).toBeUndefined());
  it('returns undefined for null', () => expect(stringOrUndefined(null)).toBeUndefined());
  it('returns undefined for undefined', () => expect(stringOrUndefined(undefined)).toBeUndefined());
  it('returns undefined for object', () => expect(stringOrUndefined({ a: 1 })).toBeUndefined());
});

describe('numberOrUndefined', () => {
  it('returns number for number input', () => expect(numberOrUndefined(42)).toBe(42));
  it('returns undefined for string', () => expect(numberOrUndefined('42')).toBeUndefined());
  it('returns undefined for boolean', () => expect(numberOrUndefined(false)).toBeUndefined());
  it('returns undefined for null', () => expect(numberOrUndefined(null)).toBeUndefined());
  it('returns undefined for undefined', () => expect(numberOrUndefined(undefined)).toBeUndefined());
});

describe('prependWarning', () => {
  it('returns message when no warning', () => expect(prependWarning('ok')).toBe('ok'));
  it('prepends warning', () => expect(prependWarning('ok', 'warn')).toBe('warn\n\nok'));
});

describe('applyDefaults', () => {
  afterEach(() => clearDefaults());

  it('returns args unchanged when no defaults set', () => {
    clearDefaults();
    const args = { target: '//app' };
    expect(applyDefaults(args)).toEqual({ target: '//app' });
  });

  it('merges target default when args.target is undefined', () => {
    setDefaults({ target: '//default' });
    expect(applyDefaults({})).toEqual({ target: '//default' });
  });

  it('does NOT override explicitly provided target', () => {
    setDefaults({ target: '//default' });
    expect(applyDefaults({ target: '//explicit' })).toEqual({ target: '//explicit' });
  });

  it('merges simulatorName', () => {
    setDefaults({ simulatorName: 'iPhone 15' });
    expect(applyDefaults({})).toEqual({ simulatorName: 'iPhone 15' });
  });

  it('merges simulatorId', () => {
    setDefaults({ simulatorId: 'ABC-123' });
    expect(applyDefaults({})).toEqual({ simulatorId: 'ABC-123' });
  });

  it('merges buildMode', () => {
    setDefaults({ buildMode: 'debug' });
    expect(applyDefaults({})).toEqual({ buildMode: 'debug' });
  });

  it('merges platform', () => {
    setDefaults({ platform: 'simulator' });
    expect(applyDefaults({})).toEqual({ platform: 'simulator' });
  });

  it('does NOT merge buildMode=none', () => {
    setDefaults({ buildMode: 'none' });
    expect(applyDefaults({})).toEqual({});
  });

  it('does NOT merge platform=none', () => {
    setDefaults({ platform: 'none' });
    expect(applyDefaults({})).toEqual({});
  });

  it('handles multiple defaults at once', () => {
    setDefaults({ target: '//app', simulatorName: 'iPhone 15', buildMode: 'debug', platform: 'simulator' });
    expect(applyDefaults({})).toEqual({
      target: '//app',
      simulatorName: 'iPhone 15',
      buildMode: 'debug',
      platform: 'simulator',
    });
  });
});
