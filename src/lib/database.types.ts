/**
 * Shape of the `listings` table, mirroring supabase/migrations.
 *
 * Regenerate after a schema change with:
 *   npx supabase gen types typescript --project-id <ref> --schema public
 */
export type ListingRow = {
  id: string;
  owner_token: string;
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

export type ListingInsert = Omit<ListingRow, 'id' | 'created_at' | 'expires_at' | 'archived_at'> &
  Partial<Pick<ListingRow, 'id' | 'created_at' | 'expires_at' | 'archived_at'>>;

export type ListingUpdate = Partial<ListingRow>;

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
        Update: ListingUpdate;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
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
