import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { useMounted } from './index';

@Component({
  standalone: true,
  template: ``,
})
class UseMountedDemoComponent {
  mounted = useMounted();
}

describe('useMounted Demo Component', () => {
  let fixture: ComponentFixture<UseMountedDemoComponent>;

  beforeEach(() => {
    fixture = TestBed.configureTestingModule({
      imports: [UseMountedDemoComponent],
    }).createComponent(UseMountedDemoComponent);
  });

  afterEach(() => {
    // Destroy fixture to clean up resources
    if (fixture) {
      fixture.destroy();
    }
  });

  it('should show mounted state', () => {
    expect(fixture.componentInstance.mounted()).toBe(false);
    fixture.detectChanges();
    expect(fixture.componentInstance.mounted()).toBe(true);
  });

  // === 补充的测试用例 (原版 VueUse 测试场景) ===

  it('should remain true after destroy', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance.mounted()).toBe(true);

    // 销毁组件后，mounted 状态应该保持为 true
    fixture.destroy();
    expect(fixture.componentInstance.mounted()).toBe(true);
  });
});
