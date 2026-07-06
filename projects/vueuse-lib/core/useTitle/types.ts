import type { SignalOrValue } from '@cyia/ngx-vueuse/shared';
import type { ConfigurableDocument } from '../_configurable';

export type UseTitleOptionsBase = {
  /**
   * Restore the original title when unmounted
   * @param originTitle original title
   * @returns restored title
   */
  restoreOnUnmount?:
    | false
    | ((originalTitle: string, currentTitle: string) => string | null | undefined);
} & (
  | {
      /**
       * Observe `document.title` changes using MutationObserve
       * Cannot be used together with `titleTemplate` option.
       *
       * @default false
       */
      observe?: boolean;
    }
  | {
      /**
       * The template string to parse the title (e.g., '%s | My Website')
       * Cannot be used together with `observe` option.
       *
       * @default '%s'
       */
      titleTemplate?: SignalOrValue<string> | ((title: string) => string);
    }
);

export type UseTitleOptions = ConfigurableDocument & UseTitleOptionsBase;

export type UseTitleReturn = ReturnType<typeof import('@cyia/ngx-vueuse/shared').toRef>;
