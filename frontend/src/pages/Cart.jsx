import { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clearCart, getCart, removeFromCart, updateCartItem } from '../api/cart.js';
import { isAuthenticated } from '../api/auth.js';

export default function Cart() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const inUserArea = location.pathname.startsWith('/user');

  const { data, isLoading, error } = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
  });

  const removeMutation = useMutation({
    mutationFn: removeFromCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const updateQtyMutation = useMutation({
    mutationFn: ({ productId, quantity }) => updateCartItem(productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: clearCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const items = data?.data?.items ?? [];
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.lineTotal ?? 0), 0),
    [items]
  );
  const totalAmount = subtotal;
  const errorMessage = error?.response?.data?.error ?? 'Failed to load cart';
  const canProceed = items.length > 0;

  const handleProceedToCheckout = () => {
    if (!canProceed) return;
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    navigate('/checkout?fromCart=1');
  };

  const shopLink = inUserArea ? '/user/my-plan' : '/business-plan';

  return (
    <section className={`mx-auto max-w-6xl ${inUserArea ? '' : 'px-4 py-10 sm:px-6 lg:px-8'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Cart</h1>
        <Link
          to={shopLink}
          className="text-sm font-medium text-teal-600 hover:text-teal-700"
        >
          ← Continue shopping
        </Link>
      </div>

      {isLoading ? (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 text-slate-500">Loading cart...</div>
      ) : error ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{errorMessage}</div>
      ) : items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-600">Your cart is empty.</p>
          <Link to={shopLink} className="mt-4 inline-flex text-sm font-semibold text-teal-600 hover:text-teal-700">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.8fr_0.9fr]">
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => clearCartMutation.mutate()}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Clear cart
              </button>
            </div>
            {items.map((item) => (
              <article key={item.product._id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    {item.product.imageUrl ? (
                      <img src={item.product.imageUrl} alt={item.product.name} className="h-20 w-20 rounded-md object-cover" />
                    ) : (
                      <div className="h-20 w-20 rounded-md bg-slate-100" />
                    )}
                    <div>
                      <h2 className="font-semibold text-slate-900">{item.product.name}</h2>
                      <p className="text-sm text-slate-500">
                        Rs {Number(item.product?.price ?? 0).toLocaleString()} each
                      </p>
                      <p className="text-sm font-semibold text-teal-700">
                        Rs {Number(item.lineTotal ?? 0).toLocaleString()}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const next = Math.max(1, item.quantity - 1);
                            updateQtyMutation.mutate({ productId: item.product._id, quantity: next });
                          }}
                          disabled={item.quantity <= 1 || updateQtyMutation.isPending}
                          className="h-8 w-8 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                          aria-label={`Decrease quantity for ${item.product.name}`}
                        >
                          -
                        </button>
                        <span className="min-w-8 text-center text-sm font-semibold text-slate-900">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => {
                            updateQtyMutation.mutate({
                              productId: item.product._id,
                              quantity: item.quantity + 1,
                            });
                          }}
                          disabled={updateQtyMutation.isPending}
                          className="h-8 w-8 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                          aria-label={`Increase quantity for ${item.product.name}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMutation.mutate(item.product._id)}
                    className="rounded-md border border-slate-300 p-2 text-slate-600 hover:bg-slate-100"
                    aria-label={`Remove ${item.product.name} from cart`}
                    title="Remove"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 6V4h8v2" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 6l-1 14H6L5 6" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6M14 11v6" />
                    </svg>
                  </button>
                </div>
              </article>
            ))}
          </div>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-2xl font-semibold text-slate-900">Order summary</h2>
            <p className="mt-1 text-xs text-slate-500">{items.length} product line(s)</p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-600">Subtotal</span>
                <span className="font-semibold text-slate-900">Rs {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-600">Shipping</span>
                <span className="font-semibold text-green-700">FREE</span>
              </div>
            </div>

            <div className="mt-4 border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-slate-900">Total</span>
                <span className="text-lg font-bold text-slate-900">Rs {totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleProceedToCheckout}
              disabled={!canProceed}
              className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Place order & pay
            </button>
            <Link to={shopLink} className="mt-3 block text-center text-sm font-medium text-slate-600 hover:text-slate-900">
              Add more products
            </Link>
          </aside>
        </div>
      )}
    </section>
  );
}
