import type { ProduceCategory } from '../data/produce';

export type Role = 'buyer' | 'seller';

export type SaleType = 'retail' | 'wholesale' | 'both';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Listing {
  id: string;
  ownerToken: string;
  productId: string;
  productName: string;
  category: ProduceCategory;
  saleType: SaleType;
  retailPrice: number | null;
  wholesalePrice: number | null;
  quantityKg: number | null;
  phone: string;
  sellerName: string | null;
  note: string | null;
  lat: number;
  lng: number;
  createdAt: string;
  expiresAt: string;
  archivedAt: string | null;
}

export interface ListingDraft {
  productId: string;
  productName: string;
  category: ProduceCategory;
  saleType: SaleType;
  retailPrice: number | null;
  wholesalePrice: number | null;
  quantityKg: number | null;
  phone: string;
  sellerName: string | null;
  note: string | null;
  lat: number;
  lng: number;
}

export type DistanceMode = 'road' | 'straight';

/** A listing decorated with its distance from the buyer, once one is known. */
export interface MeasuredListing extends Listing {
  distanceKm: number | null;
  distanceMode: DistanceMode | null;
}

export interface Filters {
  /** Empty means "every product". */
  productIds: string[];
  categories: ProduceCategory[];
  saleType: SaleType | 'any';
  maxPrice: number | null;
  /** Road-distance ceiling from the buyer's location, in km. */
  radiusKm: number | null;
  query: string;
}

export const DEFAULT_FILTERS: Filters = {
  productIds: [],
  categories: [],
  saleType: 'any',
  maxPrice: null,
  radiusKm: null,
  query: '',
};
