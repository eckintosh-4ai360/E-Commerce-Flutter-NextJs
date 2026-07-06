'use client';

import { SlidersHorizontal, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';

import {
  catalogSorts,
  hasRefinements,
  shopHref,
  type CatalogFilters,
  type CatalogSort,
} from '@/lib/catalog-params';
import { storeConfig } from '@/lib/store-config';

type Facet = { value: string; count: number };

type FilterProps = {
  filters: CatalogFilters;
  colors: Facet[];
  sizes: Facet[];
  maxPrice: number;
};

function FilterForm({
  filters,
  colors,
  sizes,
  maxPrice,
  onApplied,
}: FilterProps & { onApplied?: () => void }) {
  const router = useRouter();
  const [selectedColors, setSelectedColors] = useState(filters.colors);
  const [selectedSizes, setSelectedSizes] = useState(filters.sizes);
  const [minPrice, setMinPrice] = useState(filters.minPrice?.toString() ?? '');
  const [maxPriceInput, setMaxPriceInput] = useState(filters.maxPrice?.toString() ?? '');

  useEffect(() => {
    setSelectedColors(filters.colors);
    setSelectedSizes(filters.sizes);
    setMinPrice(filters.minPrice?.toString() ?? '');
    setMaxPriceInput(filters.maxPrice?.toString() ?? '');
  }, [filters]);

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

  const apply = (event?: FormEvent) => {
    event?.preventDefault();
    const min = minPrice.trim() === '' ? null : Math.max(0, Number(minPrice));
    const max = maxPriceInput.trim() === '' ? null : Math.max(0, Number(maxPriceInput));
    router.push(
      shopHref(filters, {
        colors: selectedColors,
        sizes: selectedSizes,
        minPrice: Number.isFinite(min) ? min : null,
        maxPrice: Number.isFinite(max) ? max : null,
      }),
      { scroll: false },
    );
    onApplied?.();
  };

  const reset = () => {
    router.push(
      shopHref(filters, { colors: [], sizes: [], minPrice: null, maxPrice: null }),
      { scroll: false },
    );
    onApplied?.();
  };

  return (
    <form className="filters-panel" onSubmit={apply}>
      <div className="filter-group">
        <h3>Price ({storeConfig.currencySymbol})</h3>
        <div className="price-inputs">
          <label className="visually-hidden" htmlFor="min-price">Minimum price</label>
          <input
            id="min-price"
            className="input"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="0"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
          />
          <span aria-hidden="true">–</span>
          <label className="visually-hidden" htmlFor="max-price">Maximum price</label>
          <input
            id="max-price"
            className="input"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={String(maxPrice)}
            value={maxPriceInput}
            onChange={(event) => setMaxPriceInput(event.target.value)}
          />
        </div>
      </div>

      {colors.length > 0 ? (
        <div className="filter-group" role="group" aria-labelledby="filter-colour">
          <h3 id="filter-colour">Colour</h3>
          {colors.map((facet) => (
            <label key={facet.value} className="filter-option">
              <input
                type="checkbox"
                checked={selectedColors.includes(facet.value)}
                onChange={() => setSelectedColors((list) => toggle(list, facet.value))}
              />
              {facet.value} ({facet.count})
            </label>
          ))}
        </div>
      ) : null}

      {sizes.length > 0 ? (
        <div className="filter-group" role="group" aria-labelledby="filter-size">
          <h3 id="filter-size">Size</h3>
          {sizes.map((facet) => (
            <label key={facet.value} className="filter-option">
              <input
                type="checkbox"
                checked={selectedSizes.includes(facet.value)}
                onChange={() => setSelectedSizes((list) => toggle(list, facet.value))}
              />
              {facet.value} ({facet.count})
            </label>
          ))}
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
        <button type="submit" className="btn btn-primary btn-sm" style={{ flex: 1 }}>
          Apply
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={reset}>
          Reset
        </button>
      </div>
    </form>
  );
}

export function FiltersSidebar(props: FilterProps) {
  return (
    <aside className="filters-sidebar" aria-label="Filters">
      <FilterForm {...props} />
    </aside>
  );
}

export function FiltersDrawerButton(props: FilterProps) {
  const [open, setOpen] = useState(false);
  const active = hasRefinements(props.filters);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost btn-sm filters-drawer-toggle"
        onClick={() => setOpen(true)}
        aria-expanded={open}
      >
        <SlidersHorizontal size={15} /> Filters{active ? ' •' : ''}
      </button>
      {open ? (
        <div className="overlay" style={{ placeItems: 'stretch' }} onClick={() => setOpen(false)}>
          <div
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="drawer__head">
              <h2>Filters</h2>
              <button type="button" className="icon-btn" aria-label="Close filters" onClick={() => setOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="drawer__body">
              <FilterForm {...props} onApplied={() => setOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function SortSelect({ filters }: { filters: CatalogFilters }) {
  const router = useRouter();
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span>Sort:</span>
      <select
        className="select"
        value={filters.sort}
        onChange={(event) =>
          router.push(shopHref(filters, { sort: event.target.value as CatalogSort }), {
            scroll: false,
          })
        }
      >
        {catalogSorts.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
