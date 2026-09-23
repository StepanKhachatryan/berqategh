import { supabase } from './supabase';

/**
 * A seller's permission to be offered seed, chemicals, machinery and the rest,
 * by the platform, about the crops they sell.
 *
 * Opt-in and nothing else. A phone number on a listing is there so buyers can
 * call about that harvest, and it is wiped when the listing ends; keeping it
 * afterwards and using it to advertise is a different purpose, which Armenian
 * law allows only with the seller's consent. So the box starts unticked, the
 * wording says plainly what happens, and the version of that wording is stored
 * with every consent so it is known later what was agreed to.
 *
 * Change the wording, change the version - and change what the database
 * comment in 0017_marketing_contacts.sql says about it.
 */
export const CONSENT_VERSION = '2026-09-23';

/** Where the seller form keeps the seller's phone, name and last answer. */
export const SELLER_MEMORY_KEY = 'berqategh.seller';

/** After a withdrawal, the next form starts unticked: the latest answer is no. */
export function forgetOffersAnswer(): void {
  try {
    const raw = localStorage.getItem(SELLER_MEMORY_KEY);
    if (raw) {
      localStorage.setItem(SELLER_MEMORY_KEY, JSON.stringify({ ...JSON.parse(raw), offers: false }));
    }
  } catch {
    // Storage refused or corrupt; the server side is what counts.
  }
}

export const CONSENT_LABEL = 'Ուզում եմ ստանալ առաջարկներ իմ բերքի համար';

export const CONSENT_DETAIL =
  'ԲերքաՏեղը կպահի ձեր հեռախոսահամարը և բերքի տեսակը նաև հայտարարության ավարտից ' +
  'հետո և կարող է զանգել կամ գրել ձեզ սերմերի, պարարտանյութի, տեխնիկայի և այլ ' +
  'գյուղատնտեսական ծառայությունների առաջարկներով։ Ձեր համարը չի փոխանցվի ' +
  'գովազդատուներին։ Կարող եք հրաժարվել ցանկացած պահի «Իմ հայտարարությունները» բաժնից։';

/**
 * Records consent against a listing this device just published. The server
 * reads the number, crop and place from that listing itself, so nothing
 * personal is sent from here - and a number that is not the caller's own
 * listing cannot be enrolled.
 */
export async function recordMarketingConsent(listingId: string): Promise<boolean> {
  const { data, error } = await supabase().rpc('record_marketing_consent', {
    p_listing_id: listingId,
    p_version: CONSENT_VERSION,
  });
  if (error) throw new Error(error.message);
  return data === true;
}

/** Whether this seller - by device, or by the number on their live listings - has opted in. */
export async function marketingConsentStatus(): Promise<boolean> {
  const { data, error } = await supabase().rpc('marketing_consent_status');
  if (error) throw new Error(error.message);
  return data === true;
}

/** Removes the seller's number from the list, for every crop at once. */
export async function withdrawMarketingConsent(): Promise<number> {
  const { data, error } = await supabase().rpc('withdraw_marketing_consent');
  if (error) throw new Error(error.message);
  return data ?? 0;
}
