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
  retail_price: number | null;
  wholesale_price: number | null;
  quantity_kg: number | null;
  phone: string;
  seller_name: string | null;
  note: string | null;
  lat: number;
  lng: number;
  created_at: string;
  expires_at: string;
  archived_at: string | null;
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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      my_listings: { Args: Record<string, never>; Returns: MyListingRow[] };
      archive_listing: { Args: { p_id: string }; Returns: boolean };
      delete_listing: { Args: { p_id: string }; Returns: boolean };
      archive_expired_listings: { Args: never; Returns: number };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
