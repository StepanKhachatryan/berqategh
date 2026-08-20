import { ownerToken, supabase } from './supabase';
import type { ListingRow, MyListingRow } from './database.types';
import type { Listing, ListingDraft } from './types';
import type { ProduceCategory } from '../data/produce';

// One string literal, not a concatenation: supabase-js parses this at the type
// level to infer the row shape, and only a literal survives that parse.
// owner_token is deliberately absent — the client has no SELECT privilege on it.
// prettier-ignore
const COLUMNS = 'id, product_id, product_name, category, sale_type, form, retail_price, wholesale_price, quantity_kg, phone, seller_name, note, lat, lng, created_at, expires_at, archived_at' as const;

function toListing(row: ListingRow | MyListingRow): Listing {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    category: row.category as ProduceCategory,
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
 * Every live listing. The five-day window is enforced here as well as in the read
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
    })
    .select(COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return toListing(data);
}

/**
 * Pulls a listing off the map early, before its five days are up.
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

/** Puts an archived listing back on the map with a fresh five-day window. */
export async function republishListing(listing: Listing): Promise<Listing> {
  return createListing({
    productId: listing.productId,
    productName: listing.productName,
    category: listing.category,
    saleType: listing.saleType,
    form: listing.form,
    retailPrice: listing.retailPrice,
    wholesalePrice: listing.wholesalePrice,
    quantityKg: listing.quantityKg,
    phone: listing.phone,
    sellerName: listing.sellerName,
    note: listing.note,
    lat: listing.lat,
    lng: listing.lng,
  });
}
