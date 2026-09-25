import { supabase } from './supabase';

/**
 * The sellers who opted in to agricultural offers while the form still asked
 * (September 2026, consent text version 2026-09-23 - see
 * 0017_marketing_contacts.sql). The form no longer asks; what is left is the
 * way out they were promised in «Իմ հայտարարությունները».
 */

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
