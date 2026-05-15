import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CommandResult } from '../types/index.js';

const mockRunCommand = vi.hoisted(() => vi.fn());

vi.mock('../utils/process.js', () => ({
  runCommand: mockRunCommand,
}));

const mockSuccess: CommandResult = {
  command: 'idb',
  args: [],
  exitCode: 0,
  output: '',
  durationMs: 10,
  truncated: false,
};

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  delete process.env.IDB_PATH;
  ({
    simulatorAccessibilitySnapshot,
    simulatorDoubleTap,
    simulatorDrag,
    simulatorKeyPress,
    simulatorLongPress,
    simulatorPinch,
    simulatorSwipe,
    simulatorTap,
    simulatorTypeText,
  } = await ui());
});

async function ui() {
  return import('./ui-interaction.js');
}

type UiModule = Awaited<ReturnType<typeof ui>>;
let simulatorAccessibilitySnapshot: UiModule['simulatorAccessibilitySnapshot'];
let simulatorDoubleTap: UiModule['simulatorDoubleTap'];
let simulatorDrag: UiModule['simulatorDrag'];
let simulatorKeyPress: UiModule['simulatorKeyPress'];
let simulatorLongPress: UiModule['simulatorLongPress'];
let simulatorPinch: UiModule['simulatorPinch'];
let simulatorSwipe: UiModule['simulatorSwipe'];
let simulatorTap: UiModule['simulatorTap'];
let simulatorTypeText: UiModule['simulatorTypeText'];

describe('swipeDirectionFromString', () => {
  it('accepts valid directions', async () => {
    const { swipeDirectionFromString } = await ui();
    expect(swipeDirectionFromString('up')).toBe('up');
    expect(swipeDirectionFromString('down')).toBe('down');
    expect(swipeDirectionFromString('left')).toBe('left');
    expect(swipeDirectionFromString('right')).toBe('right');
  });

  it('is case-insensitive', async () => {
    const { swipeDirectionFromString } = await ui();
    expect(swipeDirectionFromString('UP')).toBe('up');
    expect(swipeDirectionFromString('Down')).toBe('down');
    expect(swipeDirectionFromString('LEFT')).toBe('left');
  });

  it('throws on invalid direction', async () => {
    const { swipeDirectionFromString } = await ui();
    expect(() => swipeDirectionFromString('diagonal')).toThrow('Invalid swipe direction');
    expect(() => swipeDirectionFromString('')).toThrow('Invalid swipe direction');
  });
});

describe('simulatorTap', () => {
  it('uses idb when available', async () => {
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, command: 'which', output: '/usr/local/bin/idb' });
    mockRunCommand.mockResolvedValueOnce(mockSuccess);

    await simulatorTap({ simulatorUdid: 'ABC-123', x: 100, y: 200 });

    expect(mockRunCommand).toHaveBeenCalledWith('which', ['idb'], expect.any(Object));
    expect(mockRunCommand).toHaveBeenCalledWith('/usr/local/bin/idb', ['ui', 'tap', '--udid', 'ABC-123', '--', '100', '200'], expect.any(Object));
  });

  it('falls back to swift when idb not available', async () => {
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, command: 'which', exitCode: 1, output: '' });
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, command: 'swift' });

    await simulatorTap({ simulatorUdid: 'ABC-123', x: 100, y: 200 });

    expect(mockRunCommand).toHaveBeenCalledWith('swift', ['-e', expect.stringContaining('tap(100, 200)')], expect.any(Object));
  });
});

