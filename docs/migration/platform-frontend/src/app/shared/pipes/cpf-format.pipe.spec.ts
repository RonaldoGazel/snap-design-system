import { describe, expect, it } from 'vitest';

import { CpfFormatPipe } from './cpf-format.pipe';

describe('CpfFormatPipe', () => {
  const pipe = new CpfFormatPipe();

  it('should return "-" for null', () => {
    expect(pipe.transform(null)).toBe('-');
  });

  it('should return "-" for undefined', () => {
    expect(pipe.transform(undefined)).toBe('-');
  });

  it('should return "-" for empty string', () => {
    expect(pipe.transform('')).toBe('-');
  });

  it('should format a valid 11-digit CPF', () => {
    expect(pipe.transform('52998224725')).toBe('529.982.247-25');
  });

  it('should handle already formatted CPF', () => {
    expect(pipe.transform('529.982.247-25')).toBe('529.982.247-25');
  });

  it('should return raw digits for invalid length', () => {
    expect(pipe.transform('123')).toBe('123');
  });
});
