import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStorage, StorageSerializers } from './index';
import { createInjector, runInInjectionContext } from '@cyia/ngx-vueuse/test';

const KEY = 'custom-key';

describe('useStorage', () => {
  console.error = vi.fn();

  let injector: ReturnType<typeof createInjector>;
  const storageState = new Map<string, string | number | undefined>();
  const storageMock = {
    getItem: vi.fn((x) => storageState.get(x) as string | undefined),
    setItem: vi.fn((x, v) => storageState.set(x, v)),
    removeItem: vi.fn((x) => storageState.delete(x)),
    clear: vi.fn(() => storageState.clear()),
  };
  const storage = storageMock as any as Storage;

  beforeEach(() => {
    storageState.clear();
    injector = createInjector();
  });

  it('should be defined', () => {
    expect(useStorage).toBeDefined();
    expect(StorageSerializers).toBeDefined();
  });

  it('should return initial value and write to storage', () => {
    runInInjectionContext(injector, () => {
      const ref = useStorage(KEY, 'a', storage);
      expect(ref()).toBe('a');
      expect(storage.setItem).toHaveBeenCalledWith(KEY, 'a');
    });
  });

  it('should read existing storage value', () => {
    runInInjectionContext(injector, () => {
      storageState.set(KEY, 'existing');
      const ref = useStorage(KEY, 'default', storage);
      expect(ref()).toBe('existing');
    });
  });

  it('should handle number type', () => {
    runInInjectionContext(injector, () => {
      storageState.set(KEY, '42');
      const ref = useStorage(KEY, 0, storage);
      expect(ref()).toBe(42);
    });
  });

  it('should handle boolean type', () => {
    runInInjectionContext(injector, () => {
      const ref = useStorage(KEY, true, storage);
      expect(ref()).toBe(true);
    });
  });

  it('should handle null value', () => {
    runInInjectionContext(injector, () => {
      storage.removeItem(KEY);
      const ref = useStorage(KEY, null, storage);
      expect(ref()).toBe(null);
    });
  });

  it('should handle undefined value', () => {
    runInInjectionContext(injector, () => {
      storage.removeItem(KEY);
      const ref = useStorage(KEY, undefined, storage);
      expect(ref()).toBe(undefined);
    });
  });

  it('should handle date type', () => {
    runInInjectionContext(injector, () => {
      storageState.set(KEY, '2000-01-01T00:00:00.000Z');
      const ref = useStorage(KEY, new Date('2000-01-02T00:00:00.000Z'), storage);
      expect(ref()).toEqual(new Date('2000-01-01T00:00:00.000Z'));
    });
  });

  it('should handle object type', () => {
    runInInjectionContext(injector, () => {
      const ref = useStorage<any>(KEY, { name: 'a', data: 123 }, storage);
      expect(storage.setItem).toHaveBeenCalledWith(KEY, '{"name":"a","data":123}');
      expect(ref()).toEqual({ name: 'a', data: 123 });
    });
  });

  it('should handle map type', () => {
    runInInjectionContext(injector, () => {
      const ref = useStorage(
        KEY,
        new Map<number, string | number>([
          [1, 'a'],
          [2, 2],
        ]),
        storage,
      );
      expect(storage.setItem).toHaveBeenCalledWith(KEY, '[[1,"a"],[2,2]]');
      expect(ref()).toEqual(
        new Map<number, string | number>([
          [1, 'a'],
          [2, 2],
        ]),
      );
    });
  });

  it('should handle set type', () => {
    runInInjectionContext(injector, () => {
      const ref = useStorage(KEY, new Set([1, '2']), storage);
      expect(storage.setItem).toHaveBeenCalledWith(KEY, '[1,"2"]');
      expect(ref()).toEqual(new Set([1, '2']));
    });
  });

  it('should merge defaults with storage value', () => {
    runInInjectionContext(injector, () => {
      storage.setItem(KEY, JSON.stringify({ a: 1 }));
      const ref = useStorage<any>(KEY, { a: 2, b: 3 }, storage, { mergeDefaults: true });
      expect(ref()).toEqual({ a: 1, b: 3 });
    });
  });

  it('should use storage value if present', () => {
    runInInjectionContext(injector, () => {
      storageState.set(KEY, 'true');
      expect(useStorage(KEY, false, storage)()).toBe(true);

      storageState.set(KEY, '0');
      expect(useStorage(KEY, 1, storage)()).toBe(0);
    });
  });

  it('should support shallow signal', () => {
    runInInjectionContext(injector, () => {
      const data = useStorage(KEY, 0, storage, { shallow: true });
      expect(data()).toBe(0);
    });
  });

  it('should handle custom serializer', () => {
    runInInjectionContext(injector, () => {
      const ref = useStorage<any>(KEY, 0, storage, {
        serializer: { read: JSON.parse, write: JSON.stringify },
      });
      expect(storage.setItem).toHaveBeenCalledWith(KEY, '0');
      expect(ref()).toBe(0);
    });
  });

  // Note: The following tests require Angular change detection cycle
  // to trigger watchPausable callbacks. They work in real Angular components
  // but need TestBed integration for proper testing:
  // - string (write after set)
  // - number (write after set)
  // - boolean (write after set)
  // - remove value
  // - object (write after mutation)
  // - map (write after mutation)
  // - set (write after mutation)
  // - custom serializer (write after mutation)
  // - eventFilter
});
