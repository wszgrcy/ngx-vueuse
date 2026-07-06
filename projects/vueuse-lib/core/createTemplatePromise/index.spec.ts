import { describe, it, expect, beforeEach } from 'vitest';
import { createTemplatePromise } from './index';
import { createInjector, runInInjectionContext } from '@cyia/ngx-vueuse/test';

describe('createTemplatePromise', () => {
  let injector: ReturnType<typeof createInjector>;

  beforeEach(() => {
    injector = createInjector();
  });

  it('should be defined', () => {
    expect(createTemplatePromise).toBeDefined();
  });

  it('should create a template promise instance', () => {
    runInInjectionContext(injector, () => {
      const tp = createTemplatePromise<number, [string]>();

      expect(tp).toBeDefined();
      expect(typeof tp.start).toBe('function');
      expect(tp._instances).toBeDefined();
    });
  });

  it('should start a promise and return args', async () => {
    runInInjectionContext(injector, async () => {
      const tp = createTemplatePromise<string>();
      const str = 'Hello world';

      const promise = tp.start();

      expect(tp._instances().length).toBe(1);

      const instance = tp._instances()[0];
      expect(instance.args).toEqual([]);
      expect(instance.key).toBe(0);
      expect(instance.promise).toBe(promise);
      expect(instance.isResolving).toBe(false);

      instance.resolve(str);

      await expect(promise).resolves.toBe(str);
    });
  });

  it('should remove instance after promise resolves', async () => {
    runInInjectionContext(injector, async () => {
      const tp = createTemplatePromise<void>();

      const promise = tp.start();

      expect(tp._instances().length).toBe(1);

      tp._instances()[0].resolve(undefined);

      await promise;

      // After promise completes (finally block), instance should be removed
      expect(tp._instances().length).toBe(0);
    });
  });

  it('should support singleton mode', async () => {
    runInInjectionContext(injector, async () => {
      const tp = createTemplatePromise<number>({ singleton: true });

      const promise1 = tp.start();
      const promise2 = tp.start();

      // In singleton mode, both calls should return the same promise
      expect(promise1).toBe(promise2);
      expect(tp._instances().length).toBe(1);
    });
  });

  it('should reject promise', async () => {
    runInInjectionContext(injector, async () => {
      const tp = createTemplatePromise<string>();

      const promise = tp.start();

      const error = new Error('test error');
      tp._instances()[0].reject(error);

      await expect(promise).rejects.toBe(error);
    });
  });

  it('should support multiple concurrent promises', async () => {
    runInInjectionContext(injector, async () => {
      const tp = createTemplatePromise<string>();

      const promise1 = tp.start();
      const promise2 = tp.start();
      const promise3 = tp.start();

      expect(tp._instances().length).toBe(3);

      tp._instances()[0].resolve('one');
      tp._instances()[1].resolve('two');
      tp._instances()[2].resolve('three');

      await expect(promise1).resolves.toBe('one');
      await expect(promise2).resolves.toBe('two');
      await expect(promise3).resolves.toBe('three');

      expect(tp._instances().length).toBe(0);
    });
  });

  it('should set isResolving to true when resolving with a promise', async () => {
    runInInjectionContext(injector, async () => {
      const tp = createTemplatePromise<string>();
      const innerPromise = new Promise<string>((resolve) => {
        setTimeout(() => resolve('resolved'), 10);
      });

      const promise = tp.start();

      tp._instances()[0].resolve(innerPromise);

      expect(tp._instances()[0].isResolving).toBe(true);

      await innerPromise;
      // isResolving should still be true until finally runs
    });
  });

  it('should work with options', () => {
    runInInjectionContext(injector, () => {
      const tp = createTemplatePromise({
        singleton: true,
        transition: { name: 'fade' },
      });

      expect(tp._instances()).toBeDefined();
    });
  });
});
