import { useQuery } from '@tanstack/react-query';
import { getProducts } from '../../api/products.js';
import ProductCard from '../../components/ProductCard.jsx';

const PRODUCTS_QUERY_KEY = ['products'];

export default function ProductsSection() {
  const { data: products = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: PRODUCTS_QUERY_KEY,
    queryFn: getProducts,
    select: (res) => res?.data?.products ?? [],
  });
  const error = queryError ? (queryError.response?.data?.error ?? 'Failed to load products') : '';

  return (
    <section id="products" className="border-t border-slate-200 bg-white px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-3xl font-bold text-slate-900 text-center">Our products</h2>
        <p className="mt-4 text-lg text-slate-600 text-center">
          Trusted wellness and healthcare products for everyday life.
        </p>
        <div className="mt-12">
          {loading ? (
            <div className="flex justify-center py-16">
              <p className="text-slate-500">Loading products…</p>
            </div>
          ) : error ? (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-red-700">{error}</div>
          ) : products.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
              <p className="text-slate-500">No products available yet.</p>
              <p className="mt-2 text-sm text-slate-400">Check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  imageUrl={product.imageUrl}
                  imageAlt={product.name}
                >
                  <h3 className="text-xl font-semibold text-slate-900">{product.name}</h3>
                  {product.description && (
                    <p className="mt-3 text-slate-600">{product.description}</p>
                  )}
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <span className="text-lg font-bold text-teal-600">
                      ₹{product.price?.toLocaleString() ?? '0'}
                    </span>
                    {product.businessVolume > 0 && (
                      <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">
                        BV: {product.businessVolume}
                      </span>
                    )}
                  </div>
                </ProductCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
