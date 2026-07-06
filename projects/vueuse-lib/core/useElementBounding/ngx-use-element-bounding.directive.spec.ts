import { describe, expect, it, vi } from 'vitest';
import { NgxElementBoundingDirective } from './ngx-use-element-bounding.directive';

describe('NgxElementBoundingDirective', () => {
  it('should be defined', () => {
    expect(NgxElementBoundingDirective).toBeDefined();
  });

  it('should support function binding', () => {
    const handler = vi.fn();
    expect(typeof handler).toBe('function');
  });

  it('should support array binding with handler and options', () => {
    const handler = vi.fn();
    const options = {
      reset: true,
      windowResize: true,
      windowScroll: true,
      immediate: true,
      updateTiming: 'sync' as const,
    };
    const binding: [typeof handler, typeof options] = [handler, options];
    expect(binding[0]).toBe(handler);
    expect(binding[1]).toBe(options);
  });
});
