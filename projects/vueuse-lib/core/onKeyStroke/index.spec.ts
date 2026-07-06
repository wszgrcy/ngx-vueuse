import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { onKeyStroke, onKeyDown, onKeyPressed, onKeyUp } from './onKeyStroke';
import { createInjector, runInInjectionContext } from '@cyia/ngx-vueuse/test';

describe('onKeyStroke', () => {
  let callBackFn: ReturnType<typeof vi.fn>;
  let injector: ReturnType<typeof createInjector>;

  beforeEach(() => {
    callBackFn = vi.fn();
    injector = createInjector();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(onKeyStroke).toBeDefined();
  });

  it('should return a cleanup function', () => {
    const handler = vi.fn();
    const cleanup = runInInjectionContext(injector, () => onKeyStroke(handler));
    expect(typeof cleanup).toBe('function');
    cleanup();
  });

  // Note: Full keyboard event testing requires browser environment
  // The following tests are commented out because they require
  // vitest/browser userEvent or similar DOM interaction tools.
  // In a real Angular application, these would be tested with
  // TestBed and native DOM events.

  /*
  it('listen to single key', async () => {
    const cleanup = onKeyStroke('a', callBackFn)
    
    // Simulate keyboard event
    const event = new KeyboardEvent('keydown', { key: 'a' })
    window.dispatchEvent(event)
    
    expect(callBackFn).toBeCalledTimes(1)
    
    const event2 = new KeyboardEvent('keydown', { key: 'b' })
    window.dispatchEvent(event2)
    
    expect(callBackFn).toBeCalledTimes(1)
    
    cleanup()
  })

  it('listen to multi keys', async () => {
    const cleanup = onKeyStroke(['a', 'b', 'c'], callBackFn)
    
    await userEvent.keyboard('abcd')
    expect(callBackFn).toBeCalledTimes(3)
    
    cleanup()
  })

  it('use function filter', async () => {
    const filter = (event: KeyboardEvent) => {
      return event.key === 'a'
    }
    const cleanup = onKeyStroke(filter, callBackFn)
    
    await userEvent.keyboard('abc')
    expect(callBackFn).toBeCalledTimes(1)
    
    cleanup()
  })

  it('listen to all keys by boolean', async () => {
    const cleanup = onKeyStroke(true, callBackFn)
    
    await userEvent.keyboard('abcde')
    expect(callBackFn).toBeCalledTimes(5)
    
    cleanup()
  })

  it('listen to all keys by constructor', async () => {
    const cleanup = onKeyStroke(callBackFn)
    
    await userEvent.keyboard('abcde')
    expect(callBackFn).toBeCalledTimes(5)
    
    cleanup()
  })

  it('listen to keypress', async () => {
    const cleanup = onKeyStroke('a', callBackFn, { eventName: 'keypress' })
    
    await userEvent.keyboard('a>5')
    await userEvent.keyboard('b')
    expect(callBackFn).toBeCalledTimes(1)
    
    cleanup()
  })

  it('ignore repeated events', async () => {
    const cleanup = onKeyStroke('a', callBackFn, { dedupe: true })
    
    await userEvent.keyboard('{a>5/}')
    expect(callBackFn).toBeCalledTimes(1)
    
    cleanup()
  })
  */
});

describe('onKeyDown', () => {
  let handlerFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    handlerFn = vi.fn();
  });

  it('should be defined', () => {
    expect(onKeyDown).toBeDefined();
  });
});

describe('onKeyPressed', () => {
  let handlerFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    handlerFn = vi.fn();
  });

  it('should be defined', () => {
    expect(onKeyPressed).toBeDefined();
  });
});

describe('onKeyUp', () => {
  let handlerFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    handlerFn = vi.fn();
  });

  it('should be defined', () => {
    expect(onKeyUp).toBeDefined();
  });
});
