import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEventBus } from './index';
import { events } from './internal';

describe('useEventBus', () => {
  beforeEach(() => {
    events.clear();
  });

  it('should return an object with on, once, off, emit, reset methods', () => {
    const bus = useEventBus('test');
    expect(bus).toHaveProperty('on');
    expect(bus).toHaveProperty('once');
    expect(bus).toHaveProperty('off');
    expect(bus).toHaveProperty('emit');
    expect(bus).toHaveProperty('reset');
  });

  it('should call on listener when emit is called', () => {
    const bus = useEventBus('test');
    const listener = vi.fn();
    const off = bus.on(listener);

    bus.emit('hello');

    expect(listener).toHaveBeenCalledWith('hello', undefined);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should pass payload to listener', () => {
    const bus = useEventBus('test');
    const listener = vi.fn();
    bus.on(listener);

    bus.emit('hello', { data: 'world' });

    expect(listener).toHaveBeenCalledWith('hello', { data: 'world' });
  });

  it('should support multiple listeners', () => {
    const bus = useEventBus('test');
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    bus.on(listener1);
    bus.on(listener2);

    bus.emit('event');

    expect(listener1).toHaveBeenCalledWith('event', undefined);
    expect(listener2).toHaveBeenCalledWith('event', undefined);
    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
  });

  it('should return a cleanup function from on', () => {
    const bus = useEventBus('test');
    const listener = vi.fn();
    const off = bus.on(listener);

    bus.emit('event1');
    off();
    bus.emit('event2');

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('event1', undefined);
  });

  it('should call once listener only once', () => {
    const bus = useEventBus('test');
    const listener = vi.fn();
    bus.once(listener);

    bus.emit('event1');
    bus.emit('event2');

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('event1', undefined);
  });

  it('should call once listener with payload', () => {
    const bus = useEventBus('test');
    const listener = vi.fn();
    bus.once(listener);

    bus.emit('event', { payload: 'data' });

    expect(listener).toHaveBeenCalledWith('event', { payload: 'data' });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should remove listener with off', () => {
    const bus = useEventBus('test');
    const listener = vi.fn();
    bus.on(listener);

    bus.off(listener);
    bus.emit('event');

    expect(listener).not.toHaveBeenCalled();
  });

  it('should clear all events with reset', () => {
    const bus = useEventBus('test');
    const listener = vi.fn();
    bus.on(listener);

    bus.reset();
    bus.emit('event');

    expect(listener).not.toHaveBeenCalled();
  });

  it('should share state between buses with same key', () => {
    const bus1 = useEventBus('shared');
    const bus2 = useEventBus('shared');
    const listener = vi.fn();

    bus1.on(listener);
    bus2.emit('event');

    expect(listener).toHaveBeenCalledWith('event', undefined);
  });

  it('should auto-clean when listener is removed via off', () => {
    const bus = useEventBus('test');
    const listener = vi.fn();
    bus.on(listener);

    expect(events.has('test')).toBe(true);

    bus.off(listener);

    expect(events.has('test')).toBe(false);
  });

  it('should handle string keys', () => {
    const bus = useEventBus('my-event');
    const listener = vi.fn();
    bus.on(listener);

    bus.emit('hello');

    expect(listener).toHaveBeenCalledWith('hello', undefined);
  });

  it('should handle number keys', () => {
    const bus = useEventBus(123);
    const listener = vi.fn();
    bus.on(listener);

    bus.emit('event');

    expect(listener).toHaveBeenCalledWith('event', undefined);
  });

  it('should work with generic types', () => {
    interface MyEvent {
      type: string;
      data: any;
    }

    const bus = useEventBus<MyEvent, string>('typed');
    const listener = vi.fn();
    bus.on(listener);

    const event: MyEvent = { type: 'click', data: { x: 10, y: 20 } };
    bus.emit(event, 'extra');

    expect(listener).toHaveBeenCalledWith(event, 'extra');
  });
});
