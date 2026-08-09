'use client';

import { ArchiveRestore, Check, ImageIcon, PackageX, Pencil, Plus, Search, Trash2, Upload, X } from 'lucide-react';
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
  category: string;
  tags: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  sizes: string;
  colors: string;
  isNew: boolean;
  isBestSeller: boolean;
  isArchived: boolean;
  orderCount: number;
};

const emptyForm = {
  name: '',
  description: '',
  price: '',
  originalPrice: '',
  imagePath: '',
  category: '',
  tags: '',
  rating: '4.5',
  reviewCount: '0',
  inStock: true,
  sizes: '',
  colors: '',
  isNew: false,
  isBestSeller: false,
  isArchived: false,
};

type FormState = typeof emptyForm;

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

function ImageUploader({ value, onChange }: { value: string; onChange: (path: string) => void }) {
  const { authedFetch } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const uploadFile = async (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setError('Please select a JPG, PNG, WebP or GIF image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB.');
      return;
    }
    setError('');
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const data = await authedFetch<{ imagePath: string }>('/api/admin/upload', { method: 'POST', body: formData });
      onChange(data.imagePath);
    } catch (caught) {
      setError(errorMessage(caught, 'Upload failed. Please try again.'));
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void uploadFile(file);
  };

  return (
    <div className="admin-field">
      <span className="admin-label">Product image</span>
      <div
        role="button"
        tabIndex={0}
        onClick={() => !uploading && fileRef.current?.click()}
        onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && fileRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          border: `2px dashed ${dragging ? '#d4af37' : 'rgba(255,255,255,0.12)'}`,
          borderRadius: 12,
          background: dragging ? 'rgba(212,175,55,0.06)' : '#1a1a1a',
          cursor: uploading ? 'progress' : 'pointer',
          minHeight: 140,
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
            <span>Uploading…</span>
          </div>
        ) : value ? (
          <div style={{ display: 'grid', justifyItems: 'center', gap: 8 }}>
            <img src={value} alt="Product preview" style={{ maxHeight: 180, maxWidth: '100%', objectFit: 'contain' }} />
            <span style={{ fontSize: 12 }}><Upload size={12} style={{ display: 'inline' }} /> Click or drop to replace</span>
          </div>
        ) : (
          <div>
            <ImageIcon size={36} style={{ opacity: 0.3, margin: '0 auto 10px' }} />
            <div style={{ fontWeight: 500, color: 'var(--a-text-2)' }}>Drop image here or click to browse</div>
            <div style={{ fontSize: 12 }}>JPG, PNG, WebP, GIF · Max 5 MB</div>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void uploadFile(file);
          event.target.value = '';
        }} />
      </div>
      <input
        className="admin-input"
        placeholder="…or paste an https:// image URL or /products/ path"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
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
  const [form, setForm] = useState<FormState>(emptyForm);
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
    setForm(emptyForm);
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
      imagePath: product.imagePath,
      category: product.category,
      tags: parseList(product.tags).join(', '),
      rating: String(product.rating),
      reviewCount: String(product.reviewCount),
      inStock: product.inStock,
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
    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      originalPrice: form.originalPrice.trim() ? Number(form.originalPrice) : null,
      imagePath: form.imagePath,
      category: form.category,
      tags: splitList(form.tags),
      sizes: splitList(form.sizes),
      colors: splitList(form.colors),
      rating: Number(form.rating),
      reviewCount: Number(form.reviewCount),
      inStock: form.inStock,
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
                  <td><span className="admin-tag" style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--a-gold)' }}>{product.category}</span></td>
                  <td style={{ fontWeight: 600 }}>
                    {formatMoney(product.price)}
                    {product.originalPrice ? <div style={{ fontSize: 11, color: 'var(--a-text-3)', textDecoration: 'line-through', fontWeight: 400 }}>{formatMoney(product.originalPrice)}</div> : null}
                  </td>
                  <td>
                    <span className="admin-tag" style={product.inStock ? { background: 'rgba(74,222,128,0.1)', color: 'var(--a-green)' } : { background: 'rgba(248,113,113,0.1)', color: 'var(--a-red)' }}>
                      {product.inStock ? 'In stock' : 'Out of stock'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {product.isArchived ? <span className="admin-tag" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--a-text-2)' }}>Archived</span> : null}
                      {product.isNew ? <span className="admin-tag" style={{ background: 'rgba(96,165,250,0.12)', color: 'var(--a-blue)' }}>New</span> : null}
                      {product.isBestSeller ? <span className="admin-tag" style={{ background: 'rgba(212,175,55,0.12)', color: 'var(--a-gold)' }}>Best seller</span> : null}
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
          <ImageUploader value={form.imagePath} onChange={(path) => set('imagePath', path)} />
          <div className="admin-form-grid">
            <div className="admin-field"><label htmlFor="p-name">Product name</label><input id="p-name" className="admin-input" value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
            <div className="admin-field"><label htmlFor="p-category">Category</label><input id="p-category" className="admin-input" value={form.category} onChange={(e) => set('category', e.target.value)} /></div>
            <div className="admin-field"><label htmlFor="p-price">Price (GH₵)</label><input id="p-price" className="admin-input" type="number" min="0" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} /></div>
            <div className="admin-field"><label htmlFor="p-original">Original price (optional)</label><input id="p-original" className="admin-input" type="number" min="0" step="0.01" value={form.originalPrice} onChange={(e) => set('originalPrice', e.target.value)} /></div>
            <div className="admin-field"><label htmlFor="p-rating">Rating (0-5)</label><input id="p-rating" className="admin-input" type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(e) => set('rating', e.target.value)} /></div>
            <div className="admin-field"><label htmlFor="p-reviews">Review count</label><input id="p-reviews" className="admin-input" type="number" min="0" step="1" value={form.reviewCount} onChange={(e) => set('reviewCount', e.target.value)} /></div>
          </div>
          <div className="admin-field"><label htmlFor="p-description">Description</label><textarea id="p-description" className="admin-textarea" value={form.description} onChange={(e) => set('description', e.target.value)} /></div>
          <div className="admin-field"><label htmlFor="p-tags">Tags (comma-separated)</label><input id="p-tags" className="admin-input" placeholder="Fashion, Top, Summer" value={form.tags} onChange={(e) => set('tags', e.target.value)} /></div>
          <div className="admin-field"><label htmlFor="p-colors">Colours (comma-separated)</label><input id="p-colors" className="admin-input" placeholder="Black, White, Red" value={form.colors} onChange={(e) => set('colors', e.target.value)} /></div>
          <div className="admin-field"><label htmlFor="p-sizes">Sizes (comma-separated)</label><input id="p-sizes" className="admin-input" placeholder="S, M, L, XL" value={form.sizes} onChange={(e) => set('sizes', e.target.value)} /></div>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', margin: '8px 0 18px' }}>
            {([
              ['inStock', 'In stock'],
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
