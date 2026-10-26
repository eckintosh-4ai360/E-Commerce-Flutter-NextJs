'use client';

import { ArchiveRestore, Check, ImageIcon, Package, PackageX, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type DragEvent, type ReactNode } from 'react';

import { useAuth } from '@/components/providers/AuthProvider';
import { errorMessage } from '@/lib/client/api';
import { formatMoney } from '@/lib/money';

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice: number | null;
  imagePath: string;
  galleryImages: string;
  category: string;
  tags: string;
  rating: number;
  reviewCount: number;
  stockQuantity: number;
  inventoryManaged: boolean;
  inStock: boolean;
  sizes: string;
  colors: string;
  isNew: boolean;
  isBestSeller: boolean;
  isArchived: boolean;
  orderCount: number;
};

type FormState = {
  name: string;
  description: string;
  price: string;
  originalPrice: string;
  images: string[];
  category: string;
  tags: string;
  rating: string;
  reviewCount: string;
  stockQuantity: string;
  inStock: boolean;
  sizes: string;
  colors: string;
  isNew: boolean;
  isBestSeller: boolean;
  isArchived: boolean;
};

const createEmptyForm = (): FormState => ({
  name: '',
  description: '',
  price: '',
  originalPrice: '',
  images: [],
  category: '',
  tags: '',
  rating: '4.5',
  reviewCount: '0',
  stockQuantity: '50',
  inStock: true,
  sizes: '',
  colors: '',
  isNew: false,
  isBestSeller: false,
  isArchived: false,
});

function parseList(value: string) {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function splitList(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal" role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <div className="admin-modal__head">
          <h2>{title}</h2>
          <button type="button" className="admin-icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="admin-modal__body">{children}</div>
      </div>
    </div>
  );
}

function ImageUploader({ values, onChange }: { values: string[]; onChange: (paths: string[]) => void }) {
  const { authedFetch } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [url, setUrl] = useState('');

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return;
    const remaining = 5 - values.length;
    if (remaining <= 0 || files.length > remaining) {
      setError(`You can add ${remaining <= 0 ? 'no more' : `only ${remaining} more`} image${remaining === 1 ? '' : 's'}.`);
      return;
    }

    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        setError(`${file.name} is not a JPG, PNG, WebP or GIF image.`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} must be under 5 MB.`);
        return;
      }
    }

    setError('');
    setUploading(true);
    const uploaded: string[] = [];
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const data = await authedFetch<{ imagePath: string }>('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });
        if (!values.includes(data.imagePath) && !uploaded.includes(data.imagePath)) {
          uploaded.push(data.imagePath);
        }
      }
    } catch (caught) {
      setError(errorMessage(caught, 'One of the images could not be uploaded.'));
    } finally {
      if (uploaded.length > 0) onChange([...values, ...uploaded].slice(0, 5));
      setUploading(false);
    }
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    if (!uploading) void uploadFiles(Array.from(event.dataTransfer.files));
  };

  const addUrl = () => {
    const next = url.trim();
    const valid =
      (next.startsWith('/') && !next.startsWith('//') && !next.includes('..')) ||
      /^https:\/\/[^\s"'<>]+$/.test(next);
    if (!valid) {
      setError('Enter an https:// image URL or a safe /products/ path.');
      return;
    }
    if (values.includes(next)) {
      setError('That image is already in the product gallery.');
      return;
    }
    if (values.length >= 5) {
      setError('A product can have at most 5 images.');
      return;
    }
    onChange([...values, next]);
    setUrl('');
    setError('');
  };

  const makeMain = (index: number) => {
    const selected = values[index];
    onChange([selected, ...values.filter((_, currentIndex) => currentIndex !== index)]);
  };

  return (
    <div className="admin-field">
      <span className="admin-label">Product images ({values.length}/5)</span>
      <span style={{ fontSize: 12, color: 'var(--a-text-3)' }}>
        The first image is the main image used on product cards. Add up to four alternate views or variants.
      </span>

      {values.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
          {values.map((value, index) => (
            <div key={value} style={{ border: index === 0 ? '2px solid var(--a-gold)' : '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: 8, background: '#08284f' }}>
              <div style={{ position: 'relative', aspectRatio: '1 / 1', borderRadius: 7, overflow: 'hidden', background: '#111' }}>
                <img src={value} alt={`Product image ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {index === 0 ? <span className="admin-tag" style={{ position: 'absolute', top: 6, left: 6, background: 'var(--a-gold)', color: '#111' }}>Main</span> : null}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                {index > 0 ? (
                  <button type="button" className="admin-btn admin-btn--sm" style={{ flex: 1 }} onClick={() => makeMain(index)}>
                    Make main
                  </button>
                ) : <span style={{ flex: 1, alignSelf: 'center', fontSize: 11, color: 'var(--a-text-3)' }}>Shown across the store</span>}
                <button type="button" className="admin-icon-btn" onClick={() => onChange(values.filter((_, currentIndex) => currentIndex !== index))} aria-label={`Remove product image ${index + 1}`}>
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {values.length < 5 ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => !uploading && fileRef.current?.click()}
          onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && !uploading && fileRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          style={{
            border: `2px dashed ${dragging ? '#d4af37' : 'rgba(255,255,255,0.12)'}`,
            borderRadius: 12,
            background: dragging ? 'rgba(255,176,0,0.08)' : '#08284f',
            cursor: uploading ? 'progress' : 'pointer',
            minHeight: 110,
            display: 'grid',
            placeItems: 'center',
            padding: 12,
            textAlign: 'center',
            color: 'var(--a-text-3)',
          }}
        >
          {uploading ? (
            <div style={{ display: 'grid', justifyItems: 'center', gap: 10 }}>
              <div className="admin-spinner" />
              <span>Uploading images…</span>
            </div>
          ) : (
            <div>
              <ImageIcon size={32} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
              <div style={{ fontWeight: 500, color: 'var(--a-text-2)' }}>Drop images here or click to browse</div>
              <div style={{ fontSize: 12 }}>Select up to {5 - values.length} · JPG, PNG, WebP, GIF · Max 5 MB each</div>
            </div>
          )}
          <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} onChange={(event) => {
            void uploadFiles(Array.from(event.target.files ?? []));
            event.target.value = '';
          }} />
        </div>
      ) : null}

      {values.length < 5 ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="admin-input"
            placeholder="…or add an https:// image URL or /products/ path"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addUrl();
              }
            }}
          />
          <button type="button" className="admin-btn" onClick={addUrl} disabled={!url.trim()}>
            Add
          </button>
        </div>
      ) : null}
      {error ? <span style={{ fontSize: 12, color: 'var(--a-red)' }}>{error}</span> : null}
    </div>
  );
}

