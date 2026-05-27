// Catalog filter parsing and URL building. No server imports, so client
// components can use it too.

export const catalogSorts = [
  { value: 'featured', label: 'Featured' },
  { value: 'latest', label: 'Newest first' },
  { value: 'popularity', label: 'Most popular' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
] as const;

export type CatalogSort = (typeof catalogSorts)[number]['value'];
export type CatalogFeatured = 'sale' | 'new' | 'best';

export type CatalogFilters = {
  category: string | null;
  search: string | null;
  featured: CatalogFeatured | null;
  sort: CatalogSort;
  minPrice: number | null;
  maxPrice: number | null;
  colors: string[];
  sizes: string[];
};

type ParamSource = URLSearchParams | Record<string, string | string[] | undefined>;

function readAll(params: ParamSource, key: string): string[] {
  if (params instanceof URLSearchParams) {
    return params.getAll(key);
  }
  const value = params[key];
  if (value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function readOne(params: ParamSource, key: string) {
  const value = readAll(params, key)[0]?.trim();
  return value ? value.slice(0, 100) : null;
}

function readPrice(params: ParamSource, key: string) {
  const value = readOne(params, key);
  if (value === null) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function readList(params: ParamSource, key: string) {
  return readAll(params, key)
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export function parseCatalogFilters(params: ParamSource): CatalogFilters {
  const category = readOne(params, 'category');
  const featured = readOne(params, 'featured');
  const sort = readOne(params, 'sort');

  return {
    category: category && category !== 'All' ? category : null,
    search: readOne(params, 'search') ?? readOne(params, 'q'),
    featured:
      featured === 'sale' || featured === 'new' || featured === 'best' ? featured : null,
    sort: catalogSorts.some((option) => option.value === sort)
      ? (sort as CatalogSort)
      : 'featured',
    minPrice: readPrice(params, 'minPrice'),
    maxPrice: readPrice(params, 'maxPrice'),
    colors: readList(params, 'color'),
    sizes: readList(params, 'size'),
  };
}

/** Builds a /shop URL from filters, applying overrides. */
export function shopHref(filters: CatalogFilters, overrides: Partial<CatalogFilters> = {}) {
  const next = { ...filters, ...overrides };
  const params = new URLSearchParams();
  if (next.search) params.set('q', next.search);
  if (next.category) params.set('category', next.category);
  if (next.featured) params.set('featured', next.featured);
  if (next.sort !== 'featured') params.set('sort', next.sort);
  if (next.minPrice !== null) params.set('minPrice', String(next.minPrice));
  if (next.maxPrice !== null) params.set('maxPrice', String(next.maxPrice));
  for (const color of next.colors) params.append('color', color);
  for (const size of next.sizes) params.append('size', size);
  const query = params.toString();
  return query ? `/shop?${query}` : '/shop';
}

export function hasRefinements(filters: CatalogFilters) {
  return (
    filters.colors.length > 0 ||
    filters.sizes.length > 0 ||
    filters.minPrice !== null ||
    filters.maxPrice !== null
  );
}
