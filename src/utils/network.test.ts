import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ensureOnlineOrNotify } from './network';

describe('ensureOnlineOrNotify', () => {
  const originalNavigator = window.navigator;

  afterEach(() => {
    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it('returns false and notifies when offline', () => {
    Object.defineProperty(window, 'navigator', {
      value: { onLine: false },
      configurable: true,
    });

    const notify = vi.fn();

    expect(ensureOnlineOrNotify(notify)).toBe(false);
    expect(notify).toHaveBeenCalledWith('Harus online untuk melakukan perubahan');
  });

  it('returns true when online', () => {
    Object.defineProperty(window, 'navigator', {
      value: { onLine: true },
      configurable: true,
    });

    const notify = vi.fn();

    expect(ensureOnlineOrNotify(notify)).toBe(true);
    expect(notify).not.toHaveBeenCalled();
  });

  it('does not crash when navigator is unavailable', () => {
    Object.defineProperty(window, 'navigator', {
      value: undefined,
      configurable: true,
    });

    const notify = vi.fn();

    expect(() => ensureOnlineOrNotify(notify)).not.toThrow();
    expect(ensureOnlineOrNotify(notify)).toBe(false);
    expect(notify).toHaveBeenCalledWith('Harus online untuk melakukan perubahan');
  });
});