describe('simulatorDoubleTap', () => {
  it('uses idb when available', async () => {
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, command: 'which', output: '/usr/local/bin/idb' });
    mockRunCommand.mockResolvedValueOnce(mockSuccess);
    mockRunCommand.mockResolvedValueOnce(mockSuccess);

    await simulatorDoubleTap({ simulatorUdid: 'ABC-123', x: 100, y: 200 });

    expect(mockRunCommand).toHaveBeenCalledWith('/usr/local/bin/idb', ['ui', 'tap', '--udid', 'ABC-123', '--', '100', '200'], expect.any(Object));
    expect(mockRunCommand).toHaveBeenCalledTimes(3);
  });

  it('falls back to swift when idb not available', async () => {
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, command: 'which', exitCode: 1, output: '' });
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, command: 'swift' });

    await simulatorDoubleTap({ simulatorUdid: 'ABC-123', x: 100, y: 200 });

    expect(mockRunCommand).toHaveBeenCalledWith('swift', ['-e', expect.stringMatching(/tap\(100, 200\).*tap\(100, 200\)/s)], expect.any(Object));
  });
});

describe('simulatorLongPress', () => {
  it('uses idb with duration', async () => {
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, command: 'which', output: '/usr/local/bin/idb' });
    mockRunCommand.mockResolvedValueOnce(mockSuccess);

    await simulatorLongPress({ simulatorUdid: 'ABC-123', x: 100, y: 200, durationSeconds: 2.5 });

    expect(mockRunCommand).toHaveBeenCalledWith('/usr/local/bin/idb', ['ui', 'tap', '--udid', 'ABC-123', '--duration', '2.5', '--', '100', '200'], expect.any(Object));
  });

  it('defaults to 1 second duration', async () => {
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, command: 'which', output: '/usr/local/bin/idb' });
    mockRunCommand.mockResolvedValueOnce(mockSuccess);

    await simulatorLongPress({ simulatorUdid: 'ABC-123', x: 100, y: 200 });

    expect(mockRunCommand).toHaveBeenCalledWith('/usr/local/bin/idb', expect.arrayContaining(['--duration', '1']), expect.any(Object));
  });

  it('falls back to swift', async () => {
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, command: 'which', exitCode: 1, output: '' });
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, command: 'swift' });

    await simulatorLongPress({ simulatorUdid: 'ABC-123', x: 100, y: 200, durationSeconds: 1.5 });

    expect(mockRunCommand).toHaveBeenCalledWith('swift', ['-e', expect.stringContaining('usleep(1500000)')], expect.any(Object));
  });
});

describe('simulatorSwipe', () => {
  it('uses idb for swipe up', async () => {
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, command: 'which', output: '/usr/local/bin/idb' });
    mockRunCommand.mockResolvedValueOnce(mockSuccess);

    await simulatorSwipe({ simulatorUdid: 'ABC-123', direction: 'up', x: 200, y: 400 });

    expect(mockRunCommand).toHaveBeenCalledWith('/usr/local/bin/idb', ['ui', 'swipe', '--udid', 'ABC-123', '--', '200', '550', '200', '250'], expect.any(Object));
  });

  it('uses idb for swipe down', async () => {
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, command: 'which', output: '/usr/local/bin/idb' });
    mockRunCommand.mockResolvedValueOnce(mockSuccess);

    await simulatorSwipe({ simulatorUdid: 'ABC-123', direction: 'down' });

    expect(mockRunCommand).toHaveBeenCalledWith('/usr/local/bin/idb', ['ui', 'swipe', '--udid', 'ABC-123', '--', '200', '250', '200', '550'], expect.any(Object));
  });

  it('uses idb for swipe left', async () => {
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, command: 'which', output: '/usr/local/bin/idb' });
    mockRunCommand.mockResolvedValueOnce(mockSuccess);

    await simulatorSwipe({ simulatorUdid: 'ABC-123', direction: 'left' });

    expect(mockRunCommand).toHaveBeenCalledWith('/usr/local/bin/idb', ['ui', 'swipe', '--udid', 'ABC-123', '--', '350', '400', '50', '400'], expect.any(Object));
  });

  it('uses idb for swipe right', async () => {
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, command: 'which', output: '/usr/local/bin/idb' });
    mockRunCommand.mockResolvedValueOnce(mockSuccess);

    await simulatorSwipe({ simulatorUdid: 'ABC-123', direction: 'right' });

    expect(mockRunCommand).toHaveBeenCalledWith('/usr/local/bin/idb', ['ui', 'swipe', '--udid', 'ABC-123', '--', '50', '400', '350', '400'], expect.any(Object));
  });

  it('falls back to swift', async () => {
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, command: 'which', exitCode: 1, output: '' });
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, command: 'swift' });

    await simulatorSwipe({ simulatorUdid: 'ABC-123', direction: 'up' });

    expect(mockRunCommand).toHaveBeenCalledWith('swift', ['-e', expect.stringContaining('drag(')], expect.any(Object));
  });
});

