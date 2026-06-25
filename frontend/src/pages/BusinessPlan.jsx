import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '../api/products.js';
import ProductCard from '../components/ProductCard.jsx';
import { isAuthenticated } from '../api/auth.js';
import CartQuantityControl from '../components/CartQuantityControl.jsx';
import CartToast from '../components/CartToast.jsx';
import BinaryPlanWorksSection from '../components/home/BinaryPlanWorksSection.jsx';

export default function BusinessPlan() {
  const [addedMessage, setAddedMessage] = useState('');
  const businessHighlights = [
    {
      no: '01',
      title: 'Simple binary structure',
      desc: 'Each member builds two primary teams (left and right) for clear, balanced and easy-to-track growth.',
    },
    {
      no: '02',
      title: 'Transparent earning flow',
      desc: 'Members benefit from direct referrals and overall network activity with a clean, understandable model.',
    },
    {
      no: '03',
      title: 'Wellness + opportunity',
      desc: 'The plan connects trusted products with long-term business opportunities for sustainable progress.',
    },
  ];

  const { data: products = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ['business-plan', 'products'],
    queryFn: getProducts,
    select: (res) => res?.data?.products ?? [],
  });
  const error = queryError ? (queryError.response?.data?.error ?? 'Failed to load products') : '';

  return (
    <div className="bg-white">
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[28px] bg-[#e9edef] px-6 py-12 sm:px-10 sm:py-14 lg:px-16 lg:py-16">
            <span className="absolute left-10 top-20 h-4 w-4 rounded-full bg-[#8ecf5a]" aria-hidden />
            <span className="absolute right-16 top-16 h-4 w-4 rounded-full bg-[#8ecf5a]" aria-hidden />
            <span className="absolute right-24 top-1/2 h-8 w-8 rounded-full bg-[#ffbe1a]" aria-hidden />
            <span className="absolute right-10 top-[64%] h-3.5 w-3.5 rounded-full bg-[#5561ff]" aria-hidden />

            <div className="relative z-10 text-center">
              <p className="text-sm font-semibold tracking-[0.14em] text-[#5a8f3f]">BUSINESS PLAN</p>
              <h1 className="mt-3 text-4xl font-black leading-tight text-[#101418] sm:text-5xl lg:text-6xl">
                Build wellness.
                <br />
                Build your future.
              </h1>
              <p className="mx-auto mt-4 max-w-3xl text-lg leading-relaxed text-[#2a3442]">
                A transparent model that combines trusted wellness products with a simple binary growth structure.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/register"
                  className="rounded-full bg-[#0b0d10] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#1c232b]"
                >
                  Get Started
                </Link>
                <Link
                  to="/products"
                  className="rounded-full border border-[#4a5158] bg-transparent px-8 py-3 text-sm font-semibold text-[#111827] transition hover:bg-[#d6dce0]"
                >
                  View Products
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="text-sm font-bold tracking-[0.1em] text-[#5a8f3f]">BINARY MODEL</p>
            <h2 className="mt-4 text-4xl font-bold leading-tight text-[#111827]">
              A simple structure.
              <br />
              Strong long-term growth.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-[#2a3442]">
              Each member builds two teams (left and right). As your network grows through referrals, you benefit from
              team activity while helping others improve their health and opportunities.
            </p>

            <div className="mt-8 rounded-2xl border border-[#ccd3d8] bg-[#edf1f3] p-6">
              <h3 className="text-xl font-bold text-[#111827]">How it starts</h3>
              <p className="mt-3 text-base leading-relaxed text-[#2a3442]">
              If A is parent and B/C are child nodes, A becomes active when both B and C join. Every user starts by
              buying products worth Rs 1500 and then grows through sponsor-based referrals.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {businessHighlights.map(({ no, title, desc }) => (
              <article key={no} className="rounded-2xl border border-[#ccd3d8] bg-[#edf1f3] p-5 shadow-sm">
                <div className="flex gap-3">
                  <span className="text-3xl font-light leading-none text-[#5a8f3f]">{no}.</span>
                  <div>
                    <h4 className="text-3xl font-bold leading-tight text-[#5a8f3f]">{title}</h4>
                    <p className="mt-2 text-base leading-relaxed text-[#2a3442]">{desc}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <BinaryPlanWorksSection />
      <section className="w-full py-10 sm:py-12">
        <img
          className="mx-auto block h-auto w-full max-w-7xl rounded-2xl object-contain sm:rounded-3xl"
          src="https://res.cloudinary.com/dq3meq3qa/image/upload/v1773731732/Add_a_heading_k5ecfp.svg"
          alt="Amruta Wellness binary business plan diagram"
        />
      </section>

      <section className="border-t border-[#ccd3d8] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#111827]">Products</h2>
            <p className="mt-2 text-[#2a3442]">Choose a product and get started with Amruta Wellness.</p>
            <CartToast message={addedMessage} onDone={() => setAddedMessage('')} />
          </div>

          <div className="mt-10">
            {loading ? (
              <div className="flex justify-center py-10">
                <p className="text-[#415064]">Loading products...</p>
              </div>
            ) : error ? (
              <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-700">{error}</div>
            ) : products.length === 0 ? (
              <div className="rounded-xl border border-[#ccd3d8] bg-[#edf1f3] p-8 text-center text-[#415064]">
                No products available yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    imageUrl={product.imageUrl}
                    imageAlt={product.name}
                    imageVariant="cardCoverMuted"
                    className="border-[#ccd3d8] bg-[#edf1f3] hover:shadow-lg"
                  >
                    <h3 className="line-clamp-2 text-[11px] font-semibold leading-snug text-[#111827] sm:text-xl">{product.name}</h3>
                    {product.description && (
                      <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-[#2a3442] sm:mt-2 sm:text-base">{product.description}</p>
                    )}
                    <div className="mt-2 flex items-center justify-between sm:mt-4">
                      <span className="text-[11px] font-bold text-[#0f766e] sm:text-lg">
                        Rs {product.price?.toLocaleString() ?? '0'}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-3">
                      <Link
                        to={isAuthenticated() ? `/checkout?productId=${product._id}` : '/register'}
                        className="inline-flex items-center justify-center rounded-lg bg-[#0b0d10] px-2 py-1.5 text-[10px] font-semibold text-white hover:bg-[#1c232b] sm:px-4 sm:py-2 sm:text-sm"
                      >
                        Buy Plan
                      </Link>
                      <CartQuantityControl
                        productId={product._id}
                        variant="dark"
                        fullWidth
                        compact
                        onAdded={() => setAddedMessage('Product added to cart')}
                      />
                    </div>
                  </ProductCard>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
