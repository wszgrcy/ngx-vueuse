/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onClickOutside } from './index';
import { createInjector, runInInjectionContext } from '@cyia/ngx-vueuse/test';

// ============================================================================
// 原始 Vue 测试用例 (lib/vueuse/packages/core/onClickOutside/index.browser.test.ts)
// ============================================================================
// 以下测试用例需要从 Vue 环境移植到 Angular 环境：
//
// 1. should work with ignored element
//    - 原始使用: defineComponent, useTemplateRef, page.render, userEvent.click
//    - Angular 需要: Component, TemplateRef, TestBed, userEvent
//
// 2. should detect iframe inside shadow DOM with detectIframe option
//    - 原始使用: defineComponent, useTemplateRef, page.render, userEvent.click
//    - Angular 需要: Component, TemplateRef, TestBed, userEvent
//
// 3. should detect iframe inside nested shadow DOM with detectIframe option
//    - 原始使用: defineComponent, useTemplateRef, page.render
//    - Angular 需要: Component, TemplateRef, TestBed
//
// 4. allow the value of target to be a getter
//    - 原始使用: defineComponent, useTemplateRef, page.render, userEvent.click
//    - Angular 需要: Component, TemplateRef, TestBed, userEvent
//
// 这些测试需要浏览器环境和 Angular 组件，需要手动转换。
// 以下是基本的单元测试，覆盖不涉及 Vue 组件的核心功能。
// ============================================================================

describe('onClickOutside', () => {
  let injector: ReturnType<typeof createInjector>;

  beforeEach(() => {
    document.body.innerHTML = '';
    injector = createInjector();
  });

  it('should be defined', () => {
    expect(onClickOutside).toBeDefined();
  });

  it('should return stop function', () => {
    runInInjectionContext(injector, () => {
      const target = document.createElement('div');
      target.id = 'target';
      document.body.appendChild(target);

      const handler = vi.fn();
      const stop = onClickOutside(target, handler);

      expect(stop).toBeDefined();
      expect(typeof stop).toBe('function');

      // Stop listening
      stop();
    });
  });

  it('should work with controls option', () => {
    runInInjectionContext(injector, () => {
      const target = document.createElement('div');
      target.id = 'target';
      document.body.appendChild(target);

      const other = document.createElement('div');
      other.id = 'other';
      document.body.appendChild(other);

      const handler = vi.fn();
      const controls = onClickOutside(target, handler, { controls: true });

      expect(controls).toBeDefined();
      expect(controls.stop).toBeDefined();
      expect(controls.cancel).toBeDefined();
      expect(controls.trigger).toBeDefined();

      // Trigger manually with event that has correct target
      const mockEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      }) as MouseEvent;
      Object.defineProperty(mockEvent, 'target', { value: other });
      controls.trigger(mockEvent);
      expect(handler).toHaveBeenCalled();
    });
  });
});
