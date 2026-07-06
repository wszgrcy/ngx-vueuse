import type { Signal, WritableSignal } from '@angular/core';
import { computed, effect, isSignal, signal } from '@angular/core';
import { noop } from '@cyia/ngx-vueuse/shared';
import { syncRef } from '@cyia/ngx-vueuse/shared';
import { clamp } from '@cyia/ngx-vueuse/shared';

type MaybeSignal<T> = Signal<T> | T;

function toVal<T>(v: MaybeSignal<T>): T {
  return isSignal(v) ? v() : v;
}

export interface UseOffsetPaginationOptions {
  /**
   * Total number of items.
   */
  total?: MaybeSignal<number>;

  /**
   * The number of items to display per page.
   * @default 10
   */
  pageSize?: MaybeSignal<number>;

  /**
   * The current page number.
   * @default 1
   */
  page?: MaybeSignal<number>;

  /**
   * Callback when the `page` change.
   */
  onPageChange?: (returnValue: UseOffsetPaginationReturn) => unknown;

  /**
   * Callback when the `pageSize` change.
   */
  onPageSizeChange?: (returnValue: UseOffsetPaginationReturn) => unknown;

  /**
   * Callback when the `pageCount` change.
   */
  onPageCountChange?: (returnValue: UseOffsetPaginationReturn) => unknown;
}

export interface UseOffsetPaginationReturn {
  currentPage: WritableSignal<number>;
  currentPageSize: WritableSignal<number>;
  pageCount: Signal<number>;
  isFirstPage: Signal<boolean>;
  isLastPage: Signal<boolean>;
  prev: () => void;
  next: () => void;
}

export interface UseOffsetPaginationReturnInternal extends UseOffsetPaginationReturn {
  _cleanup?: () => void;
}

export type UseOffsetPaginationInfinityPageReturn = Omit<UseOffsetPaginationReturn, 'isLastPage'>;

export function useOffsetPagination(
  options: Omit<UseOffsetPaginationOptions, 'total'>,
): UseOffsetPaginationInfinityPageReturn;
export function useOffsetPagination(options: UseOffsetPaginationOptions): UseOffsetPaginationReturn;
export function useOffsetPagination(
  options: UseOffsetPaginationOptions,
): UseOffsetPaginationReturnInternal {
  const {
    total = Number.POSITIVE_INFINITY,
    pageSize = 10,
    page = 1,
    onPageChange = noop,
    onPageSizeChange = noop,
    onPageCountChange = noop,
  } = options;

  // Replicate useClamp logic inline to ensure writable signals
  const currentPageSize: WritableSignal<number> = signal(
    clamp(toVal(pageSize), 1, Number.POSITIVE_INFINITY),
  );

  const pageCount = computed(() => Math.max(1, Math.ceil(toVal(total) / currentPageSize())));

  const currentPage: WritableSignal<number> = signal(clamp(toVal(page), 1, toVal(pageCount)));

  const isFirstPage = computed(() => currentPage() === 1);
  const isLastPage = computed(() => currentPage() === pageCount());

  // syncRef requires WritableSignal on both sides
  // In Vue, isReadonly check determines direction; in Angular we check if writable
  function isWritable<T>(s: Signal<T>): s is WritableSignal<T> {
    return 'set' in s;
  }

  if (isSignal(page) && isWritable(page)) {
    syncRef(page, currentPage, {
      direction: 'ltr',
    });
  }

  if (isSignal(pageSize) && isWritable(pageSize)) {
    syncRef(pageSize, currentPageSize, {
      direction: 'ltr',
    });
  }

  function prev() {
    currentPage.set(currentPage() - 1);
  }

  function next() {
    currentPage.set(currentPage() + 1);
  }

  const returnValue = {
    currentPage,
    currentPageSize,
    pageCount,
    isFirstPage,
    isLastPage,
    prev,
    next,
  };

  // Watch for changes (equivalent to Vue's watch with immediate: false)
  let currentPageValue = currentPage();
  let currentPageSizeValue = currentPageSize();
  let pageCountValue = pageCount();

  const cleanup1 = effect(() => {
    const val = currentPage();
    if (val !== currentPageValue) {
      currentPageValue = val;
      onPageChange(returnValue);
    }
  });

  const cleanup2 = effect(() => {
    const val = currentPageSize();
    if (val !== currentPageSizeValue) {
      currentPageSizeValue = val;
      onPageSizeChange(returnValue);
    }
  });

  const cleanup3 = effect(() => {
    const val = pageCount();
    if (val !== pageCountValue) {
      pageCountValue = val;
      onPageCountChange(returnValue);
    }
  });

  // Return cleanup function if needed
  return {
    ...returnValue,
    _cleanup: () => {
      cleanup1.destroy();
      cleanup2.destroy();
      cleanup3.destroy();
    },
  } as UseOffsetPaginationReturnInternal;
}
