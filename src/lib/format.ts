const amd = new Intl.NumberFormat('hy-AM', { maximumFractionDigits: 0 });

export function formatPrice(value: number): string {
  return `${amd.format(value)} ֏`;
}

export function formatQuantity(kg: number): string {
  return kg >= 1000 ? `${(kg / 1000).toLocaleString('hy-AM')} տ` : `${kg} կգ`;
}

/** "Դեռ 7 ժ 20 ր" — how much of the 24h window is left. */
export function timeLeft(expiresAt: string, now: number = Date.now()): string {
  const ms = new Date(expiresAt).getTime() - now;
  if (ms <= 0) return 'Ժամկետը լրացել է';

  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `Դեռ ${minutes} ր`;
  return `Դեռ ${hours} ժ ${minutes} ր`;
}

export function isExpiringSoon(expiresAt: string, now: number = Date.now()): boolean {
  const ms = new Date(expiresAt).getTime() - now;
  return ms > 0 && ms < 3 * 3600 * 1000;
}

/** Turns the 8 local digits into the +374XXXXXXXX the database stores. */
export function toE164(localDigits: string): string {
  return `+374${localDigits.replace(/\D/g, '')}`;
}

/** "+37493123456" → "93 12 34 56" for display next to the fixed +374 chip. */
export function formatLocalPhone(e164: string): string {
  const digits = e164.replace(/^\+374/, '');
  return digits.replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4');
}

export const PHONE_LOCAL_LENGTH = 8;

export function isValidLocalPhone(localDigits: string): boolean {
  return new RegExp(`^[1-9]\\d{${PHONE_LOCAL_LENGTH - 1}}$`).test(localDigits);
}
