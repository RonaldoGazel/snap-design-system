/**
 * Stub — ported utility consumed by shared layer.
 * Full persons feature has not been ported yet.
 */

/**
 * Calcula as iniciais de um nome para exibição em avatares e cards.
 *
 * @param nome - O nome completo da pessoa
 * @returns As iniciais calculadas (máximo 2 caracteres)
 */
export function calcularIniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);

  if (partes.length === 0 || partes[0] === '') {
    return '';
  }

  if (partes.length === 1) {
    return partes[0][0].toUpperCase();
  }

  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}