describe('simulatorPinch', () => {
  it('uses swift fallback for pinch', async () => {
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, command: 'swift' });

    await simulatorPinch({ simulatorUdid: 'ABC-123', x: 100, y: 200, scale: 2.0 });

    expect(mockRunCommand).toHaveBeenCalledWith('swift', ['-e', expect.stringContaining('tap(100, 200)')], expect.any(Object));
  });
});

describe('simulatorTypeText', () => {
  it('uses idb when available', async () => {
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, command: 'which', output: '/usr/local/bin/idb' });
    mockRunCommand.mockResolvedValueOnce(mockSuccess);

    await simulatorTypeText({ simulatorUdid: 'ABC-123', text: 'Hello World' });

    expect(mockRunCommand).toHaveBeenCalledWith('/usr/local/bin/idb', ['ui', 'text', '--udid', 'ABC-123', '--', 'Hello World'], expect.any(Object));
  });

  it('falls back to osascript', async () => {
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, command: 'which', exitCode: 1, output: '' });
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, command: 'osascript' });

    await simulatorTypeText({ simulatorUdid: 'ABC-123', text: 'Hello World' });

    expect(mockRunCommand).toHaveBeenCalledWith('osascript', ['-e', expect.stringContaining('keystroke "Hello World"')], expect.any(Object));
  });

  it('escapes special characters in osascript fallback', async () => {
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, command: 'which', exitCode: 1, output: '' });
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, command: 'osascript' });

    await simulatorTypeText({ simulatorUdid: 'ABC-123', text: 'Hello "World"' });

    expect(mockRunCommand).toHaveBeenCalledWith('osascript', ['-e', expect.stringContaining('Hello \\"World\\"')], expect.any(Object));
  });
});

describe('simulatorKeyPress', () => {
  it('uses idb for Return key', async () => {
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, command: 'which', output: '/usr/local/bin/idb' });
    mockRunCommand.mockResolvedValueOnce(mockSuccess);

    await simulatorKeyPress({ simulatorUdid: 'ABC-123', key: 'Return' });

    expect(mockRunCommand).toHaveBeenCalledWith('/usr/local/bin/idb', ['ui', 'key', '--udid', 'ABC-123', '--', '40'], expect.any(Object));
  });

  it('uses idb for Home button', async () => {
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, command: 'which', output: '/usr/local/bin/idb' });
    mockRunCommand.mockResolvedValueOnce(mockSuccess);

    await simulatorKeyPress({ simulatorUdid: 'ABC-123', key: 'Home' });

    expect(mockRunCommand).toHaveBeenCalledWith('/usr/local/bin/idb', ['ui', 'button', '--udid', 'ABC-123', '--', 'HOME'], expect.any(Object));
  });

  it('uses idb text for unmapped keys', async () => {
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, command: 'which', output: '/usr/local/bin/idb' });
    mockRunCommand.mockResolvedValueOnce(mockSuccess);

    await simulatorKeyPress({ simulatorUdid: 'ABC-123', key: 'a' });

    expect(mockRunCommand).toHaveBeenCalledWith('/usr/local/bin/idb', ['ui', 'text', '--udid', 'ABC-123', '--', 'a'], expect.any(Object));
  });

  it('falls back to osascript for Home key', async () => {
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, command: 'which', exitCode: 1, output: '' });
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, command: 'osascript' });

    await simulatorKeyPress({ simulatorUdid: 'ABC-123', key: 'Home' });

    expect(mockRunCommand).toHaveBeenCalledWith('osascript', ['-e', expect.stringContaining('key code 115')], expect.any(Object));
  });

  it('falls back to osascript for mapped keys', async () => {
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, command: 'which', exitCode: 1, output: '' });
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, command: 'osascript' });

    await simulatorKeyPress({ simulatorUdid: 'ABC-123', key: 'Return' });

    expect(mockRunCommand).toHaveBeenCalledWith('osascript', ['-e', expect.stringContaining('key code 36')], expect.any(Object));
  });

  it('falls back to osascript keystroke for unmapped keys', async () => {
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, command: 'which', exitCode: 1, output: '' });
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, command: 'osascript' });

    await simulatorKeyPress({ simulatorUdid: 'ABC-123', key: 'a' });

    expect(mockRunCommand).toHaveBeenCalledWith('osascript', ['-e', expect.stringContaining('keystroke "a"')], expect.any(Object));
  });
});

