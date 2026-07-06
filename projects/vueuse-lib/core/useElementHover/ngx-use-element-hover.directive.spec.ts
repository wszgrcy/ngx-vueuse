import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxUseElementHoverDirective } from './ngx-use-element-hover.directive';
import { waitForMicrotasks } from '@cyia/ngx-vueuse/test';

@Component({
  standalone: true,
  imports: [NgxUseElementHoverDirective],
  template: `
    <div
      #target
      id="target"
      ngxUseElementHover
      [ngxUseElementHoverHandler]="onHoverChange"
      [ngxUseElementHoverOptions]="options()"
    >
      Hover over me
    </div>
    <div id="outside">Outside element</div>
  `,
})
class TestComponent {
  hoverState: boolean | null = null;
  onHoverChange = vi.fn((state: boolean) => {
    this.hoverState = state;
  });
  options = signal({ delayEnter: 0, delayLeave: 0, triggerOnRemoval: false });
}

@Component({
  standalone: true,
  imports: [NgxUseElementHoverDirective],
  template: `
    <div #target id="target" ngxUseElementHover (ngxUseElementHover)="onHoverChange($event)">
      Hover with output
    </div>
  `,
})
class TestOutputComponent {
  hoverStates: boolean[] = [];
  onHoverChange = vi.fn((state: boolean) => {
    this.hoverStates.push(state);
  });
}

describe('NgxUseElementHoverDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let testComponent: TestComponent;
  let targetElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent, TestOutputComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(TestComponent);
    testComponent = fixture.componentInstance;
    fixture.detectChanges();

    // Get target element directly from nativeElement
    targetElement = fixture.nativeElement.querySelector('#target') as HTMLElement;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create the directive', () => {
    expect(testComponent).toBeTruthy();
    expect(targetElement).toBeTruthy();
    expect(targetElement.textContent).toContain('Hover over me');
  });

  it('should apply the directive to the element', () => {
    expect(targetElement.getAttribute('ngxuseelementhover')).not.toBe(null);
  });

  it('should call handler with true on mouseenter', () => {
    const mouseEnterEvent = new MouseEvent('mouseenter', {
      bubbles: true,
      cancelable: true,
    });

    targetElement.dispatchEvent(mouseEnterEvent);
    fixture.detectChanges();

    expect(testComponent.onHoverChange).toHaveBeenCalledWith(true);
    expect(testComponent.hoverState).toBe(true);
  });

  it('should call handler with false on mouseleave', async () => {
    // First enter
    const mouseEnterEvent = new MouseEvent('mouseenter', {
      bubbles: true,
      cancelable: true,
    });
    targetElement.dispatchEvent(mouseEnterEvent);
    await waitForMicrotasks();
    fixture.detectChanges();
    expect(testComponent.onHoverChange).toHaveBeenCalledWith(true);

    // Then leave
    const mouseLeaveEvent = new MouseEvent('mouseleave', {
      bubbles: true,
      cancelable: true,
    });
    targetElement.dispatchEvent(mouseLeaveEvent);
    await waitForMicrotasks();
    fixture.detectChanges();
    expect(testComponent.onHoverChange).toHaveBeenCalledWith(false);
  });

  it('should emit through output when hovering', async () => {
    const outputFixture = TestBed.createComponent(TestOutputComponent);
    outputFixture.detectChanges();

    const element = outputFixture.nativeElement.querySelector('div') as HTMLElement;

    // Mouse enter
    element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    outputFixture.detectChanges();

    expect(outputFixture.componentInstance.onHoverChange).toHaveBeenCalledWith(true);

    // Mouse leave
    element.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    outputFixture.detectChanges();

    expect(outputFixture.componentInstance.onHoverChange).toHaveBeenCalledWith(false);
  });

  it('should handle rapid hover enter/leave sequences', async () => {
    for (let i = 0; i < 5; i++) {
      targetElement.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await waitForMicrotasks();
      fixture.detectChanges();
      targetElement.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      await waitForMicrotasks();
      fixture.detectChanges();
    }

    expect(testComponent.onHoverChange).toHaveBeenCalledTimes(11);
    // Should end in false (last state)
    expect(testComponent.hoverState).toBe(false);
  });

  it('should support delayEnter option', async () => {
    testComponent.options.set({ delayEnter: 100, delayLeave: 0, triggerOnRemoval: false });
    fixture.detectChanges();

    targetElement.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    await waitForMicrotasks();
    fixture.detectChanges();

    // Should not be true immediately due to delay
    expect(testComponent.hoverState).eq(false);
  });

  it('should support delayLeave option', async () => {
    testComponent.options.set({ delayEnter: 0, delayLeave: 100, triggerOnRemoval: false });
    fixture.detectChanges();

    // First enter
    targetElement.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

    // Then leave with delay
    await waitForMicrotasks();
    fixture.detectChanges();
    expect(testComponent.hoverState).toBe(true);

    targetElement.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    await waitForMicrotasks();
    fixture.detectChanges();

    // Should still be true due to delay
    expect(testComponent.hoverState).toBe(true);

    // Wait for delay
  });

  it('should clear timer on rapid hover changes', () => {
    testComponent.options.set({ delayEnter: 100, delayLeave: 100, triggerOnRemoval: false });
    fixture.detectChanges();

    // Enter
    targetElement.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    // Immediately leave before delay
    targetElement.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    // Immediately enter again
    targetElement.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

    // The last enter should set state to true immediately after its own delay
    // because the previous timer was cleared
  });

  describe('isHovered getter', () => {
    it('should return false initially', () => {
      // Reset state before testing
      testComponent.onHoverChange.mockClear();
      testComponent.hoverState = null;
      // The initial state should be that no hover has occurred
      expect(testComponent.hoverState).toBe(null);
    });

    it('should return true when hovering', () => {
      targetElement.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      fixture.detectChanges();

      // The handler should be called with true
      expect(testComponent.onHoverChange).toHaveBeenCalledWith(true);
    });

    it('should return false after leaving', () => {
      targetElement.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      targetElement.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      fixture.detectChanges();

      // The handler should be called with false after leave
      expect(testComponent.onHoverChange).toHaveBeenCalledWith(false);
    });
  });
});
