/**
 * Formats an ISO 8601 date according to the active locale.
 * en: MM/dd/yyyy HH:mm:ss
 * pt: dd/MM/yyyy HH:mm:ss
 */
export function formatAuditDate(isoDate: string, lang: string): string {
  const date = new Date(isoDate);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');

  if (lang.startsWith('pt')) {
    return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
  }
  return `${mm}/${dd}/${yyyy} ${hh}:${min}:${ss}`;
}
