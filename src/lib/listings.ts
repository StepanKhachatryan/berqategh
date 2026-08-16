import { ownerToken, supabase } from './supabase';
import type { ListingRow } from './database.types';
import type { Listing, ListingDraft } from './types';
import type { ProduceCategory } from '../data/produce';

// One string literal, not a concatenation: supabase-js parses this at the type
// level to infer the row shape, and only a literal survives that parse.
// prettier-ignore
const COLUMNS = 'id, owner_token, product_id, product_name, category, sale_type, retail_price, wholesale_price, quantity_kg, phone, seller_name, note, lat, lng, created_at, expires_at, archived_at' as const;

function toListing(row: ListingRow): Listing {
  return {
    id: row.id,
    ownerToken: row.owner_token,
    productId: row.product_id,
    productName: row.product_name,
    category: row.category as ProduceCategory,
    saleType: row.sale_type as Listing['saleType'],
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
 * Every live listing. The 24h window is enforced here as well as in the read
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

/** This device's listings, live and archived, newest first. */
export async function fetchMyListings(): Promise<Listing[]> {
  const { data, error } = await supabase()
    .from('listings')
    .select(COLUMNS)
    .eq('owner_token', ownerToken())
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);
  return data.map(toListing);
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

/** Pulls a listing off the map early, before its 24h are up. */
export async function archiveListing(id: string): Promise<void> {
  const { error } = await supabase()
    .from('listings')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function deleteListing(id: string): Promise<void> {
  const { error } = await supabase().from('listings').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/** Puts an archived listing back on the map with a fresh 24h window. */
export async function republishListing(listing: Listing): Promise<Listing> {
  return createListing({
    productId: listing.productId,
    productName: listing.productName,
    category: listing.category,
    saleType: listing.saleType,
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
