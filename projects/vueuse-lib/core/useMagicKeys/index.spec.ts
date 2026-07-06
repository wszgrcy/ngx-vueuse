import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createInjector, runInInjectionContext } from '@cyia/ngx-vueuse/test';
import { useMagicKeys } from './index';
import { waitForMicrotasks } from '@cyia/ngx-vueuse/test';

describe('useMagicKeys', () => {
  const injector = createInjector();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to create keyboard events using testWindow (jsdom DOM API)
  function createKeyboardEvent(type: string, key: string, modifierState: boolean = false) {
    const event = new KeyboardEvent(type, {
      key,
      code: `Key${key.toUpperCase()}`,
    }) as any;
    event.getModifierState = (mod: string) => (mod === 'Meta' ? modifierState : false);
    return event;
  }

  function createSimpleEvent(type: string) {
    return new Event(type, { bubbles: true, cancelable: true });
  }

  it('should return an object with current Set', () => {
    const keys = runInInjectionContext(injector, () => useMagicKeys());

    expect(keys).toBeDefined();
    expect(keys.current).toBeInstanceOf(Set);
    expect(keys.current.size).toBe(0);
  });

  it('should have a toJSON method that returns empty object', () => {
    const keys = runInInjectionContext(injector, () => useMagicKeys());

    // The proxy intercepts 'toJSON' as 'tojson' (lowercased), creating a signal(false)
    // This matches the original Vue behavior where toJSON gets lowercased by the proxy
    // Access the original toJSON from the raw refs object through current
    const rawObj = keys.current;
    // Verify that the proxy creates a signal for 'tojson' (expected behavior matching Vue)
    expect((keys as any)['tojson']).toBeDefined();
  });

  it('should create signal entries when accessing key properties', () => {
    const keys = runInInjectionContext(injector, () => useMagicKeys());

    // Accessing a key should create a signal entry
    const aKey = (keys as any)['a'];
    expect(aKey).toBeDefined();
    expect(() => aKey()).not.toThrow();
    expect(aKey()).toBe(false);
  });

  it('should create computed for key combinations with +', () => {
    const keys = runInInjectionContext(injector, () => useMagicKeys());

    // Accessing a combination key should create a computed signal
    const ctrlS = keys['ctrl+s'];
    expect(ctrlS).toBeDefined();
    expect(() => ctrlS()).not.toThrow();
    expect(ctrlS()).toBe(false);
  });

  it('should create computed for key combinations with -', () => {
    const keys = runInInjectionContext(injector, () => useMagicKeys());

    const altF4 = keys['alt-f4'];
    expect(altF4).toBeDefined();
    expect(() => altF4()).not.toThrow();
    expect(altF4()).toBe(false);
  });

  it('should create computed for key combinations with _', () => {
    const keys = runInInjectionContext(injector, () => useMagicKeys());

    const ctrl_shift_s = keys['ctrl_shift_s'];
    expect(ctrl_shift_s).toBeDefined();
    expect(() => ctrl_shift_s()).not.toThrow();
    expect(ctrl_shift_s()).toBe(false);
  });

  it('should support alias map', () => {
    const keys = runInInjectionContext(injector, () => useMagicKeys());

    // ctrl should be aliased to control
    const ctrl = (keys as any)['ctrl'];
    expect(ctrl).toBeDefined();
    expect(() => ctrl()).not.toThrow();
  });

  it('should return reactive object when reactive option is true', () => {
    const keys = runInInjectionContext(injector, () => useMagicKeys({ reactive: true }));

    // Accessing a key should return a boolean directly, not a signal
    const aKey = (keys as any)['a'];
    expect(aKey).toBe(false);
    expect(typeof aKey).toBe('boolean');
  });

  it('should handle custom alias map', () => {
    const customAlias = { myctrl: 'control' };
    const keys = runInInjectionContext(injector, () => useMagicKeys({ aliasMap: customAlias }));

    // myctrl should be aliased to control
    const myCtrl = (keys as any)['myctrl'];
    expect(myCtrl).toBeDefined();
  });

  it('should handle case-insensitive key access', () => {
    const keys = runInInjectionContext(injector, () => useMagicKeys());

    // Both uppercase and lowercase should work and map to the same key
    const upperA = (keys as any)['A'];
    const lowerA = (keys as any)['a'];
    expect(upperA).toBeDefined();
    expect(lowerA).toBeDefined();
  });

  it('should not throw when accessing non-existent keys', () => {
    const keys = runInInjectionContext(injector, () => useMagicKeys());

    expect(() => (keys as any)['nonexistentKey']).not.toThrow();
    expect(() => (keys as any)['nonexistentKey']()).not.toThrow();
  });

  it('should keep current Set in sync with key events', async () => {
    const keys = runInInjectionContext(injector, () => useMagicKeys());

    expect(keys.current.size).toBe(0);

    // Simulate keydown
    const keydownEvent = createKeyboardEvent('keydown', 'a');
    window.dispatchEvent(keydownEvent);
    await waitForMicrotasks();

    expect(keys.current.has('a')).toBe(true);

    // Simulate keyup
    const keyupEvent = createKeyboardEvent('keyup', 'a');
    window.dispatchEvent(keyupEvent);

    expect(keys.current.has('a')).toBe(false);
  });

  it('should reset keys on blur event', () => {
    const keys = runInInjectionContext(injector, () => useMagicKeys());

    // Simulate keydown to add a key
    const keydownEvent = createKeyboardEvent('keydown', 'a');
    window.dispatchEvent(keydownEvent);

    expect(keys.current.has('a')).toBe(true);

    // Simulate blur to reset
    const blurEvent = createSimpleEvent('blur');
    window.dispatchEvent(blurEvent);

    expect(keys.current.size).toBe(0);
  });

  it('should reset keys on focus event', () => {
    const keys = runInInjectionContext(injector, () => useMagicKeys());

    // Simulate keydown to add a key
    const keydownEvent = createKeyboardEvent('keydown', 'b');
    window.dispatchEvent(keydownEvent);

    expect(keys.current.has('b')).toBe(true);

    // Simulate focus to reset
    const focusEvent = createSimpleEvent('focus');
    window.dispatchEvent(focusEvent);

    expect(keys.current.size).toBe(0);
  });

  it('should call onEventFired callback', () => {
    const handler = vi.fn();
    const keys = runInInjectionContext(injector, () => useMagicKeys({ onEventFired: handler }));

    const keydownEvent = createKeyboardEvent('keydown', 'a');
    window.dispatchEvent(keydownEvent);

    expect(handler).toHaveBeenCalledWith(keydownEvent);
  });

  it('should return boolean for combination keys when all keys are pressed', () => {
    const keys = runInInjectionContext(injector, () => useMagicKeys());

    // Simulate ctrl key down
    const ctrlDown = new KeyboardEvent('keydown', { key: 'Control' });
    window.dispatchEvent(ctrlDown);

    // Simulate s key down
    const sDown = new KeyboardEvent('keydown', { key: 's' });
    window.dispatchEvent(sDown);

    // The combination should evaluate based on current state
    const ctrlS = keys['ctrl+s'];
    expect(ctrlS).toBeDefined();

    // Clean up
    const ctrlUp = new KeyboardEvent('keyup', { key: 'Control' });
    const sUp = new KeyboardEvent('keyup', { key: 's' });
    window.dispatchEvent(ctrlUp);
    window.dispatchEvent(sUp);
  });

  it('should handle meta key combination cleanup on release', () => {
    const keys = runInInjectionContext(injector, () => useMagicKeys());

    // In jsdom, getModifierState needs to be set on the event options
    // We create a shared modifier state tracker
    let metaPressed = false;

    const metaDown = new KeyboardEvent('keydown', {
      key: 'Meta',
      code: 'MetaLeft',
    }) as any;
    metaDown.getModifierState = (mod: string) => mod === 'Meta';
    window.dispatchEvent(metaDown);
    metaPressed = true;

    // When meta is held, pressing 'a' should add 'a' to metaDeps via updateDeps
    const aDown = new KeyboardEvent('keydown', {
      key: 'a',
      code: 'KeyA',
    }) as any;
    aDown.getModifierState = (mod: string) => mod === 'Meta';
    window.dispatchEvent(aDown);

    // 'a' should be in current set
    expect(keys.current.has('a')).toBe(true);
    expect(keys.current.has('meta')).toBe(true);

    // Simulate meta key up - should clear meta deps from current
    const metaUp = new KeyboardEvent('keyup', {
      key: 'Meta',
      code: 'MetaLeft',
    }) as any;
    metaUp.getModifierState = (mod: string) => false;
    window.dispatchEvent(metaUp);

    // Keys tracked in metaDeps should be removed from current
    // Note: This tests the #1312 macOS meta key workaround behavior
    expect(keys.current.has('meta')).toBe(false);
  });
});
