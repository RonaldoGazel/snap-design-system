import { describe, expect, it } from 'vitest';

import { formatCPF, getPasswordStrengthErrors, isValidCPF, isValidPassword } from './validators';

// ---------------------------------------------------------------------------
// isValidCPF
// ---------------------------------------------------------------------------

describe('isValidCPF', () => {
  it('should accept a valid CPF (digits only)', () => {
    // 529.982.247-25 is a well-known valid CPF
    expect(isValidCPF('52998224725')).toBe(true);
  });

  it('should accept a valid CPF with formatting', () => {
    expect(isValidCPF('529.982.247-25')).toBe(true);
  });

  it('should reject CPFs with wrong length', () => {
    expect(isValidCPF('1234567890')).toBe(false); // 10 digits
    expect(isValidCPF('123456789012')).toBe(false); // 12 digits
    expect(isValidCPF('')).toBe(false);
  });

  it('should reject all-same-digit CPFs', () => {
    for (let d = 0; d <= 9; d++) {
      const cpf = String(d).repeat(11);
      expect(isValidCPF(cpf)).toBe(false);
    }
  });

  it('should reject a CPF with invalid first check digit', () => {
    // 529.982.247-35 — first check digit changed from 2 to 3
    expect(isValidCPF('52998224735')).toBe(false);
  });

  it('should reject a CPF with invalid second check digit', () => {
    // 529.982.247-26 — second check digit changed from 5 to 6
    expect(isValidCPF('52998224726')).toBe(false);
  });

  it('should accept another known valid CPF', () => {
    // 111.444.777-35 — valid per mod-11 algorithm
    expect(isValidCPF('11144477735')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// formatCPF
// ---------------------------------------------------------------------------

describe('formatCPF', () => {
  it('should format 11 digits as XXX.XXX.XXX-XX', () => {
    expect(formatCPF('52998224725')).toBe('529.982.247-25');
  });

  it('should strip non-digits before formatting', () => {
    expect(formatCPF('529.982.247-25')).toBe('529.982.247-25');
  });

  it('should return raw digits when length is not 11', () => {
    expect(formatCPF('123')).toBe('123');
    expect(formatCPF('')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// isValidPassword
// ---------------------------------------------------------------------------

describe('isValidPassword', () => {
  it('should accept a password meeting all requirements', () => {
    expect(isValidPassword('Abcdef1!')).toBe(true);
  });

  it('should reject a password shorter than 8 characters', () => {
    expect(isValidPassword('Ab1!xyz')).toBe(false); // 7 chars
  });

  it('should reject a password without uppercase', () => {
    expect(isValidPassword('abcdef1!')).toBe(false);
  });

  it('should reject a password without lowercase', () => {
    expect(isValidPassword('ABCDEF1!')).toBe(false);
  });

  it('should reject a password without a digit', () => {
    expect(isValidPassword('Abcdefg!')).toBe(false);
  });

  it('should reject a password without a special character', () => {
    expect(isValidPassword('Abcdefg1')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getPasswordStrengthErrors
// ---------------------------------------------------------------------------

describe('getPasswordStrengthErrors', () => {
  it('should return empty array for a valid password', () => {
    expect(getPasswordStrengthErrors('Abcdef1!')).toEqual([]);
  });

  it('should report missing length', () => {
    const errors = getPasswordStrengthErrors('Ab1!');
    expect(errors).toContain('Mínimo de 8 caracteres');
  });

  it('should report missing uppercase', () => {
    const errors = getPasswordStrengthErrors('abcdef1!');
    expect(errors).toContain('Pelo menos uma letra maiúscula');
  });

  it('should report missing lowercase', () => {
    const errors = getPasswordStrengthErrors('ABCDEF1!');
    expect(errors).toContain('Pelo menos uma letra minúscula');
  });

  it('should report missing digit', () => {
    const errors = getPasswordStrengthErrors('Abcdefgh!');
    expect(errors).toContain('Pelo menos um número');
  });

  it('should report missing special character', () => {
    const errors = getPasswordStrengthErrors('Abcdefg1');
    expect(errors).toContain('Pelo menos um caractere especial');
  });

  it('should report all errors for an empty string', () => {
    const errors = getPasswordStrengthErrors('');
    expect(errors).toHaveLength(5);
  });
});
