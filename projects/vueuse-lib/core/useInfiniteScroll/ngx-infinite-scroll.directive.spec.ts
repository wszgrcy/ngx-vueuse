import { Component, ElementRef, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { NgxInfiniteScrollDirective } from './ngx-infinite-scroll.directive';

describe('NgxInfiniteScrollDirective', () => {
  @Component({
    standalone: true,
    imports: [NgxInfiniteScrollDirective],
    template: `
      <div
        #scrollContainer
        [ngxInfiniteScroll]="scrollHandler"
        [ngxInfiniteScrollOptions]="options"
        style="height: 200px; overflow: auto;"
      >
        <div style="height: 400px;">Content</div>
      </div>
    `,
  })
  class TestComponent {
    @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLElement>;
    scrollHandler = vi.fn();
    options: any = {};
  }

  it('should be defined', () => {
    expect(NgxInfiniteScrollDirective).toBeDefined();
  });

  it('should create directive with handler', async () => {
    const fixture: ComponentFixture<TestComponent> = TestBed.configureTestingModule({
      imports: [TestComponent],
    }).createComponent(TestComponent);

    fixture.detectChanges();
    expect(fixture.componentInstance.scrollHandler).toBeDefined();
  });

  it('should create directive with handler and options', async () => {
    const fixture: ComponentFixture<TestComponent> = TestBed.configureTestingModule({
      imports: [TestComponent],
    }).createComponent(TestComponent);

    fixture.componentInstance.options = { distance: 10 };
    fixture.detectChanges();
    expect(fixture.componentInstance.scrollHandler).toBeDefined();
  });
});
