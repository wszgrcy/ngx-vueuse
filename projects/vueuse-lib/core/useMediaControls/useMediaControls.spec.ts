import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useMediaControls } from './index';
import type { UseMediaTextTrackSource } from './index';
import { createInjector, runInInjectionContext } from '@cyia/ngx-vueuse/test';

describe('useMediaControls', () => {
  let injector: ReturnType<typeof createInjector>;

  beforeEach(() => {
    injector = createInjector();
  });

  function createMockMediaElement(overrides: Partial<HTMLMediaElement> = {}): HTMLMediaElement {
    const addEventListenerMock = vi.fn();
    const removeEventListenerMock = vi.fn();

    const mockTextTracks = {
      length: 0,
      item: vi.fn(() => null),
      addEventListener: addEventListenerMock,
      removeEventListener: removeEventListenerMock,
    } as unknown as TextTrackList;

    const mockElement = {
      currentTime: 0,
      get duration() {
        return 0;
      },
      set duration(_v: number) {
        /* readonly in real DOM */
      },
      volume: 1,
      muted: false,
      playbackRate: 1,
      paused: true,
      buffered: {
        length: 0,
        start: vi.fn(() => 0),
        end: vi.fn(() => 0),
      } as unknown as TimeRanges,
      textTracks: mockTextTracks,
      querySelectorAll: vi.fn(() => []),
      appendChild: vi.fn(),
      removeEventListener: removeEventListenerMock,
      addEventListener: addEventListenerMock,
      load: vi.fn(),
      play: vi.fn(() => Promise.resolve()),
      pause: vi.fn(),
      ...overrides,
    } as unknown as HTMLMediaElement;

    return mockElement;
  }

  it('should return all expected properties', () => {
    const mockEl = createMockMediaElement();
    const result = runInInjectionContext(injector, () => useMediaControls(() => mockEl));

    expect(result.currentTime).toBeDefined();
    expect(result.duration).toBeDefined();
    expect(result.waiting).toBeDefined();
    expect(result.seeking).toBeDefined();
    expect(result.ended).toBeDefined();
    expect(result.stalled).toBeDefined();
    expect(result.buffered).toBeDefined();
    expect(result.playing).toBeDefined();
    expect(result.rate).toBeDefined();
    expect(result.volume).toBeDefined();
    expect(result.muted).toBeDefined();
    expect(result.tracks).toBeDefined();
    expect(result.selectedTrack).toBeDefined();
    expect(result.enableTrack).toBeDefined();
    expect(result.disableTrack).toBeDefined();
    expect(result.supportsPictureInPicture).toBeDefined();
    expect(result.togglePictureInPicture).toBeDefined();
    expect(result.isPictureInPicture).toBeDefined();
    expect(result.onSourceError).toBeDefined();
    expect(result.onPlaybackError).toBeDefined();
  });

  it('should initialize with default values', () => {
    const mockEl = createMockMediaElement();
    const result = runInInjectionContext(injector, () => useMediaControls(() => mockEl));

    expect(result.currentTime()).toBe(0);
    expect(result.duration()).toBe(0);
    expect(result.volume()).toBe(1);
    expect(result.playing()).toBe(false);
    expect(result.rate()).toBe(1);
    expect(result.muted()).toBe(false);
    expect(result.seeking()).toBe(false);
    expect(result.waiting()).toBe(false);
    expect(result.ended()).toBe(false);
    expect(result.stalled()).toBe(false);
    expect(result.buffered()).toEqual([]);
    expect(result.tracks()).toEqual([]);
    expect(result.selectedTrack()).toBe(-1);
    expect(result.isPictureInPicture()).toBe(false);
  });

  it('should update currentTime when timeupdate event fires', () => {
    const mockEl = createMockMediaElement({ currentTime: 10 });
    const result = runInInjectionContext(injector, () => useMediaControls(() => mockEl));

    // Simulate timeupdate event
    const timeupdateCall = (mockEl.addEventListener as any).mock.calls.find(
      (call: any[]) => call[0] === 'timeupdate',
    );
    const timeupdateCallback = timeupdateCall?.[1];

    mockEl.currentTime = 10;
    timeupdateCallback?.();

    expect(result.currentTime()).toBe(10);
  });

  it('should update duration when durationchange event fires', () => {
    const mockEl = createMockMediaElement();
    const result = runInInjectionContext(injector, () => useMediaControls(() => mockEl));

    const durationchangeCall = (mockEl.addEventListener as any).mock.calls.find(
      (call: any[]) => call[0] === 'durationchange',
    );
    const durationchangeCallback = durationchangeCall?.[1];

    durationchangeCallback?.();

    expect(result.duration()).toBe(0);
  });

  it('should update volume and muted when volumechange event fires', () => {
    const mockEl = createMockMediaElement({ volume: 0.5, muted: true });
    const result = runInInjectionContext(injector, () => useMediaControls(() => mockEl));

    const volumechangeCall = (mockEl.addEventListener as any).mock.calls.find(
      (call: any[]) => call[0] === 'volumechange',
    );
    const volumechangeCallback = volumechangeCall?.[1];

    mockEl.volume = 0.5;
    mockEl.muted = true;
    volumechangeCallback?.();

    expect(result.volume()).toBe(0.5);
    expect(result.muted()).toBe(true);
  });

  it('should update playing state when play event fires', () => {
    const mockEl = createMockMediaElement();
    const result = runInInjectionContext(injector, () => useMediaControls(() => mockEl));

    const playCall = (mockEl.addEventListener as any).mock.calls.find(
      (call: any[]) => call[0] === 'play',
    );
    const playCallback = playCall?.[1];

    playCallback?.();

    expect(result.playing()).toBe(true);
  });

  it('should update playing state to false when pause event fires', () => {
    const mockEl = createMockMediaElement();
    const result = runInInjectionContext(injector, () => useMediaControls(() => mockEl));

    const pauseCall = (mockEl.addEventListener as any).mock.calls.find(
      (call: any[]) => call[0] === 'pause',
    );
    const pauseCallback = pauseCall?.[1];

    pauseCallback?.();

    expect(result.playing()).toBe(false);
  });

  it('should update seeking state when seeking and seeked events fire', () => {
    const mockEl = createMockMediaElement();
    const result = runInInjectionContext(injector, () => useMediaControls(() => mockEl));

    const seekingCall = (mockEl.addEventListener as any).mock.calls.find(
      (call: any[]) => call[0] === 'seeking',
    );
    const seekingCallback = seekingCall?.[1];

    const seekedCall = (mockEl.addEventListener as any).mock.calls.find(
      (call: any[]) => call[0] === 'seeked',
    );
    const seekedCallback = seekedCall?.[1];

    seekingCallback?.();
    expect(result.seeking()).toBe(true);

    seekedCallback?.();
    expect(result.seeking()).toBe(false);
  });

  it('should update waiting state when waiting and loadeddata events fire', () => {
    const mockEl = createMockMediaElement();
    const result = runInInjectionContext(injector, () => useMediaControls(() => mockEl));

    const waitingCall = (mockEl.addEventListener as any).mock.calls.find(
      (call: any[]) => call[0] === 'waiting',
    );
    const waitingCallback = waitingCall?.[1];

    const loadeddataCall = (mockEl.addEventListener as any).mock.calls.find(
      (call: any[]) => call[0] === 'loadeddata',
    );
    const loadeddataCallback = loadeddataCall?.[1];

    waitingCallback?.();
    expect(result.waiting()).toBe(true);

    loadeddataCallback?.();
    expect(result.waiting()).toBe(false);
  });

  it('should update rate when ratechange event fires', () => {
    const mockEl = createMockMediaElement({ playbackRate: 2 });
    const result = runInInjectionContext(injector, () => useMediaControls(() => mockEl));

    const ratechangeCall = (mockEl.addEventListener as any).mock.calls.find(
      (call: any[]) => call[0] === 'ratechange',
    );
    const ratechangeCallback = ratechangeCall?.[1];

    ratechangeCallback?.();

    expect(result.rate()).toBe(2);
  });

  it('should update ended when ended event fires', () => {
    const mockEl = createMockMediaElement();
    const result = runInInjectionContext(injector, () => useMediaControls(() => mockEl));

    const endedCall = (mockEl.addEventListener as any).mock.calls.find(
      (call: any[]) => call[0] === 'ended',
    );
    const endedCallback = endedCall?.[1];

    endedCallback?.();

    expect(result.ended()).toBe(true);
  });

  it('should update stalled when stalled event fires', () => {
    const mockEl = createMockMediaElement();
    const result = runInInjectionContext(injector, () => useMediaControls(() => mockEl));

    const stalledCall = (mockEl.addEventListener as any).mock.calls.find(
      (call: any[]) => call[0] === 'stalled',
    );
    const stalledCallback = stalledCall?.[1];

    stalledCallback?.();

    expect(result.stalled()).toBe(true);
  });

  it('should update buffered when progress event fires', () => {
    const mockBuffered = {
      length: 1,
      start: vi.fn(() => 0),
      end: vi.fn(() => 100),
    } as unknown as TimeRanges;

    const mockEl = createMockMediaElement({ buffered: mockBuffered });
    const result = runInInjectionContext(injector, () => useMediaControls(() => mockEl));

    const progressCall = (mockEl.addEventListener as any).mock.calls.find(
      (call: any[]) => call[0] === 'progress',
    );
    const progressCallback = progressCall?.[1];

    progressCallback?.();

    expect(result.buffered()).toEqual([[0, 100]]);
  });

  it('should update isPictureInPicture when picture in picture events fire', () => {
    const mockEl = createMockMediaElement();
    const result = runInInjectionContext(injector, () => useMediaControls(() => mockEl));

    const enterPiPCall = (mockEl.addEventListener as any).mock.calls.find(
      (call: any[]) => call[0] === 'enterpictureinpicture',
    );
    const enterPiPCallback = enterPiPCall?.[1];

    const leavePiPCall = (mockEl.addEventListener as any).mock.calls.find(
      (call: any[]) => call[0] === 'leavepictureinpicture',
    );
    const leavePiPCallback = leavePiPCall?.[1];

    enterPiPCallback?.();
    expect(result.isPictureInPicture()).toBe(true);

    leavePiPCallback?.();
    expect(result.isPictureInPicture()).toBe(false);
  });

  it('should disable track when disableTrack is called with track id', () => {
    const mockTrack1 = { mode: 'showing' } as unknown as TextTrack;
    const mockEl = createMockMediaElement({
      textTracks: [mockTrack1] as unknown as TextTrackList,
    });
    const result = runInInjectionContext(injector, () => useMediaControls(() => mockEl));

    result.disableTrack(0);

    expect(mockTrack1.mode).toBe('disabled');
    expect(result.selectedTrack()).toBe(-1);
  });

  it('should disable all tracks when disableTrack is called without arguments', () => {
    const mockTrack1 = { mode: 'showing' } as unknown as TextTrack;
    const mockTrack2 = { mode: 'showing' } as unknown as TextTrack;
    const mockEl = createMockMediaElement({
      textTracks: [mockTrack1, mockTrack2] as unknown as TextTrackList,
    });
    const result = runInInjectionContext(injector, () => useMediaControls(() => mockEl));

    result.disableTrack();

    expect(mockTrack1.mode).toBe('disabled');
    expect(mockTrack2.mode).toBe('disabled');
    expect(result.selectedTrack()).toBe(-1);
  });

  it('should enable track and disable others when enableTrack is called', () => {
    const mockTrack1 = { mode: 'showing' } as unknown as TextTrack;
    const mockTrack2 = { mode: 'showing' } as unknown as TextTrack;
    const mockEl = createMockMediaElement({
      textTracks: [mockTrack1, mockTrack2] as unknown as TextTrackList,
    });
    const result = runInInjectionContext(injector, () => useMediaControls(() => mockEl));

    result.enableTrack(1);

    expect(mockTrack1.mode).toBe('disabled');
    expect(mockTrack2.mode).toBe('showing');
    expect(result.selectedTrack()).toBe(1);
  });

  it('should subscribe to source error events', () => {
    const mockEl = createMockMediaElement();
    const result = runInInjectionContext(injector, () => useMediaControls(() => mockEl));

    expect(result.onSourceError).toBeDefined();
    expect(typeof result.onSourceError).toBe('function');
  });

  it('should subscribe to playback error events', () => {
    const mockEl = createMockMediaElement();
    const result = runInInjectionContext(injector, () => useMediaControls(() => mockEl));

    expect(result.onPlaybackError).toBeDefined();
    expect(typeof result.onPlaybackError).toBe('function');
  });

  it('should handle null target gracefully', () => {
    const result = runInInjectionContext(injector, () => useMediaControls(() => null));

    expect(result.currentTime()).toBe(0);
    expect(result.duration()).toBe(0);
  });

  it('should accept tracks option without throwing', () => {
    const mockEl = createMockMediaElement();

    const tracks: UseMediaTextTrackSource[] = [
      {
        default: true,
        kind: 'subtitles',
        label: 'English',
        src: './subtitles.vtt',
        srcLang: 'en',
      },
    ];

    // Verify the API accepts tracks option without throwing
    expect(() => {
      runInInjectionContext(injector, () =>
        useMediaControls(() => mockEl, {
          document,
          tracks,
        }),
      );
    }).not.toThrow();
  });

  it('should update playing to false when waiting event fires', () => {
    const mockEl = createMockMediaElement();
    const result = runInInjectionContext(injector, () => useMediaControls(() => mockEl));

    // First set playing to true
    const playCall = (mockEl.addEventListener as any).mock.calls.find(
      (call: any[]) => call[0] === 'play',
    );
    const playCallback = playCall?.[1];
    playCallback?.();
    expect(result.playing()).toBe(true);

    // Then waiting should set it to false
    const waitingCall = (mockEl.addEventListener as any).mock.calls.find(
      (call: any[]) => call[0] === 'waiting',
    );
    const waitingCallback = waitingCall?.[1];
    waitingCallback?.();
    expect(result.playing()).toBe(false);
  });

  it('should update playing to false and ended to false when playing event fires', () => {
    const mockEl = createMockMediaElement();
    const result = runInInjectionContext(injector, () => useMediaControls(() => mockEl));

    // Set ended to true first
    const endedCall = (mockEl.addEventListener as any).mock.calls.find(
      (call: any[]) => call[0] === 'ended',
    );
    const endedCallback = endedCall?.[1];
    endedCallback?.();
    expect(result.ended()).toBe(true);

    // Then playing should reset both
    const playingCall = (mockEl.addEventListener as any).mock.calls.find(
      (call: any[]) => call[0] === 'playing',
    );
    const playingCallback = playingCall?.[1];
    playingCallback?.();
    expect(result.playing()).toBe(true);
    expect(result.ended()).toBe(false);
    expect(result.waiting()).toBe(false);
  });
});
