import { watch, type WatchHandle, type WatchStopHandle } from '@cyia/ngx-vueuse/patch';
export { watch as watchDeep };
export type { WatchHandle, WatchStopHandle };

export type WatchCallback<T, OT = T> = (value: T, oldValue: OT) => void;
export interface WatchDeepOptions {
  immediate?: boolean;
}
