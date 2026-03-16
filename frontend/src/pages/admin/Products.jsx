import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/axios.js';
import { deleteProduct as deleteProductApi } from '../../api/admin.js';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchProducts() {
      try {
        setLoading(true);
        setError(null);

        const { data } = await api.get('/products', {
          params: { active: 'false' },
        });

        const backendProducts = data?.data?.products ?? [];
        const mapped = backendProducts.map((p) => ({
          id: p._id,
          name: p.name,
          sku: p.slug ?? '',
          category: p.description ?? '',
          price: p.price ?? 0,
          active: p.isActive,
          imageUrl: p.imageUrl ?? '',
        }));

        if (!cancelled) {
          setProducts(mapped);
        }
      } catch (err) {
        if (!cancelled) {
          // eslint-disable-next-line no-console
          console.error('Failed to load products', err);
          setError('Failed to load products.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = (id) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    const confirmed = window.confirm(`Delete product "${product.name}"? This action cannot be undone.`);
    if (!confirmed) return;

    deleteProductApi(id)
      .then(() => {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Failed to delete product', err);
        window.alert('Failed to delete product.');
      });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Products</h1>
        <p className="mt-1 text-slate-600">Manage products visible in the Amruta Wellness catalog.</p>
        <div className="mt-4">
          <Link
            to="/admin/products/new"
            className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            Add product
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Product list</h2>
          <p className="text-xs text-slate-500">{products.length} products</p>
        </div>
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">SKU</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Price</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                  Loading products…
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-red-600">
                  {error}
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                  No products yet. Use the Add product button above.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{p.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{p.sku}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{p.category}</td>
                  <td className="px-4 py-3 text-sm text-slate-900">₹{p.price.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {p.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        to={`/admin/products/${p.id}/edit`}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className="text-xs font-semibold text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

