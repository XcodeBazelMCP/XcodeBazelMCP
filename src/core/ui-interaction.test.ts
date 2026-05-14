import { describe, expect, it } from 'vitest';
import { swipeDirectionFromString } from './ui-interaction.js';

describe('swipeDirectionFromString', () => {
  it('accepts valid directions', () => {
    expect(swipeDirectionFromString('up')).toBe('up');
    expect(swipeDirectionFromString('down')).toBe('down');
    expect(swipeDirectionFromString('left')).toBe('left');
    expect(swipeDirectionFromString('right')).toBe('right');
  });

  it('is case-insensitive', () => {
    expect(swipeDirectionFromString('UP')).toBe('up');
    expect(swipeDirectionFromString('Down')).toBe('down');
    expect(swipeDirectionFromString('LEFT')).toBe('left');
  });

  it('throws on invalid direction', () => {
    expect(() => swipeDirectionFromString('diagonal')).toThrow('Invalid swipe direction');
    expect(() => swipeDirectionFromString('')).toThrow('Invalid swipe direction');
  });
});
