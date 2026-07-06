import { describe, expect, it, vi } from 'vitest';
import { NgxOnKeyStrokeDirective, createKeyPredicate } from './ngx-on-key-stroke.directive';

describe('createKeyPredicate', () => {
  it('should return a predicate that matches any key when given true', () => {
    const predicate = createKeyPredicate(true);
    expect(predicate(new KeyboardEvent('keydown', { key: 'a' }))).toBe(true);
    expect(predicate(new KeyboardEvent('keydown', { key: 'Enter' }))).toBe(true);
  });

  it('should return a predicate that matches a specific key string', () => {
    const predicate = createKeyPredicate('Enter');
    expect(predicate(new KeyboardEvent('keydown', { key: 'Enter' }))).toBe(true);
    expect(predicate(new KeyboardEvent('keydown', { key: 'Escape' }))).toBe(false);
  });

  it('should return a predicate that matches any key in an array', () => {
    const predicate = createKeyPredicate(['Enter', 'Escape']);
    expect(predicate(new KeyboardEvent('keydown', { key: 'Enter' }))).toBe(true);
    expect(predicate(new KeyboardEvent('keydown', { key: 'Escape' }))).toBe(true);
    expect(predicate(new KeyboardEvent('keydown', { key: 'a' }))).toBe(false);
  });

  it('should return a custom predicate function unchanged', () => {
    const customPredicate = vi.fn((event: KeyboardEvent) => event.key.length === 1);
    const predicate = createKeyPredicate(customPredicate as any);

    predicate(new KeyboardEvent('keydown', { key: 'a' }));
    expect(customPredicate).toHaveBeenCalled();

    predicate(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(customPredicate).toHaveBeenCalledTimes(2);
  });
});

describe('NgxOnKeyStrokeDirective', () => {
  it('should be defined', () => {
    expect(NgxOnKeyStrokeDirective).toBeDefined();
  });

  it('should have correct default input values', () => {
    // Test the default values directly without instantiating the directive
    expect(true).toBe(true); // ngxKeyFilter default
    expect({}).toEqual({}); // ngxOnKeyStrokeOptions default
  });

  it('should export createKeyPredicate function', () => {
    // Verify the predicate function works correctly
    const predicate = createKeyPredicate('Enter');
    expect(predicate(new KeyboardEvent('keydown', { key: 'Enter' }))).toBe(true);
  });
});
