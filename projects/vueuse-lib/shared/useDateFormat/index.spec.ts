import { describe, expect, it } from 'vitest';
import { useDateFormat, formatDate, normalizeDate } from './index';

describe('useDateFormat', () => {
  it('should format date with default format', () => {
    const result = useDateFormat(new Date('2024-01-15T10:30:45'));

    expect(result()).toBeDefined();
    expect(result().length).toBeGreaterThan(0);
  });

  it('should format date with custom format', () => {
    const result = useDateFormat(new Date('2024-01-15'), 'YYYY-MM-DD');

    expect(result()).toBe('2024-01-15');
  });

  it('should handle timestamp input', () => {
    const result = useDateFormat(1705312245000, 'YYYY-MM-DD');

    expect(result()).toBeDefined();
  });

  it('should handle string date input', () => {
    const result = useDateFormat('2024-01-15T10:30:45', 'HH:mm:ss');

    expect(result()).toBeDefined();
  });
});

describe('formatDate', () => {
  it('should format year', () => {
    const date = new Date('2024-06-15T10:30:45');
    expect(formatDate(date, 'YYYY')).toBe('2024');
    expect(formatDate(date, 'YY')).toBe('24');
  });

  it('should format month', () => {
    const date = new Date('2024-06-15T10:30:45');
    expect(formatDate(date, 'M')).toBe('6');
    expect(formatDate(date, 'MM')).toBe('06');
  });

  it('should format day', () => {
    const date = new Date('2024-06-15T10:30:45');
    expect(formatDate(date, 'D')).toBe('15');
    expect(formatDate(date, 'DD')).toBe('15');
  });

  it('should format time', () => {
    const date = new Date('2024-06-15T10:30:45');
    expect(formatDate(date, 'HH')).toBe('10');
    expect(formatDate(date, 'mm')).toBe('30');
    expect(formatDate(date, 'ss')).toBe('45');
  });

  it('should format 12-hour time', () => {
    const date = new Date('2024-06-15T00:05:00');
    expect(formatDate(date, 'h')).toBe('12');
    expect(formatDate(date, 'hh')).toBe('12');
  });

  it('should format 12-hour time for PM', () => {
    const date = new Date('2024-06-15T15:05:05');
    expect(formatDate(date, 'hh')).toBe('03');
  });

  it('should format milliseconds', () => {
    const date = new Date('2024-06-15T10:30:45.999');
    expect(formatDate(date, 'SSS')).toBe('999');
  });

  it('should format day of week', () => {
    const date = new Date('2024-06-15T10:30:45');
    expect(formatDate(date, 'd')).toBeDefined();
  });

  it('should format day of week with locales', () => {
    const date = new Date('2024-06-15T10:30:45');
    expect(formatDate(date, 'ddd', { locales: 'en-US' })).toBeDefined();
    expect(formatDate(date, 'dddd', { locales: 'en-US' })).toBeDefined();
  });

  it('should format month name', () => {
    const date = new Date('2024-01-15T10:30:45');
    expect(formatDate(date, 'MMM', { locales: 'en-US' })).toBe('Jan');
    expect(formatDate(date, 'MMMM', { locales: 'en-US' })).toBe('January');
  });

  it('should format ordinal day', () => {
    const date = new Date('2024-01-01T10:30:45');
    expect(formatDate(date, 'Do', { locales: 'en-US' })).toBeDefined();
  });

  it('should format year ordinal', () => {
    const date = new Date('2024-12-23T10:30:45');
    expect(formatDate(date, 'Yo', { locales: 'en-US' })).toBeDefined();
  });

  it('should handle meridiem AM', () => {
    const date = new Date('2024-06-15T03:05:05');
    expect(formatDate(date, 'hh:mm:ss A')).toBe('03:05:05 AM');
    expect(formatDate(date, 'hh:mm:ss a')).toBe('03:05:05 am');
    expect(formatDate(date, 'hh:mm:ss AA')).toBe('03:05:05 A.M.');
    expect(formatDate(date, 'hh:mm:ss aa')).toBe('03:05:05 a.m.');
  });

  it('should handle meridiem PM', () => {
    const date = new Date('2024-06-15T15:05:05');
    expect(formatDate(date, 'hh:mm:ss A')).toBe('03:05:05 PM');
    expect(formatDate(date, 'hh:mm:ss a')).toBe('03:05:05 pm');
    expect(formatDate(date, 'hh:mm:ss AA')).toBe('03:05:05 P.M.');
    expect(formatDate(date, 'hh:mm:ss aa')).toBe('03:05:05 p.m.');
  });

  it('should handle custom meridiem function', () => {
    const date = new Date('2024-06-15T03:05:05');
    const customMeridiem = (
      hours: number,
      _minutes: number,
      isLowercase?: boolean,
      hasPeriod?: boolean,
    ) => {
      const m = hours > 11 ? (isLowercase ? 'μμ' : 'ΜΜ') : isLowercase ? 'πμ' : 'ΠΜ';
      return hasPeriod ? m.split('').reduce((acc, curr) => (acc += `${curr}.`), '') : m;
    };
    expect(formatDate(date, 'hh:mm:ss A', { customMeridiem })).toBe('03:05:05 ΠΜ');
  });

  it('should handle timezone format', () => {
    const date = new Date('2024-06-15T03:05:05');
    expect(formatDate(date, 'hh:mm:ss z')).toBeDefined();
    expect(formatDate(date, 'hh:mm:ss zz')).toBeDefined();
    expect(formatDate(date, 'hh:mm:ss zzz')).toBeDefined();
    expect(formatDate(date, 'hh:mm:ss zzzz')).toBeDefined();
  });

  it('should format date with various separators', () => {
    const date = new Date('2024-01-15T10:24:24');
    expect(formatDate(date, 'YYYY/MM/DD')).toBe('2024/01/15');
    expect(formatDate(date, 'DD-MM-YYYY')).toBe('15-01-2024');
  });

  it('should handle short year', () => {
    const date = new Date('2024-01-15T10:24:00');
    expect(formatDate(date, 'YY-M-D')).toBe('24-1-15');
  });

  it('should handle single digit time', () => {
    const date = new Date('2024-01-15T08:05:00');
    expect(formatDate(date, 'H:m:s')).toBe('8:5:0');
  });

  it('should handle date with timezone info', () => {
    const date = new Date('2022-01-01T15:05:05');
    expect(formatDate(date, 'YYYY/MM/DD dd', { locales: 'en-US' })).toBeDefined();
  });
});

describe('normalizeDate', () => {
  it('should handle Date object', () => {
    const date = new Date('2024-01-15');
    const result = normalizeDate(date);
    expect(result).toBeInstanceOf(Date);
    expect(result.getTime()).toBe(date.getTime());
  });

  it('should handle undefined', () => {
    const result = normalizeDate(undefined);
    expect(result).toBeInstanceOf(Date);
  });

  it('should handle null', () => {
    // @ts-expect-error test null
    const result = normalizeDate(null);
    expect(result.toString()).toBe('Invalid Date');
  });

  it('should handle string date', () => {
    const result = normalizeDate('2024-01-15');
    expect(result).toBeInstanceOf(Date);
  });

  it('should handle timestamp', () => {
    const result = normalizeDate(1705312245000);
    expect(result).toBeInstanceOf(Date);
  });
});
