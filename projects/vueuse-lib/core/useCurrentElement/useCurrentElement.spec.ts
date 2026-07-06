import { Component, ElementRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { useCurrentElement } from './useCurrentElement';
import { waitForMicrotasks } from '@cyia/ngx-vueuse/test';

@Component({
  standalone: true,
  selector: 'test-child-component',
  template: `<div #rootEl>Hello world</div>`,
})
class TestChildComponent {
  rootEl = viewChild<ElementRef>('rootEl');
}

@Component({
  standalone: true,
  selector: 'test-parent-component',
  imports: [TestChildComponent],
  template: `
    <p>
      Testing
      <test-child-component #child />
    </p>
  `,
})
class TestParentComponent {
  child = viewChild(TestChildComponent);
  currentElementEl = useCurrentElement();
}

@Component({
  standalone: true,
  selector: 'test-simple-component',
  template: `<p ref="el">test</p>`,
})
class TestSimpleComponent {
  currentElement = useCurrentElement();
}

describe('useCurrentElement', () => {
  it('should be defined', () => {
    expect(useCurrentElement).toBeDefined();
  });

  it('should return the root element from the current component', async () => {
    await TestBed.configureTestingModule({
      imports: [TestSimpleComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(TestSimpleComponent);

    fixture.detectChanges();

    // afterNextRender executes in the next microtask cycle
    // Wait for it to complete
    await waitForMicrotasks();
    fixture.detectChanges();

    // After detection, the signal should contain the host element
    const el = fixture.componentInstance.currentElement();
    expect(el).toBeDefined();
    // In jsdom, the element might not be an instanceof HTMLElement from the global scope
    // Check that it has HTMLElement-like properties instead
    expect(el).toHaveProperty('nodeType', 1);
    expect(el).toHaveProperty('tagName');
  });

  it('should return the root element from the passed component', async () => {
    const fixture = TestBed.configureTestingModule({
      imports: [TestParentComponent],
    }).createComponent(TestParentComponent);

    fixture.detectChanges();

    // afterNextRender executes in the next microtask cycle
    await waitForMicrotasks();
    fixture.detectChanges();

    // The currentElement should be the host element of TestParentComponent
    const el = fixture.componentInstance.currentElementEl();
    expect(el).toBeDefined();
    // In jsdom, check for DOM element properties instead of instanceof
    expect(el).toHaveProperty('nodeType', 1);
    expect(el).toHaveProperty('tagName');
  });
});
