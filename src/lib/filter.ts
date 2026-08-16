import { getProduce } from '../data/produce';
import type { Filters, Listing, MeasuredListing } from './types';

export type SortKey = 'distance' | 'price' | 'newest';

export const SORT_LABELS: Record<SortKey, string> = {
  distance: 'Ամենամոտը',
  price: 'Ամենաէժանը',
  newest: 'Ամենանորը',
};

/** Whether a listing sells through the channel the buyer asked for. */
function matchesSaleType(listing: Listing, wanted: Filters['saleType']): boolean {
  if (wanted === 'any') return true;
  return listing.saleType === wanted || listing.saleType === 'both';
}

/**
 * The price to judge a listing by. A buyer filtering for wholesale cares about
 * the wholesale price even on a listing that also sells retail, so the channel
 * they picked decides which number the ceiling applies to.
 */
export function relevantPrice(listing: Listing, wanted: Filters['saleType']): number | null {
  if (wanted === 'retail') return listing.retailPrice;
  if (wanted === 'wholesale') return listing.wholesalePrice;

  const prices = [listing.retailPrice, listing.wholesalePrice].filter(
    (price): price is number => price !== null,
  );
  return prices.length > 0 ? Math.min(...prices) : null;
}

export function applyFilters(listings: MeasuredListing[], filters: Filters): MeasuredListing[] {
  const query = filters.query.trim().toLowerCase();
  const products = new Set(filters.productIds);
  const categories = new Set(filters.categories);

  return listings.filter((listing) => {
    if (!matchesSaleType(listing, filters.saleType)) return false;
    if (products.size > 0 && !products.has(listing.productId)) return false;
    if (categories.size > 0 && !categories.has(listing.category)) return false;

    if (filters.maxPrice !== null) {
      const price = relevantPrice(listing, filters.saleType);
      if (price === null || price > filters.maxPrice) return false;
    }

    // A listing whose distance has not come back yet stays visible rather than
    // flickering in once routing resolves.
    if (filters.radiusKm !== null && listing.distanceKm !== null) {
      if (listing.distanceKm > filters.radiusKm) return false;
    }

    if (query) {
      const produce = getProduce(listing.productId);
      const haystack = [
        listing.productName,
        listing.sellerName ?? '',
        listing.note ?? '',
        ...(produce?.aliases ?? []),
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    return true;
  });
}

export function sortListings(
  listings: MeasuredListing[],
  key: SortKey,
  saleType: Filters['saleType'],
): MeasuredListing[] {
  const sorted = [...listings];

  if (key === 'distance') {
    sorted.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  } else if (key === 'price') {
    sorted.sort(
      (a, b) =>
        (relevantPrice(a, saleType) ?? Infinity) - (relevantPrice(b, saleType) ?? Infinity),
    );
  } else {
    sorted.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  return sorted;
}

export function countActiveFilters(filters: Filters): number {
  let count = 0;
  if (filters.productIds.length > 0) count += 1;
  if (filters.categories.length > 0) count += 1;
  if (filters.saleType !== 'any') count += 1;
  if (filters.maxPrice !== null) count += 1;
  if (filters.radiusKm !== null) count += 1;
  if (filters.query.trim()) count += 1;
  return count;
}
