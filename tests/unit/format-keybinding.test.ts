import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatKeybinding } from '../../src/renderer/core/utils/formatKeybinding.utils';

describe('formatKeybinding', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('displays CommandOrControl as Ctrl on Windows', () => {
    vi.stubGlobal('navigator', { platform: 'Win32' });

    expect(formatKeybinding('CommandOrControl+Shift+Z')).toBe('Ctrl+Shift+Z');
  });

  it('displays CommandOrControl as Command on macOS', () => {
    vi.stubGlobal('navigator', { platform: 'MacIntel' });

    expect(formatKeybinding('CommandOrControl+Shift+Z')).toBe('⌘+⇧+Z');
    expect(formatKeybinding('Control+Shift+Z')).toBe('⌃+⇧+Z');
  });
});
