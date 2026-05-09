"use client";
import { useEffect, useState, useCallback, useRef } from 'react';
import { Plus, Pencil, Trash2, X, Check, Search, PackageX, Upload, ImageIcon } from 'lucide-react';

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
};

const EMPTY_FORM = {
  name: '', description: '', price: '', originalPrice: '',
  imagePath: '', category: '', tags: '', rating: '4.5',
  reviewCount: '0', inStock: true, sizes: '', colors: '',
  isNew: false, isBestSeller: false,
};

function Modal({ title, onClose, children }: any) {
  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '24px',
    }}>
      <div style={{
        backgroundColor: '#111', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)',
        width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#f5f5f5' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0a0a0', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: any) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '12px', color: '#a0a0a0', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px', color: '#f5f5f5', fontSize: '14px', outline: 'none',
};

// ─── Image Upload Zone ──────────────────────────────────────────────────────
function ImageUploader({ value, onChange }: { value: string; onChange: (path: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, WebP, GIF).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB.');
      return;
    }

    setError('');
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok) {
        onChange(data.imagePath);
      } else {
        setError(data.error ?? 'Upload failed.');
      }
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const previewUrl = value
    ? (value.startsWith('http') ? value : `http://localhost:3000${value}`)
    : null;

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '12px', color: '#a0a0a0', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Product Image
      </label>

      {/* Drop Zone */}
      <div
        onClick={() => !uploading && fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragging ? '#d4af37' : 'rgba(255,255,255,0.12)'}`,
          borderRadius: '12px',
          backgroundColor: dragging ? 'rgba(212,175,55,0.06)' : '#1a1a1a',
          cursor: uploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          overflow: 'hidden',
          position: 'relative',
          minHeight: '140px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {previewUrl ? (
          /* Preview */
          <div style={{ position: 'relative', width: '100%', textAlign: 'center' }}>
            <img
              src={previewUrl}
              alt="Product preview"
              style={{ maxHeight: '180px', maxWidth: '100%', objectFit: 'contain', display: 'block', margin: '0 auto', padding: '12px' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            {/* Overlay on hover */}
            <div style={{
              position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              opacity: 0, transition: 'opacity 0.2s',
              gap: '6px',
            }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
            >
              <Upload size={24} color="#fff" />
              <span style={{ color: '#fff', fontSize: '13px', fontWeight: 500 }}>Click to change image</span>
            </div>
          </div>
        ) : (
          /* Empty state */
          <div style={{ textAlign: 'center', padding: '28px 20px', color: '#555' }}>
            {uploading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', border: '3px solid #d4af37', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <span style={{ fontSize: '13px', color: '#a0a0a0' }}>Uploading…</span>
              </div>
            ) : (
              <>
                <ImageIcon size={36} style={{ marginBottom: '10px', opacity: 0.3 }} />
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#a0a0a0', marginBottom: '4px' }}>
                  Drop image here or click to browse
                </div>
                <div style={{ fontSize: '12px' }}>JPG, PNG, WebP · Max 5 MB</div>
              </>
            )}
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
      </div>

      {/* Path preview + manual override */}
      {value && (
        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <code style={{ flex: 1, fontSize: '12px', color: '#d4af37', backgroundColor: '#1a1a1a', padding: '6px 10px', borderRadius: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {value}
          </code>
          <button onClick={() => onChange('')} title="Clear image" style={{ background: 'rgba(248,113,113,0.1)', border: 'none', borderRadius: '6px', padding: '6px 8px', color: '#f87171', cursor: 'pointer', display: 'flex' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {error && (
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#f87171' }}>{error}</div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/admin/products')
      .then((r) => r.json())
      .then((d) => { setProducts(d.products); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditProduct(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({
      name: p.name, description: p.description,
      price: String(p.price), originalPrice: p.originalPrice ? String(p.originalPrice) : '',
      imagePath: p.imagePath, category: p.category,
      tags: (() => { try { return JSON.parse(p.tags).join(', '); } catch { return ''; } })(),
      rating: String(p.rating), reviewCount: String(p.reviewCount),
      inStock: p.inStock,
      sizes: (() => { try { return JSON.parse(p.sizes).join(', '); } catch { return ''; } })(),
      colors: (() => { try { return JSON.parse(p.colors).join(', '); } catch { return ''; } })(),
      isNew: p.isNew, isBestSeller: p.isBestSeller,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      ...form,
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
      rating: Number(form.rating),
      reviewCount: Number(form.reviewCount),
      tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
      sizes: form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
      colors: form.colors.split(',').map((s) => s.trim()).filter(Boolean),
    };

    const url = editProduct ? `/api/admin/products/${editProduct.id}` : '/api/admin/products';
    const method = editProduct ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setSaving(false);
    setShowModal(false);
    load();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    setDeleteId(null);
    load();
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '40px 48px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 700, color: '#f5f5f5' }}>Products</h1>
          <p style={{ margin: '6px 0 0', fontSize: '14px', color: '#555' }}>
            {products.length} product{products.length !== 1 ? 's' : ''} in your catalog
          </p>
        </div>
        <button onClick={openNew} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 20px', backgroundColor: '#d4af37', color: '#000',
          border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
        }}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '24px', maxWidth: '360px' }}>
        <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
        <input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, paddingLeft: '36px' }}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ color: '#a0a0a0', textAlign: 'center', padding: '60px' }}>Loading products…</div>
      ) : (
        <div style={{ backgroundColor: '#111', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['', 'Product', 'Category', 'Price', 'Stock', 'Flags', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  {/* Thumbnail */}
                  <td style={{ padding: '10px 16px', width: '56px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {p.imagePath ? (
                        <img
                          src={p.imagePath.startsWith('http') ? p.imagePath : `http://localhost:3000${p.imagePath}`}
                          alt={p.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <ImageIcon size={18} color="#333" />
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#f5f5f5' }}>{p.name}</div>
                    <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>ID: {p.id}</div>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ padding: '3px 8px', backgroundColor: 'rgba(212,175,55,0.1)', color: '#d4af37', borderRadius: '4px', fontSize: '12px' }}>
                      {p.category}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: '14px', color: '#f5f5f5', fontWeight: 600 }}>
                    GH₵ {p.price}
                    {p.originalPrice && <div style={{ fontSize: '11px', color: '#555', textDecoration: 'line-through' }}>GH₵ {p.originalPrice}</div>}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600,
                      backgroundColor: p.inStock ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                      color: p.inStock ? '#4ade80' : '#f87171',
                    }}>
                      {p.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {p.isNew && <span style={{ padding: '2px 6px', backgroundColor: 'rgba(96,165,250,0.12)', color: '#60a5fa', borderRadius: '4px', fontSize: '11px' }}>New</span>}
                      {p.isBestSeller && <span style={{ padding: '2px 6px', backgroundColor: 'rgba(212,175,55,0.12)', color: '#d4af37', borderRadius: '4px', fontSize: '11px' }}>Best Seller</span>}
                    </div>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => openEdit(p)} style={{ background: 'rgba(96,165,250,0.1)', border: 'none', borderRadius: '6px', padding: '6px 10px', color: '#60a5fa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                        <Pencil size={13} /> Edit
                      </button>
                      <button onClick={() => setDeleteId(p.id)} style={{ background: 'rgba(248,113,113,0.1)', border: 'none', borderRadius: '6px', padding: '6px 10px', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ padding: '60px', textAlign: 'center', color: '#555' }}>
                  <PackageX size={32} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.3 }} />
                  No products found
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal title={editProduct ? 'Edit Product' : 'Add New Product'} onClose={() => setShowModal(false)}>
          {/* Image Uploader */}
          <ImageUploader
            value={form.imagePath}
            onChange={(path) => setForm({ ...form, imagePath: path })}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Field label="Product Name"><input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Category"><input style={inputStyle} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
            <Field label="Price (GH₵)"><input style={inputStyle} type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field>
            <Field label="Original Price (optional)"><input style={inputStyle} type="number" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })} /></Field>
            <Field label="Rating (0-5)"><input style={inputStyle} type="number" step="0.1" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} /></Field>
            <Field label="Review Count"><input style={inputStyle} type="number" value={form.reviewCount} onChange={(e) => setForm({ ...form, reviewCount: e.target.value })} /></Field>
          </div>
          <Field label="Description"><textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <Field label="Tags (comma-separated)"><input style={inputStyle} placeholder="Fashion, Top, Summer" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></Field>
          <Field label="Colors (comma-separated)"><input style={inputStyle} placeholder="Black, White, Red" value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} /></Field>
          <Field label="Sizes (comma-separated)"><input style={inputStyle} placeholder="S, M, L, XL" value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} /></Field>

          <div style={{ display: 'flex', gap: '20px', margin: '16px 0' }}>
            {[
              { key: 'inStock', label: 'In Stock' },
              { key: 'isNew', label: 'Mark as New' },
              { key: 'isBestSeller', label: 'Best Seller' },
            ].map(({ key, label }) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#a0a0a0' }}>
                <input type="checkbox" checked={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} />
                {label}
              </label>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button onClick={() => setShowModal(false)} style={{ padding: '10px 20px', backgroundColor: '#1a1a1a', color: '#a0a0a0', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ padding: '10px 20px', backgroundColor: '#d4af37', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={16} /> {saving ? 'Saving…' : 'Save Product'}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteId !== null && (
        <Modal title="Delete Product?" onClose={() => setDeleteId(null)}>
          <p style={{ color: '#a0a0a0', marginTop: 0 }}>This action cannot be undone. The product will be permanently removed from your catalog and the Flutter app.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button onClick={() => setDeleteId(null)} style={{ padding: '10px 20px', backgroundColor: '#1a1a1a', color: '#a0a0a0', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
            <button onClick={() => handleDelete(deleteId)} style={{ padding: '10px 20px', backgroundColor: '#f87171', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Trash2 size={16} /> Delete Product
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
