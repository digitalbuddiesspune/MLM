import { useQuery } from '@tanstack/react-query';
import { getProducts } from '../api/products.js';

export default function Products() {
  const { data: products = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
    select: (res) => res?.data?.products ?? [],
  });
  const error = queryError ? (queryError.response?.data?.error ?? 'Failed to load products') : '';

  return (
    <>
      <section className="border-b border-slate-100 bg-teal-50/50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <img
            src="/amruta-wellness-logo.png"
            alt="Amruta Wellness"
            className="mx-auto h-16 w-16 object-contain"
          />
          <h1 className="mt-4 text-4xl font-bold text-slate-900">Our products</h1>
          <p className="mt-4 text-lg text-slate-600">
            Trusted wellness and healthcare products for everyday life.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
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
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <article
                key={product._id}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                {product.imageUrl && (
                  <div className="mb-4 flex items-center justify-center rounded-lg bg-slate-100">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="max-h-64 w-auto object-contain"
                    />
                  </div>
                )}
                <h2 className="text-xl font-semibold text-slate-900">{product.name}</h2>
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
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
