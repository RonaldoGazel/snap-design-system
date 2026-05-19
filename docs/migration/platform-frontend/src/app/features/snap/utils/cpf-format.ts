/**
 * Progressively format a string of digits as a Brazilian CPF.
 *
 * Mask: `000.000.000-00`
 *
 * The function strips any non-digit characters, truncates to 11 digits,
 * and applies formatting separators at the correct positions:
 *   - After digit 3: `.`
 *   - After digit 6: `.`
 *   - After digit 9: `-`
 *
 * Examples:
 *   "1"           → "1"
 *   "123"         → "123"
 *   "1234"        → "123.4"
 *   "1234567"     → "123.456.7"
 *   "12345678901" → "123.456.789-01"
 */
export function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }

  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}
