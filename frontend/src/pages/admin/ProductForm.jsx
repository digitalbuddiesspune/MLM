import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createProduct as createProductApi, updateProduct as updateProductApi } from '../../api/admin.js';
import { getProductById } from '../../api/products.js';

export default function AdminProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: '',
    sku: '',
    price: '',
    category: '',
    imageUrl: '',
    active: true,
  });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;

    let cancelled = false;

    async function fetchProduct() {
      try {
        setLoading(true);
        setError('');
        const data = await getProductById(id);
        const product = data?.data?.product;
        if (!product) {
          if (!cancelled) {
            setError('Product not found.');
          }
          return;
        }

        if (!cancelled) {
          setForm({
            name: product.name ?? '',
            sku: product.slug ?? '',
            price: String(product.price ?? ''),
            category: product.description ?? '',
            imageUrl: product.imageUrl ?? '',
            active: product.isActive ?? true,
          });
        }
      } catch (err) {
        if (!cancelled) {
          // eslint-disable-next-line no-console
          console.error('Failed to load product', err);
          setError('Failed to load product.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchProduct();

    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const priceNumber = Number(form.price) || 0;

    const payload = {
      name: form.name,
      slug: form.sku || undefined,
      description: form.category || '',
      price: priceNumber,
      isActive: form.active,
      imageUrl: form.imageUrl || undefined,
    };

    try {
      setSaving(true);
      setError('');

      if (isEdit) {
        await updateProductApi(id, payload);
      } else {
        await createProductApi(payload);
      }

      navigate('/admin/products');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to save product', err);
      setError('Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          {isEdit ? 'Edit product' : 'Add product'}
        </h1>
        <p className="mt-1 text-slate-600">
          {isEdit ? 'Update the product details.' : 'Create a new product for the catalog.'}
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading product…</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700">
              Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-700">
                SKU
              </label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Category / short label
              </label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">
              Image URL
            </label>
            <input
              type="url"
              value={form.imageUrl}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
              placeholder="https://example.com/image.jpg"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">
              Price (₹)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="product-active"
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="product-active" className="text-xs font-medium text-slate-700">
              Active (visible to users)
            </label>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

