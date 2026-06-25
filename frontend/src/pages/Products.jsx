import { useQuery } from '@tanstack/react-query';
import { getProducts } from '../api/products.js';
import ProductCard from '../components/ProductCard.jsx';

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
          <h1 className="mt-4 text-xl font-bold text-slate-900 sm:text-4xl">Our products</h1>
          <p className="mt-3 text-xs text-slate-600 sm:mt-4 sm:text-lg">
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
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                imageUrl={product.imageUrl}
                imageAlt={product.name}
              >
                <h2 className="line-clamp-2 text-[11px] font-semibold leading-snug text-slate-900 sm:text-xl">{product.name}</h2>
                {product.description && (
                  <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-slate-600 sm:mt-3 sm:text-base">{product.description}</p>
                )}
                <div className="mt-2 flex items-center justify-between gap-1 sm:mt-4 sm:gap-4">
                  <span className="text-[11px] font-bold text-teal-600 sm:text-lg">
                    ₹{product.price?.toLocaleString() ?? '0'}
                  </span>
                  {product.businessVolume > 0 && (
                    <span className="rounded-full bg-teal-50 px-1.5 py-0.5 text-[9px] font-medium text-teal-700 sm:px-2.5 sm:text-xs">
                      BV: {product.businessVolume}
                    </span>
                  )}
                </div>
              </ProductCard>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
