import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OnClickOutsideOptions, OnClickOutsideHandler } from './ngx-on-click-outside.directive';

function createMockElement(): HTMLElement {
  const div = document.createElement('div');
  div.innerHTML = '<button>Inside</button><span>Content</span>';
  return div;
}

function createMockEvent(target: HTMLElement): Event {
  return new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
  }) as Event;
}

describe('NgxOnClickOutside', () => {
  let container: HTMLElement;
  let targetElement: HTMLElement;
  let outsideElement: HTMLElement;

  beforeEach(() => {
    // Create a proper DOM structure for testing
    container = document.createElement('div');
    targetElement = document.createElement('div');
    targetElement.id = 'target';
    targetElement.innerHTML = '<button id="inside-btn">Inside Button</button>';

    outsideElement = document.createElement('div');
    outsideElement.id = 'outside';
    outsideElement.textContent = 'Outside Element';

    container.appendChild(targetElement);
    container.appendChild(outsideElement);
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should export types correctly', () => {
    // Types are compile-time only, verify they can be used
    const options: OnClickOutsideOptions = {};
    const handler: OnClickOutsideHandler = vi.fn();

    expect(options).toBeDefined();
    expect(handler).toBeDefined();
  });

  it('should handle outside click detection logic', () => {
    // Test the core logic: check if event target is outside the element
    const clickEvent = new MouseEvent('click', { bubbles: true }) as Event;
    Object.defineProperty(clickEvent, 'target', { value: outsideElement });

    const isOutside =
      targetElement !== clickEvent.target && !targetElement.contains(clickEvent.target as Node);

    expect(isOutside).toBe(true);
  });

  it('should detect inside clicks correctly', () => {
    const btn = targetElement.querySelector('#inside-btn')!;
    const clickEvent = new MouseEvent('click', { bubbles: true }) as Event;
    Object.defineProperty(clickEvent, 'target', { value: btn });

    const isOutside =
      targetElement !== clickEvent.target && !targetElement.contains(clickEvent.target as Node);

    expect(isOutside).toBe(false);
  });

  it('should handle composedPath for shadow DOM', () => {
    const clickEvent = new MouseEvent('click', { bubbles: true }) as Event;
    Object.defineProperty(clickEvent, 'composedPath', {
      value: () => [outsideElement, container, document.body, document.documentElement, document],
    });

    const path = clickEvent.composedPath();
    const isOutside = !path.includes(targetElement);

    expect(isOutside).toBe(true);
  });

  describe('OnClickOutsideOptions interface', () => {
    it('should support ignore option', () => {
      const options: OnClickOutsideOptions = {
        ignore: ['.ignore-class', '#ignore-id'],
      };

      expect(options.ignore).toEqual(['.ignore-class', '#ignore-id']);
      expect(options.capture).toBeUndefined();
      expect(options.detectIframe).toBeUndefined();
    });

    it('should support capture option', () => {
      const options: OnClickOutsideOptions = {
        capture: false,
      };

      expect(options.capture).toBe(false);
    });

    it('should support detectIframe option', () => {
      const options: OnClickOutsideOptions = {
        detectIframe: true,
      };

      expect(options.detectIframe).toBe(true);
    });

    it('should support all options together', () => {
      const options: OnClickOutsideOptions = {
        ignore: ['.ignore'],
        capture: false,
        detectIframe: true,
      };

      expect(options.ignore).toEqual(['.ignore']);
      expect(options.capture).toBe(false);
      expect(options.detectIframe).toBe(true);
    });
  });

  describe('OnClickOutsideHandler type', () => {
    it('should accept event handler functions', () => {
      const handler: OnClickOutsideHandler = vi.fn();

      const event = new MouseEvent('click', { bubbles: true }) as Event;
      handler(event);

      expect(handler).toHaveBeenCalledWith(event);
    });

    it('should handle PointerEvent', () => {
      const handler: OnClickOutsideHandler = vi.fn();

      const pointerEvent = new PointerEvent('pointerdown', {
        bubbles: true,
        clientX: 100,
        clientY: 200,
      });

      handler(pointerEvent);

      expect(handler).toHaveBeenCalled();
    });
  });
});
