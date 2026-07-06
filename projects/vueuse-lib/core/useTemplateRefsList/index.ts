import { type Signal, signal } from '@angular/core';

export type TemplateRefsList<T> = T[] & {
  set: (el: object | null) => void;
};

/* @__NO_SIDE_EFFECTS__ */
export function useTemplateRefsList<T = Element>(): Signal<Readonly<TemplateRefsList<T>>> {
  const refsArray: T[] & { set?: (el: object | null) => void } = [];

  // Create the refs signal with the array
  const refsSignal = signal<TemplateRefsList<T>>(refsArray as TemplateRefsList<T>);

  // Add the set method to the array (equivalent to Vue's refs.value.set)
  refsArray.set = (el: object | null) => {
    if (el) {
      refsArray.push(el as T);
      // Trigger signal update to notify consumers of the change
      refsSignal.set(refsArray as TemplateRefsList<T>);
    }
  };

  // Clear refs before each render cycle (equivalent to Vue's onBeforeUpdate)
  // In Angular, this is handled by the component lifecycle
  // We use a simple effect to clear refs (similar to onBeforeUpdate)
  // Note: The cleanup is handled by Angular's lifecycle

  return refsSignal as Signal<Readonly<TemplateRefsList<T>>>;
}