describe('simulatorDrag', () => {
  it('uses idb when available', async () => {
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, command: 'which', output: '/usr/local/bin/idb' });
    mockRunCommand.mockResolvedValueOnce(mockSuccess);

    await simulatorDrag({ simulatorUdid: 'ABC-123', fromX: 100, fromY: 200, toX: 300, toY: 400, durationSeconds: 1.0 });

    expect(mockRunCommand).toHaveBeenCalledWith('/usr/local/bin/idb', ['ui', 'swipe', '--udid', 'ABC-123', '--duration', '1', '--', '100', '200', '300', '400'], expect.any(Object));
  });

  it('defaults to 0.5 second duration', async () => {
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, command: 'which', output: '/usr/local/bin/idb' });
    mockRunCommand.mockResolvedValueOnce(mockSuccess);

    await simulatorDrag({ simulatorUdid: 'ABC-123', fromX: 100, fromY: 200, toX: 300, toY: 400 });

    expect(mockRunCommand).toHaveBeenCalledWith('/usr/local/bin/idb', expect.arrayContaining(['--duration', '0.5']), expect.any(Object));
  });

  it('falls back to swift', async () => {
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, command: 'which', exitCode: 1, output: '' });
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, command: 'swift' });

    await simulatorDrag({ simulatorUdid: 'ABC-123', fromX: 100, fromY: 200, toX: 300, toY: 400 });

    expect(mockRunCommand).toHaveBeenCalledWith('swift', ['-e', expect.stringContaining('drag(100, 200, 300, 400')], expect.any(Object));
  });
});

describe('simulatorAccessibilitySnapshot', () => {
  it('uses idb describe-all when available', async () => {
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, command: 'which', output: '/usr/local/bin/idb' });
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, output: 'accessibility tree' });

    const result = await simulatorAccessibilitySnapshot('ABC-123');

    expect(mockRunCommand).toHaveBeenCalledWith('/usr/local/bin/idb', ['ui', 'describe-all', '--udid', 'ABC-123'], expect.any(Object));
    expect(result.tree).toBe('accessibility tree');
  });

  it('returns undefined tree on idb error', async () => {
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, command: 'which', output: '/usr/local/bin/idb' });
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, exitCode: 1, output: 'error' });

    const result = await simulatorAccessibilitySnapshot('ABC-123');

    expect(result.tree).toBeUndefined();
  });

  it('falls back to xcrun simctl listapps', async () => {
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, command: 'which', exitCode: 1, output: '' });
    mockRunCommand.mockResolvedValueOnce({ ...mockSuccess, command: 'xcrun', output: 'com.example.App\ncom.example.App2' });

    const result = await simulatorAccessibilitySnapshot('ABC-123');

    expect(mockRunCommand).toHaveBeenCalledWith('xcrun', ['simctl', 'listapps', 'ABC-123'], expect.any(Object));
    expect(result.tree).toContain('Installed apps');
  });
});
