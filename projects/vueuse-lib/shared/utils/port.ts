function cacheStringFunction<T extends (str: string) => string>(fn: T): T {
  const cache: Record<string, string> = Object.create(null);
  return ((str: string) => {
    const hit = cache[str];
    return hit || (cache[str] = fn(str));
  }) as T;
}

const hyphenateRE = /\B([A-Z])/g;
export const hyphenate = cacheStringFunction((str: string) =>
  str.replace(hyphenateRE, '-$1').toLowerCase(),
);

const camelizeRE = /-(\w)/g;
export const camelize = cacheStringFunction((str: string): string =>
  str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : '')),
);