export default function ProductsPage() {
  const { authedFetch } = useAuth();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(createEmptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(() => {
    return authedFetch<{ products: Product[] }>('/api/admin/products')
      .then((data) => setProducts(data.products))
      .catch((caught) => setLoadError(errorMessage(caught)));
  }, [authedFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm(createEmptyForm());
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setFormError(null);
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      originalPrice: product.originalPrice ? String(product.originalPrice) : '',
      images: Array.from(new Set([product.imagePath, ...parseList(product.galleryImages)])).filter(Boolean).slice(0, 5),
      category: product.category,
      tags: parseList(product.tags).join(', '),
      rating: String(product.rating),
      reviewCount: String(product.reviewCount),
      stockQuantity: String(product.stockQuantity || (product.inStock ? 50 : 0)),
      inStock: product.inventoryManaged ? product.stockQuantity > 0 : product.inStock,
      sizes: parseList(product.sizes).join(', '),
      colors: parseList(product.colors).join(', '),
      isNew: product.isNew,
      isBestSeller: product.isBestSeller,
      isArchived: product.isArchived,
    });
    setShowModal(true);
  };

  const save = async () => {
    setSaving(true);
    setFormError(null);
    const stockQty = form.inStock ? Math.max(0, Number(form.stockQuantity) || 0) : 0;
    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      originalPrice: form.originalPrice.trim() ? Number(form.originalPrice) : null,
      imagePath: form.images[0] ?? '',
      galleryImages: form.images.slice(1),
      category: form.category,
      tags: splitList(form.tags),
      sizes: splitList(form.sizes),
      colors: splitList(form.colors),
      rating: Number(form.rating),
      reviewCount: Number(form.reviewCount),
      stockQuantity: stockQty,
      isNew: form.isNew,
      isBestSeller: form.isBestSeller,
      isArchived: form.isArchived,
    };
    try {
      await authedFetch(editing ? `/api/admin/products/${editing.id}` : '/api/admin/products', {
        method: editing ? 'PUT' : 'POST',
        body: payload,
      });
      setShowModal(false);
      setNotice({ tone: 'success', text: editing ? `${payload.name} updated.` : `${payload.name} created.` });
      await load();
    } catch (caught) {
      setFormError(errorMessage(caught, 'Could not save the product.'));
    } finally {
      setSaving(false);
    }
  };

  const restore = async (product: Product) => {
    try {
      await authedFetch(`/api/admin/products/${product.id}`, { method: 'PUT', body: { isArchived: false } });
      setNotice({ tone: 'success', text: `${product.name} restored to the store.` });
      await load();
    } catch (caught) {
      setNotice({ tone: 'error', text: errorMessage(caught) });
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      const result = await authedFetch<{ message: string }>(`/api/admin/products/${deleting.id}`, { method: 'DELETE' });
      setNotice({ tone: 'success', text: result.message });
      await load();
    } catch (caught) {
      setNotice({ tone: 'error', text: errorMessage(caught) });
    } finally {
      setDeleting(null);
    }
  };

  const needle = search.toLowerCase();
  const visible = (products ?? []).filter(
    (product) =>
      (showArchived || !product.isArchived) &&
      (product.name.toLowerCase().includes(needle) || product.category.toLowerCase().includes(needle)),
  );
  const activeCount = (products ?? []).filter((product) => !product.isArchived).length;
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Products</h1>
          <p>{activeCount} product{activeCount === 1 ? '' : 's'} in your catalog</p>
        </div>
        <button type="button" className="admin-btn admin-btn--primary" onClick={openNew}>
          <Plus size={16} /> Add product
        </button>
      </div>

      {notice ? <div className={`admin-alert admin-alert--${notice.tone}`} role="status">{notice.text}</div> : null}
      {loadError ? <div className="admin-alert admin-alert--error">{loadError}</div> : null}

      <div className="admin-toolbar" style={{ alignItems: 'center' }}>
        <div className="admin-search">
          <Search size={15} />
          <input className="admin-input" placeholder="Search products…" value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search products" />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--a-text-2)', cursor: 'pointer' }}>
          <input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} /> Show archived
        </label>
      </div>

      {!products ? (
        loadError ? null : <div className="admin-center" style={{ minHeight: 200 }}><div className="admin-spinner" /></div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>{['', 'Product', 'Category', 'Price', 'Stock', 'Flags', 'Actions'].map((heading) => <th key={heading}>{heading}</th>)}</tr>
            </thead>
            <tbody>
              {visible.map((product) => (
                <tr key={product.id} className={product.isArchived ? 'is-muted' : undefined}>
                  <td style={{ width: 60 }}>
                    <div className="admin-thumb">
                      {product.imagePath ? <img src={product.imagePath} alt="" /> : <ImageIcon size={18} color="#333" />}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{product.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--a-text-3)' }}>ID {product.id} · {product.orderCount} order line{product.orderCount === 1 ? '' : 's'}</div>
                  </td>
                  <td><span className="admin-tag" style={{ background: 'rgba(255,176,0,0.1)', color: 'var(--a-gold)' }}>{product.category}</span></td>
                  <td style={{ fontWeight: 600 }}>
                    {formatMoney(product.price)}
                    {product.originalPrice ? <div style={{ fontSize: 11, color: 'var(--a-text-3)', textDecoration: 'line-through', fontWeight: 400 }}>{formatMoney(product.originalPrice)}</div> : null}
                  </td>
                  <td>
                    <span className="admin-tag" style={product.inventoryManaged && product.stockQuantity > 0 ? { background: 'rgba(74,222,128,0.1)', color: 'var(--a-green)' } : { background: 'rgba(248,113,113,0.1)', color: 'var(--a-red)' }}>
                      {product.inventoryManaged ? `${product.stockQuantity} in stock` : product.inStock ? 'Not tracked' : 'Out of stock'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {product.isArchived ? <span className="admin-tag" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--a-text-2)' }}>Archived</span> : null}
                      {product.isNew ? <span className="admin-tag" style={{ background: 'rgba(96,165,250,0.12)', color: 'var(--a-blue)' }}>New</span> : null}
                      {product.isBestSeller ? <span className="admin-tag" style={{ background: 'rgba(255,176,0,0.12)', color: 'var(--a-gold)' }}>Best seller</span> : null}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" className="admin-btn admin-btn--info admin-btn--sm" onClick={() => openEdit(product)}>
                        <Pencil size={13} /> Edit
                      </button>
                      {product.isArchived ? (
                        <button type="button" className="admin-btn admin-btn--sm" onClick={() => void restore(product)}>
                          <ArchiveRestore size={13} /> Restore
                        </button>
                      ) : (
                        <button type="button" className="admin-btn admin-btn--danger admin-btn--sm" onClick={() => setDeleting(product)}>
                          <Trash2 size={13} /> Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="admin-empty">
                    <PackageX size={32} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
                    No products found
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      {showModal ? (
        <Modal title={editing ? 'Edit product' : 'Add new product'} onClose={() => setShowModal(false)}>
          <ImageUploader values={form.images} onChange={(paths) => set('images', paths)} />
          <div className="admin-form-grid">
            <div className="admin-field"><label htmlFor="p-name">Product name</label><input id="p-name" className="admin-input" value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
            <div className="admin-field"><label htmlFor="p-category">Category</label><input id="p-category" className="admin-input" value={form.category} onChange={(e) => set('category', e.target.value)} /></div>
            <div className="admin-field"><label htmlFor="p-price">Price (GH₵)</label><input id="p-price" className="admin-input" type="number" min="0" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} /></div>
            <div className="admin-field"><label htmlFor="p-original">Original price (optional)</label><input id="p-original" className="admin-input" type="number" min="0" step="0.01" value={form.originalPrice} onChange={(e) => set('originalPrice', e.target.value)} /></div>

            <div className="admin-field" style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, background: 'rgba(255, 176, 0, 0.06)', padding: '16px', borderRadius: 12, border: '1px solid rgba(255, 176, 0, 0.25)' }}>
                <div>
                  <label htmlFor="p-stock" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: 'var(--a-gold)', fontSize: 13, textTransform: 'none', letterSpacing: 0 }}>
                    <Package size={17} /> Stock Quantity
                  </label>
                  <input
                    id="p-stock"
                    className="admin-input"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="e.g. 50"
                    value={form.stockQuantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm((current) => ({
                        ...current,
                        stockQuantity: val,
                        inStock: Number(val) > 0,
                      }));
                    }}
                    style={{ marginTop: 8 }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--a-text-3)', display: 'block', marginTop: 4 }}>
                    Decreases automatically as customers make purchases.
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--a-text)', fontWeight: 600, fontSize: 14 }}>
                    <input
                      type="checkbox"
                      checked={form.inStock}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setForm((current) => ({
                          ...current,
                          inStock: checked,
                          stockQuantity: checked ? (Number(current.stockQuantity) > 0 ? current.stockQuantity : '50') : '0',
                        }));
                      }}
                    />
                    In Stock (Available for sale)
                  </label>
                  <span style={{ fontSize: 12, color: 'var(--a-text-3)', marginTop: 4 }}>
                    {form.inStock ? '✓ Available for customers to purchase.' : '✕ Marked out of stock across the store.'}
                  </span>
                </div>
              </div>
            </div>

            <div className="admin-field"><label htmlFor="p-rating">Rating (0-5)</label><input id="p-rating" className="admin-input" type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(e) => set('rating', e.target.value)} /></div>
            <div className="admin-field"><label htmlFor="p-reviews">Review count</label><input id="p-reviews" className="admin-input" type="number" min="0" step="1" value={form.reviewCount} onChange={(e) => set('reviewCount', e.target.value)} /></div>
          </div>
          <div className="admin-field"><label htmlFor="p-description">Description</label><textarea id="p-description" className="admin-textarea" value={form.description} onChange={(e) => set('description', e.target.value)} /></div>
          <div className="admin-field"><label htmlFor="p-tags">Tags (comma-separated)</label><input id="p-tags" className="admin-input" placeholder="Fashion, Top, Summer" value={form.tags} onChange={(e) => set('tags', e.target.value)} /></div>
          <div className="admin-field"><label htmlFor="p-colors">Colours (comma-separated)</label><input id="p-colors" className="admin-input" placeholder="Black, White, Red" value={form.colors} onChange={(e) => set('colors', e.target.value)} /></div>
          <div className="admin-field"><label htmlFor="p-sizes">Sizes (comma-separated)</label><input id="p-sizes" className="admin-input" placeholder="S, M, L, XL" value={form.sizes} onChange={(e) => set('sizes', e.target.value)} /></div>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', margin: '8px 0 18px' }}>
            {([
              ['inStock', 'In stock (Available for sale)'],
              ['isNew', 'Mark as new'],
              ['isBestSeller', 'Best seller'],
              ...(editing ? [['isArchived', 'Archived (hidden from store)']] : []),
            ] as Array<[keyof FormState, string]>).map(([key, label]) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--a-text-2)' }}>
                <input type="checkbox" checked={Boolean(form[key])} onChange={(e) => set(key, e.target.checked as never)} />
                {label}
              </label>
            ))}
          </div>

          {formError ? <div className="admin-alert admin-alert--error" role="alert">{formError}</div> : null}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="admin-btn" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="button" className="admin-btn admin-btn--primary" onClick={() => void save()} disabled={saving}>
              <Check size={16} /> {saving ? 'Saving…' : 'Save product'}
            </button>
          </div>
        </Modal>
      ) : null}

      {deleting ? (
        <Modal title="Delete product?" onClose={() => setDeleting(null)}>
          <p style={{ color: 'var(--a-text-2)', marginTop: 0 }}>
            {deleting.orderCount > 0
              ? `${deleting.name} appears in ${deleting.orderCount} order line(s), so it will be archived: hidden from the store and the app, but kept for order history.`
              : `${deleting.name} will be permanently removed from your catalog, the website and the app.`}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="admin-btn" onClick={() => setDeleting(null)}>Cancel</button>
            <button type="button" className="admin-btn admin-btn--danger" onClick={() => void confirmDelete()}>
              <Trash2 size={16} /> {deleting.orderCount > 0 ? 'Archive product' : 'Delete product'}
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
