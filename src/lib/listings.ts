import { ownerToken, supabase } from './supabase';
import type { ListingRow, MyListingRow } from './database.types';
import type { Listing, ListingDraft } from './types';
import { getProduce, type ProduceCategory } from '../data/produce';

// One string literal, not a concatenation: supabase-js parses this at the type
// level to infer the row shape, and only a literal survives that parse.
// owner_token is deliberately absent — the client has no SELECT privilege on it.
// prettier-ignore
const COLUMNS = 'id, product_id, product_name, category, sale_type, form, retail_price, wholesale_price, quantity_kg, phone, seller_name, note, lat, lng, created_at, expires_at, archived_at' as const;

/*
 * A row stores the crop's name and group as they stood when it was published,
 * so a listing still reads sensibly if the crop later leaves the catalogue.
 *
 * That copy must not outrank the catalogue while the crop is still in it. When
 * Սալաթ was corrected to Հազար, or Տարխուն to Թարխուն, every listing already on
 * the map would otherwise have kept the old spelling for its whole life, and a
 * crop moved between groups would go on being filtered under the group it left.
 * The catalogue wins where it still knows the id; the stored copy is the
 * fallback it was always meant to be.
 */
function toListing(row: ListingRow | MyListingRow): Listing {
  const current = getProduce(row.product_id);

  return {
    id: row.id,
    productId: row.product_id,
    productName: current?.hy ?? row.product_name,
    category: (current?.category ?? row.category) as ProduceCategory,
    saleType: row.sale_type as Listing['saleType'],
    form: (row.form ?? 'fresh') as Listing['form'],
    retailPrice: row.retail_price,
    wholesalePrice: row.wholesale_price,
    quantityKg: row.quantity_kg === null ? null : Number(row.quantity_kg),
    phone: row.phone,
    sellerName: row.seller_name,
    note: row.note,
    lat: row.lat,
    lng: row.lng,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    archivedAt: row.archived_at,
  };
}

/**
 * Every live listing. The expiration is enforced here as well as in the read
 * policy, so a listing leaves the map the moment it expires rather than when
 * the archive job next runs.
 */
export async function fetchActiveListings(): Promise<Listing[]> {
  const { data, error } = await supabase()
    .from('listings')
    .select(COLUMNS)
    .is('archived_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(2000);

  if (error) throw new Error(error.message);
  return data.map(toListing);
}

/**
 * This device's listings, live and archived, newest first.
 *
 * Goes through an RPC rather than a filtered table read: matching on
 * owner_token from the client would require read access to that column, and
 * anything the client can read off one row it can read off everybody's.
 */
export async function fetchMyListings(): Promise<Listing[]> {
  const { data, error } = await supabase().rpc('my_listings');

  if (error) throw new Error(error.message);
  return (data ?? []).map(toListing);
}

export async function createListing(draft: ListingDraft): Promise<Listing> {
  const duration = draft.durationDays ?? 30;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + duration);

  const { data, error } = await supabase()
    .from('listings')
    .insert({
      owner_token: ownerToken(),
      product_id: draft.productId,
      product_name: draft.productName,
      category: draft.category,
      sale_type: draft.saleType,
      form: draft.form,
      retail_price: draft.retailPrice,
      wholesale_price: draft.wholesalePrice,
      quantity_kg: draft.quantityKg,
      phone: draft.phone,
      seller_name: draft.sellerName,
      note: draft.note,
      lat: draft.lat,
      lng: draft.lng,
      expires_at: expiresAt.toISOString(),
    })
    .select(COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return toListing(data);
}

/**
 * Pulls a listing off the map early, before its expiration.
 *
 * Archiving is an RPC because it makes the row fail the public read policy, and
 * Postgres enforces that policy against the updated row — a direct UPDATE would
 * be rejected for the listing's own seller.
 */
export async function archiveListing(id: string): Promise<void> {
  const { data, error } = await supabase().rpc('archive_listing', { p_id: id });

  if (error) throw new Error(error.message);
  if (data !== true) throw new Error('Հայտարարությունը չգտնվեց կամ արդեն արխիվացված է');
}

/** Deletion is an RPC for the same reason archiving is. */
export async function deleteListing(id: string): Promise<void> {
  const { data, error } = await supabase().rpc('delete_listing', { p_id: id });

  if (error) throw new Error(error.message);
  if (data !== true) throw new Error('Հայտարարությունը չգտնվեց');
}

/**
 * The seller's three-digit recovery code, minted on first use and then stable
 * until they have nothing left on the map.
 *
 * The listing's phone number is the other half of the pair, and the server
 * reads it from the caller's own live listings rather than taking it as an
 * argument — otherwise anyone could point somebody else's number at their own
 * device. Returns null when this device has published nothing.
 */
export async function issueRecoveryCode(): Promise<string | null> {
  const { data, error } = await supabase().rpc('issue_recovery_code');

  if (error) throw new Error(error.message);
  return data ?? null;
}

/**
 * Re-files every listing published from `phone` onto this device.
 *
 * Nothing secret comes back: the server moves the rows to the token this
 * device is already sending, so a seller whose browser storage was wiped picks
 * up exactly where they left off. Returns how many listings were claimed, and
 * zero when the code is wrong.
 */
export async function claimListings(phone: string, code: string): Promise<number> {
  const { data, error } = await supabase().rpc('claim_listings', {
    p_phone: phone,
    p_code: code,
  });

  if (error) throw new Error(error.message);
  return data ?? 0;
}
