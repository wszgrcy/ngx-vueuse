import { computed } from '@angular/core';
import type { SignalOrValue } from '../utils/types';
import { toValue } from '../utils/general';

export type DateLike = Date | number | string | undefined;

export interface UseDateFormatOptions {
  /**
   * The locale(s) to used for dd/ddd/dddd/MMM/MMMM format
   */
  locales?: SignalOrValue<Intl.LocalesArgument>;

  /**
   * A custom function to re-modify the way to display meridiem
   */
  customMeridiem?: (
    hours: number,
    minutes: number,
    isLowercase?: boolean,
    hasPeriod?: boolean,
  ) => string;
}

const REGEX_PARSE =
  /* #__PURE__ */ /^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[T\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/i;
const REGEX_FORMAT =
  /* #__PURE__ */ /[YMDHhms]o|\[([^\]]+)\]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a{1,2}|A{1,2}|m{1,2}|s{1,2}|Z{1,2}|z{1,4}|SSS/g;

function defaultMeridiem(
  hours: number,
  minutes: number,
  isLowercase?: boolean,
  hasPeriod?: boolean,
) {
  let m = hours < 12 ? 'AM' : 'PM';
  if (hasPeriod) m = m.split('').reduce((acc, curr) => (acc += `${curr}.`), '');
  return isLowercase ? m.toLowerCase() : m;
}

function formatOrdinal(num: number) {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = num % 100;
  return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

export function formatDate(date: Date, formatStr: string, options: UseDateFormatOptions = {}) {
  const years = date.getFullYear();
  const month = date.getMonth();
  const days = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const milliseconds = date.getMilliseconds();
  const day = date.getDay();
  const meridiem = options.customMeridiem ?? defaultMeridiem;
  const stripTimeZone = (dateString: string) => dateString.split(' ')[1] ?? '';
  const locales = toValue(options.locales);
  const matches: Record<string, () => string | number> = {
    Yo: () => formatOrdinal(years),
    YY: () => String(years).slice(-2),
    YYYY: () => years,
    M: () => month + 1,
    Mo: () => formatOrdinal(month + 1),
    MM: () => `${month + 1}`.padStart(2, '0'),
    MMM: () => date.toLocaleDateString(locales, { month: 'short' }),
    MMMM: () => date.toLocaleDateString(locales, { month: 'long' }),
    D: () => String(days),
    Do: () => formatOrdinal(days),
    DD: () => `${days}`.padStart(2, '0'),
    H: () => String(hours),
    Ho: () => formatOrdinal(hours),
    HH: () => `${hours}`.padStart(2, '0'),
    h: () => `${hours % 12 || 12}`.padStart(1, '0'),
    ho: () => formatOrdinal(hours % 12 || 12),
    hh: () => `${hours % 12 || 12}`.padStart(2, '0'),
    m: () => String(minutes),
    mo: () => formatOrdinal(minutes),
    mm: () => `${minutes}`.padStart(2, '0'),
    s: () => String(seconds),
    so: () => formatOrdinal(seconds),
    ss: () => `${seconds}`.padStart(2, '0'),
    SSS: () => `${milliseconds}`.padStart(3, '0'),
    d: () => day,
    dd: () => date.toLocaleDateString(locales, { weekday: 'narrow' }),
    ddd: () => date.toLocaleDateString(locales, { weekday: 'short' }),
    dddd: () => date.toLocaleDateString(locales, { weekday: 'long' }),
    A: () => meridiem(hours, minutes),
    AA: () => meridiem(hours, minutes, false, true),
    a: () => meridiem(hours, minutes, true),
    aa: () => meridiem(hours, minutes, true, true),
    z: () => stripTimeZone(date.toLocaleDateString(locales, { timeZoneName: 'shortOffset' })),
    zz: () => stripTimeZone(date.toLocaleDateString(locales, { timeZoneName: 'shortOffset' })),
    zzz: () => stripTimeZone(date.toLocaleDateString(locales, { timeZoneName: 'shortOffset' })),
    zzzz: () => stripTimeZone(date.toLocaleDateString(locales, { timeZoneName: 'longOffset' })),
  };
  return formatStr.replace(REGEX_FORMAT, (match, $1) => $1 ?? matches[match]?.() ?? match);
}

export function normalizeDate(date: DateLike) {
  if (date === null) return new Date(Number.NaN); // null is invalid
  if (date === undefined) return new Date();
  if (date instanceof Date) return new Date(date);
  if (typeof date === 'string' && !/Z$/i.test(date)) {
    const d = date.match(REGEX_PARSE) as any;
    if (d) {
      const m = d[2] - 1 || 0;
      const ms = (d[7] || '0').substring(0, 3);
      return new Date(d[1], m, d[3] || 1, d[4] || 0, d[5] || 0, d[6] || 0, ms);
    }
  }

  return new Date(date);
}

export type UseDateFormatReturn = ReturnType<typeof computed<string>>;

/**
 * Get the formatted date according to the string of tokens passed in.
 * Returns a computed signal that updates when the date changes.
 */
/**
 * @__NO_SIDE_EFFECTS__
 */
export function useDateFormat(
  date: SignalOrValue<DateLike>,
  formatStr: SignalOrValue<string> = 'HH:mm:ss',
  options: UseDateFormatOptions = {},
): UseDateFormatReturn {
  return computed(() => formatDate(normalizeDate(toValue(date)), toValue(formatStr), options));
}
