import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getProducts } from '../api/products.js';
import { isAuthenticated } from '../api/auth.js';
import { addToCart } from '../api/cart.js';

export default function BusinessPlan() {
  const queryClient = useQueryClient();
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

  const binarySteps = [
    'User A is the parent node; users B and C are child nodes in the binary tree.',
    'When both B and C join under A, user A gets automatically activated.',
    'Each user joins the plan by purchasing products worth Rs 1500.',
    'Users can sponsor new members using their sponsor ID and grow their network.',
    'Level, reward, and joining bonus are applied based on total sponsored users.',
  ];

  const levelSets = [
    { level: 'Level 1', name: 'Star', minUsers: '10+', reward: 'Remote', joiningBonus: 'Rs 20' },
    { level: 'Level 2', name: 'Rubi Star', minUsers: '100+', reward: 'Digital Watch', joiningBonus: 'Rs 10' },
    { level: 'Level 3', name: 'Silver', minUsers: '1000+', reward: 'Mobile', joiningBonus: 'Rs 10' },
    { level: 'Level 4', name: 'Platinum', minUsers: '5000+', reward: 'Laptop', joiningBonus: 'Rs 10' },
    { level: 'Level 5', name: 'Gold', minUsers: '20000+', reward: 'Two Wheeler', joiningBonus: 'Rs 10' },
    { level: 'Level 6', name: 'Diamond', minUsers: '100000+', reward: 'Four Wheeler', joiningBonus: 'Rs 8' },
  ];

  const { data: products = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ['business-plan', 'products'],
    queryFn: getProducts,
    select: (res) => res?.data?.products ?? [],
  });
  const error = queryError ? (queryError.response?.data?.error ?? 'Failed to load products') : '';
  const addToCartMutation = useMutation({
    mutationFn: (productId) => addToCart(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setAddedMessage('Product added to cart');
      setTimeout(() => setAddedMessage(''), 1400);
    },
  });

  return (
    <div className="bg-[#dfe3e6]">
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

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-3xl border border-[#ccd3d8] bg-[#e9edef] p-6 sm:p-10">
          <h2 className="text-3xl font-bold text-[#111827]">How the Binary Plan Works</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {binarySteps.map((step, index) => (
              <div
                key={step}
                className="relative overflow-hidden rounded-xl border border-[#ccd3d8] bg-[#f3f6f8] px-4 py-4"
              >
                <span className="pointer-events-none absolute -right-2 -top-4 text-8xl font-black leading-none text-[#5a8f3f] opacity-20">
                  {index + 1}
                </span>
                <p className="relative z-10 pr-8 text-sm leading-relaxed text-[#2a3442]">
                  {step}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-2xl border border-[#ccd3d8] bg-[#f3f6f8] p-6">
            <h3 className="text-xl font-bold text-[#111827]">Our Vision</h3>
            <p className="mt-3 text-base leading-relaxed text-[#2a3442]">
              We believe good health and financial independence go hand in hand. Through quality wellness products and
              a transparent business model, Amruta Wellness empowers individuals to build better lives.
            </p>
          </div>

          <div className="mt-8 rounded-2xl border border-[#ccd3d8] bg-[#f3f6f8] p-6">
            <h3 className="text-xl font-bold text-[#111827]">Level Sets, Rewards and Joining Bonus</h3>
            <p className="mt-2 text-sm text-[#2a3442]">
              Levels are based on how many users you add with your sponsor ID.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#ccd3d8] text-[#111827]">
                    <th className="px-3 py-2 font-semibold">Level</th>
                    <th className="px-3 py-2 font-semibold">Level Name</th>
                    <th className="px-3 py-2 font-semibold">Users Added</th>
                    <th className="px-3 py-2 font-semibold">Reward</th>
                    <th className="px-3 py-2 font-semibold">Joining Bonus</th>
                  </tr>
                </thead>
                <tbody>
                  {levelSets.map((item) => (
                    <tr key={item.level} className="border-b border-[#dde3e8] last:border-b-0">
                      <td className="px-3 py-2 font-medium text-[#5a8f3f]">{item.level}</td>
                      <td className="px-3 py-2 text-[#111827]">{item.name}</td>
                      <td className="px-3 py-2 text-[#2a3442]">{item.minUsers}</td>
                      <td className="px-3 py-2 text-[#2a3442]">{item.reward}</td>
                      <td className="px-3 py-2 text-[#2a3442]">{item.joiningBonus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
      <section className="px-4  sm:px-6 lg:px-8 rounded-3xl">
        <img className='rounded-2xl' src="https://res.cloudinary.com/dq3meq3qa/image/upload/v1773731732/Add_a_heading_k5ecfp.svg" alt="" />
      </section>

      <section className="border-t border-[#ccd3d8] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#111827]">Products</h2>
            <p className="mt-2 text-[#2a3442]">Choose a product and get started with Amruta Wellness.</p>
            {addedMessage && <p className="mt-2 text-sm font-semibold text-teal-700">{addedMessage}</p>}
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
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <article
                    key={product._id}
                    className="rounded-2xl border border-[#ccd3d8] bg-[#edf1f3] p-6 shadow-sm transition-shadow hover:shadow-lg"
                  >
                    {product.imageUrl && (
                      <div className="mb-4 flex items-center justify-center rounded-lg bg-[#dfe4e8]">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="max-h-64 w-auto object-contain"
                        />
                      </div>
                    )}
                    <h3 className="text-xl font-semibold text-[#111827]">{product.name}</h3>
                    {product.description && (
                      <p className="mt-2 text-[#2a3442]">{product.description}</p>
                    )}
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-lg font-bold text-[#0f766e]">
                        Rs {product.price?.toLocaleString() ?? '0'}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <Link
                        to={isAuthenticated() ? `/checkout?productId=${product._id}` : '/register'}
                        className="inline-flex items-center justify-center rounded-lg bg-[#0b0d10] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1c232b]"
                      >
                        I'm Interested
                      </Link>
                      <button
                        type="button"
                        onClick={() => addToCartMutation.mutate(product._id)}
                        className="inline-flex items-center justify-center rounded-lg border border-[#0b0d10] px-4 py-2 text-sm font-semibold text-[#0b0d10] hover:bg-[#d7dde1]"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
