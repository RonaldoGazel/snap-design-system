import { describe, expect, it } from 'vitest';

import { DateFormatPipe } from './date-format.pipe';

describe('DateFormatPipe', () => {
  const pipe = new DateFormatPipe();

  it('should return "-" for null', () => {
    expect(pipe.transform(null)).toBe('-');
  });

  it('should return "-" for undefined', () => {
    expect(pipe.transform(undefined)).toBe('-');
  });

  it('should return "-" for empty string', () => {
    expect(pipe.transform('')).toBe('-');
  });

  it('should return "-" for invalid date string', () => {
    expect(pipe.transform('not-a-date')).toBe('-');
  });

  it('should format a Date object in long format by default', () => {
    const date = new Date(2025, 0, 15, 14, 30);
    const result = pipe.transform(date);
    expect(result).toContain('15/01/2025');
    expect(result).toContain('14:30');
  });

  it('should format an ISO string in long format', () => {
    const result = pipe.transform('2025-06-20T10:45:00', 'long');
    expect(result).toContain('20/06/2025');
    expect(result).toContain('10:45');
  });

  it('should format a Date in short format (dd/MM/yyyy)', () => {
    const date = new Date(2025, 5, 20, 10, 45);
    expect(pipe.transform(date, 'short')).toBe('20/06/2025');
  });

  it('should return "agora mesmo" for less than 60 seconds ago', () => {
    const date = new Date(Date.now() - 30_000);
    expect(pipe.transform(date, 'relative')).toBe('agora mesmo');
  });

  it('should return "ha 1 minuto" for ~1 minute ago', () => {
    const date = new Date(Date.now() - 90_000);
    expect(pipe.transform(date, 'relative')).toMatch(/h[aá] 1 minuto/);
  });

  it('should return "ha X minutos" for several minutes ago', () => {
    const date = new Date(Date.now() - 5 * 60_000);
    expect(pipe.transform(date, 'relative')).toMatch(/h[aá] 5 minutos/);
  });

  it('should return "ha 1 hora" for ~1 hour ago', () => {
    const date = new Date(Date.now() - 3_600_000);
    expect(pipe.transform(date, 'relative')).toMatch(/h[aá] 1 hora/);
  });

  it('should return "ha X horas" for several hours ago', () => {
    const date = new Date(Date.now() - 3 * 3_600_000);
    expect(pipe.transform(date, 'relative')).toMatch(/h[aá] 3 horas/);
  });

  it('should return "ha 1 dia" for ~1 day ago', () => {
    const date = new Date(Date.now() - 24 * 3_600_000);
    expect(pipe.transform(date, 'relative')).toMatch(/h[aá] 1 dia/);
  });

  it('should fall back to long format for dates > 30 days ago', () => {
    const date = new Date(Date.now() - 31 * 24 * 3_600_000);
    const result = pipe.transform(date, 'relative');
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it('should fall back to long format for future dates', () => {
    const date = new Date(Date.now() + 3_600_000);
    const result = pipe.transform(date, 'relative');
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});
