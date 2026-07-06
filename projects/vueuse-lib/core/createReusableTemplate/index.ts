import { signal } from '@angular/core';

type ObjectLiteralWithPotentialObjectLiterals = Record<string, Record<string, any> | undefined>;

export interface CreateReusableTemplateOptions<Props extends Record<string, any>> {
  /**
   * Inherit attrs from reuse component.
   *
   * @default true
   */
  inheritAttrs?: boolean;
  /**
   * Name for the reuse component (useful for devtools).
   */
  name?: string;
  /**
   * Props definition for reuse component.
   */
  props?: Props;
}

/**
 * This function creates `define` and `reuse` components in pair,
 * It also allow to pass a generic to bind with type.
 *
 * @see https://vueuse.org/createReusableTemplate
 *
 * @__NO_SIDE_EFFECTS__
 */
export function createReusableTemplate<
  Bindings extends Record<string, any>,
  MapSlotNameToSlotProps extends ObjectLiteralWithPotentialObjectLiterals = Record<
    'default',
    undefined
  >,
>(options: CreateReusableTemplateOptions<Bindings> = {}) {
  const { inheritAttrs = true, name = 'ReusableTemplate', props } = options;

  const render = signal<
    ((bindings: Bindings & { $slots: MapSlotNameToSlotProps }) => any) | undefined
  >(undefined);

  const define = {
    name: `${name}.define`,
    renderSlot: (slot: (bindings: Bindings & { $slots: MapSlotNameToSlotProps }) => any) => {
      render.set(slot);
    },
  } as unknown as {
    name: string;
    renderSlot: (slot: (bindings: Bindings & { $slots: MapSlotNameToSlotProps }) => any) => void;
  };

  const reuse = {
    name: `${name}.reuse`,
    render: (bindings: any) => {
      const renderer = render();
      if (!renderer) throw new Error('[VueUse] Failed to find the definition of reusable template');
      const vnode = renderer?.(bindings);

      return inheritAttrs && vnode?.length === 1 ? vnode[0] : vnode;
    },
  } as unknown as {
    name: string;
    render: (bindings: Bindings & { $slots: MapSlotNameToSlotProps }) => any;
  };

  return { define, reuse };
}
