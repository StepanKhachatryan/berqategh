const amd = new Intl.NumberFormat('hy-AM', { maximumFractionDigits: 0 });

export function formatPrice(value: number): string {
  return `${amd.format(value)} ֏`;
}

export function formatQuantity(kg: number): string {
  return kg >= 1000 ? `${(kg / 1000).toLocaleString('hy-AM')} տ` : `${kg} կգ`;
}

/** How long a listing has left, coarsening as the window widens. */
export function timeLeft(expiresAt: string, now: number = Date.now()): string {
  const ms = new Date(expiresAt).getTime() - now;
  if (ms <= 0) return 'Ժամկետը լրացել է';

  const totalMinutes = Math.floor(ms / 60000);
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;

  // "Դեռ 118 ժ" would be true and useless; days are the main unit
  // sellers track, and minutes only start mattering in the last hour.
  if (days > 0) return `Դեռ ${days} օր ${hours} ժ`;
  if (totalHours === 0) return `Դեռ ${minutes} ր`;
  return `Դեռ ${totalHours} ժ ${minutes} ր`;
}

const dayMonth = new Intl.DateTimeFormat('hy-AM', { day: 'numeric', month: 'long' });
const dayMonthYear = new Intl.DateTimeFormat('hy-AM', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export interface PostedAge {
  /** "Այսօր", "3 օր առաջ" — what the buyer reads first. */
  relative: string;
  /** The calendar date, but only once it adds something. */
  exact: string | null;
}

/**
 * How long a listing has been standing, for the buyer.
 *
 * Buyers used to be shown how long it had left, which sounds useful and is
 * quietly misleading: a farmer who posts for three months and sells out in five
 * days leaves behind a listing still promising eighty-five days of fruit that
 * no longer exists. Nothing about the remaining window tells a buyer whether
 * the produce is still there.
 *
 * Age does. This morning is worth a call; six weeks ago is a gamble; and the
 * buyer is the one who should get to weigh that. The seller still sees the
 * expiry on their own listings, where it is the number that matters.
 *
 * Days are counted between calendar dates rather than in 24-hour blocks, so
 * something posted late last night reads as "Երեկ" and not as "Այսօր".
 */
export function postedAge(createdAt: string, now: number = Date.now()): PostedAge {
  const created = new Date(createdAt);

  // A clock skewed a few minutes ahead should not produce "in 1 day".
  if (created.getTime() > now - 3600 * 1000) return { relative: 'Հենց նոր', exact: null };

  const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((midnight(new Date(now)) - midnight(created)) / 86400000);

  if (days <= 0) return { relative: 'Այսօր', exact: null };
  if (days === 1) return { relative: 'Երեկ', exact: null };

  // Inside a week the date is just arithmetic the reader has to do; past that
  // "23 օր առաջ" stops landing as a date and the real one starts helping.
  const exact =
    days < 7
      ? null
      : created.getFullYear() === new Date(now).getFullYear()
        ? dayMonth.format(created)
        : dayMonthYear.format(created);

  return { relative: `${days} օր առաջ`, exact };
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
