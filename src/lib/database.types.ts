/**
 * Shape of the `listings` table and the RPCs the browser is allowed to call,
 * mirroring supabase/migrations.
 *
 * Regenerate after a schema change with:
 *   npx supabase gen types typescript --project-id <ref> --schema public
 */

/**
 * The columns a client may read. `owner_token` is intentionally missing: the
 * anon role has no SELECT privilege on it, because knowing another device's
 * token would be enough to archive or delete that seller's listings.
 */
export type ListingRow = {
  id: string;
  product_id: string;
  product_name: string;
  category: string;
  sale_type: string;
  form: string;
  retail_price: number | null;
  wholesale_price: number | null;
  quantity_kg: number | null;
  // Cleared the moment the listing leaves the map — see migration 0012.
  phone: string | null;
  seller_name: string | null;
  note: string | null;
  lat: number;
  lng: number;
  created_at: string;
  expires_at: string;
  archived_at: string | null;
};

/**
 * Insert-only. The anon role has no SELECT privilege on this table at all, so
 * there is no Row type worth writing — the browser records events and can
 * never read back how the platform is doing.
 */
export type EventInsert = {
  session_id: string;
  kind: 'visit' | 'role' | 'listing_open' | 'call_click';
  role?: 'buyer' | 'seller' | null;
  device?: 'phone' | 'computer' | null;
  visitor_marz?: string | null;
  listing_marz?: string | null;
  product_id?: string | null;
};

/** What `my_listings()` returns — the same columns, own rows only. */
export type MyListingRow = ListingRow;

/** Writes carry the token even though reads never return it. */
export type ListingInsert = ListingRow extends infer R
  ? Omit<R & { owner_token: string }, 'id' | 'created_at' | 'expires_at' | 'archived_at'> &
      Partial<Pick<ListingRow, 'id' | 'created_at' | 'expires_at' | 'archived_at'>>
  : never;

export type Database = {
  // supabase-js reads this to pick the right PostgREST behaviour.
  __InternalSupabase: {
    PostgrestVersion: '14.15';
  };
  public: {
    Tables: {
      listings: {
        Row: ListingRow;
        Insert: ListingInsert;
        Update: never;
        Relationships: [];
      };
      events: {
        Row: EventInsert & { id: number; at: string };
        Insert: EventInsert;
        Update: never;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      my_listings: { Args: Record<string, never>; Returns: MyListingRow[] };
      archive_listing: { Args: { p_id: string }; Returns: boolean };
      delete_listing: { Args: { p_id: string }; Returns: boolean };
      archive_expired_listings: { Args: never; Returns: number };
      issue_recovery_code: { Args: Record<string, never>; Returns: string | null };
      claim_listings: { Args: { p_phone: string; p_code: string }; Returns: number };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
