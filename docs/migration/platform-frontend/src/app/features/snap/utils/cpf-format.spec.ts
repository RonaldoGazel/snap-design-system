import { describe, expect, it } from 'vitest';

import { formatCpf } from './cpf-format';

describe('formatCpf', () => {
  it('should return empty string for empty input', () => {
    expect(formatCpf('')).toBe('');
  });

  it('should return digits as-is for 1-3 digits', () => {
    expect(formatCpf('1')).toBe('1');
    expect(formatCpf('12')).toBe('12');
    expect(formatCpf('123')).toBe('123');
  });

  it('should insert first dot after 3 digits', () => {
    expect(formatCpf('1234')).toBe('123.4');
    expect(formatCpf('123456')).toBe('123.456');
  });

  it('should insert second dot after 6 digits', () => {
    expect(formatCpf('1234567')).toBe('123.456.7');
    expect(formatCpf('123456789')).toBe('123.456.789');
  });

  it('should insert dash after 9 digits', () => {
    expect(formatCpf('1234567890')).toBe('123.456.789-0');
    expect(formatCpf('12345678901')).toBe('123.456.789-01');
  });

  it('should strip non-digit characters before formatting', () => {
    expect(formatCpf('123.456')).toBe('123.456');
    expect(formatCpf('123.456.789-01')).toBe('123.456.789-01');
    expect(formatCpf('abc123def456')).toBe('123.456');
  });

  it('should truncate to 11 digits max', () => {
    expect(formatCpf('123456789012345')).toBe('123.456.789-01');
  });

  it('should preserve digit order', () => {
    expect(formatCpf('52998224725')).toBe('529.982.247-25');
  });
});
