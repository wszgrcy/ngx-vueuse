import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createInjector, runInInjectionContext } from '@cyia/ngx-vueuse/test';
import { createReusableTemplate } from './index';

describe('createReusableTemplate', () => {
  let injector: ReturnType<typeof createInjector>;

  beforeEach(() => {
    injector = createInjector();
  });

  it('should return an object with define and reuse', () => {
    runInInjectionContext(injector, () => {
      const { define, reuse } = createReusableTemplate();

      expect(define).toBeDefined();
      expect(reuse).toBeDefined();
    });
  });

  it('should have correct component names', () => {
    runInInjectionContext(injector, () => {
      const { define, reuse } = createReusableTemplate();

      expect(define.name).toBe('ReusableTemplate.define');
      expect(reuse.name).toBe('ReusableTemplate.reuse');
    });
  });

  it('should support custom name option', () => {
    runInInjectionContext(injector, () => {
      const { define, reuse } = createReusableTemplate({ name: 'MyTemplate' });

      expect(define.name).toBe('MyTemplate.define');
      expect(reuse.name).toBe('MyTemplate.reuse');
    });
  });

  it('should store template definition via renderSlot', () => {
    runInInjectionContext(injector, () => {
      const { define, reuse } = createReusableTemplate();

      const templateFn = vi.fn((bindings: any) => ({ rendered: true, bindings }));

      // Define the template (renderSlot stores the function)
      define.renderSlot(templateFn);

      // The template function is stored, not called yet
      // It will be called when reuse.render is called
    });
  });

  it('should reuse the defined template with bindings', () => {
    runInInjectionContext(injector, () => {
      const { define, reuse } = createReusableTemplate();

      const templateFn = vi.fn((bindings: any) => ({ value: bindings.value }));

      // Define the template
      define.renderSlot(templateFn);

      // Reuse with bindings
      const result = reuse.render({ value: 42 } as any);

      expect(templateFn).toHaveBeenCalledWith({ value: 42 } as any);
      expect(result).toEqual({ value: 42 });
    });
  });

  it('should throw error when reusing undefined template (non-production)', () => {
    runInInjectionContext(injector, () => {
      const { reuse } = createReusableTemplate();

      // Don't define a template, try to reuse
      expect(() => {
        reuse.render({ value: 1 } as any);
      }).toThrow('Failed to find the definition of reusable template');
    });
  });

  it('should handle empty bindings', () => {
    runInInjectionContext(injector, () => {
      const { define, reuse } = createReusableTemplate();

      const templateFn = vi.fn(() => 'hello');
      define.renderSlot(templateFn);

      const result = reuse.render({} as any);

      expect(result).toBe('hello');
    });
  });

  it('should handle complex bindings', () => {
    runInInjectionContext(injector, () => {
      const { define, reuse } = createReusableTemplate();

      const templateFn = vi.fn((bindings: any) => ({
        name: bindings.name,
        age: bindings.age,
        nested: bindings.nested?.value,
      }));
      define.renderSlot(templateFn);

      const result = reuse.render({
        name: 'John',
        age: 30,
        nested: { value: 'deep' },
      } as any);

      expect(result).toEqual({
        name: 'John',
        age: 30,
        nested: 'deep',
      });
    });
  });
});
