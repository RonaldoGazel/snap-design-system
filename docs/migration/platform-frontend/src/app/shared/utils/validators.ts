import { MIN_PASSWORD_LENGTH, PASSWORD_REGEX } from './constants';

// ---------------------------------------------------------------------------
// CPF Validation & Formatting
// ---------------------------------------------------------------------------

/** Strip every non-digit character from a string. */
function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Validate a Brazilian CPF (Cadastro de Pessoas Físicas).
 *
 * Rules applied:
 *  1. Strip non-numeric characters.
 *  2. Must be exactly 11 digits.
 *  3. Reject all-same-digit sequences (e.g. 111.111.111-11).
 *  4. Validate both check digits using the standard mod-11 algorithm.
 */
export function isValidCPF(cpf: string): boolean {
  const digits = digitsOnly(cpf);

  if (digits.length !== 11) {
    return false;
  }

  // Reject all-same-digit CPFs
  if (/^(\d)\1{10}$/.test(digits)) {
    return false;
  }

  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(digits[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== Number(digits[9])) {
    return false;
  }

  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number(digits[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== Number(digits[10])) {
    return false;
  }

  return true;
}

/**
 * Format a numeric string as a CPF: `XXX.XXX.XXX-XX`.
 *
 * Non-digit characters are stripped before formatting.
 * If the input does not contain exactly 11 digits the raw digits are returned.
 */
export function formatCPF(cpf: string): string {
  const digits = digitsOnly(cpf);

  if (digits.length !== 11) {
    return digits;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

// ---------------------------------------------------------------------------
// Password Validation
// ---------------------------------------------------------------------------

/**
 * Check whether a password satisfies the complexity requirements
 * defined by `PASSWORD_REGEX` in constants.
 */
export function isValidPassword(password: string): boolean {
  return PASSWORD_REGEX.test(password);
}

/**
 * Return an array of human-readable error messages (in Portuguese) describing
 * which password complexity requirements are not met.
 *
 * An empty array means the password satisfies all requirements.
 */
export function getPasswordStrengthErrors(password: string): string[] {
  const errors: string[] = [];

  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push('Mínimo de 8 caracteres');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Pelo menos uma letra maiúscula');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Pelo menos uma letra minúscula');
  }

  if (!/\d/.test(password)) {
    errors.push('Pelo menos um número');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Pelo menos um caractere especial');
  }

  return errors;
}
