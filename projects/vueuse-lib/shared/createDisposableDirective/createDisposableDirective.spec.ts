import { describe, expect, it } from 'vitest';
import { createDisposableDirective } from './createDisposableDirective';

describe('createDisposableDirective', () => {
  it('should return disposable directive', () => {
    const directive = {
      mounted() {},
    };
    const VDirective = createDisposableDirective(directive as any);
    expect(VDirective).toHaveProperty('ngOnInit');
    expect(VDirective).toHaveProperty('ngOnDestroy');
  });

  it('should return normal directive', () => {
    const directive = {
      mounted() {},
    };
    const VDirective = createDisposableDirective(directive as any);
    expect(VDirective).toHaveProperty('ngOnInit');
  });

  it('simple directive', () => {
    const directive = () => {};
    const VDirective = createDisposableDirective(directive as any);
    expect(VDirective).toHaveProperty('ngOnInit');
    expect(VDirective).toHaveProperty('ngOnDestroy');
  });
});
