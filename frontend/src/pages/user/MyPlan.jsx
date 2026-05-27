import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyOrders } from '../../api/orders.js';
import { getProducts } from '../../api/products.js';
import { createOrder, verifyOrderPayment } from '../../api/orders.js';
import { addToCart, getCart } from '../../api/cart.js';
import { getStoredUser } from '../../api/auth.js';

export default function MyPlan() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const purchaseSuccess = searchParams.get('purchase') === 'success';
  const user = getStoredUser();
  const [cartToast, setCartToast] = useState('');

  const { data, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['user', 'my-orders'],
    queryFn: getMyOrders,
  });
  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ['products', 'my-plan-all'],
    queryFn: getProducts,
    select: (res) => res?.data?.products ?? [],
  });
  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
  });

  const addToCartMutation = useMutation({
    mutationFn: ({ productId, quantity }) => addToCart(productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setCartToast('Added to cart');
      setTimeout(() => setCartToast(''), 2000);
    },
    onError: (e) => {
      setCartToast(e?.response?.data?.error ?? 'Could not add to cart');
      setTimeout(() => setCartToast(''), 3000);
    },
  });

  const error = queryError ? (queryError.response?.data?.error ?? 'Failed to load your plan') : '';
  const orders = data?.data?.orders ?? [];
  const products = productsData ?? [];
  const cartCount = cartData?.data?.totalItems ?? 0;

  const paidOrders = useMemo(
    () => orders.filter((order) => order.status === 'paid'),
    [orders]
  );

  const loadRazorpayScript = () => new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  const handleBuyPlanDirect = async (product) => {
    if (!product?._id) return;
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Failed to load Razorpay SDK');

      const created = await createOrder(product._id);
      const backendOrder = created?.data?.order;
      const razorpayOrder = created?.data?.razorpayOrder;
      const razorpayKeyId = created?.data?.razorpayKeyId;
      if (!backendOrder || !razorpayOrder || !razorpayKeyId) {
        throw new Error('Order initialization failed');
      }

      const options = {
        key: razorpayKeyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Amruta Wellness',
        description: product.name,
        order_id: razorpayOrder.id,
        prefill: {
          name: user?.name ?? '',
          email: user?.email ?? '',
          contact: user?.mobile ?? '',
        },
        theme: { color: '#0f766e' },
        handler: async (response) => {
          try {
            await verifyOrderPayment({
              orderId: backendOrder._id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            queryClient.invalidateQueries({ queryKey: ['user', 'my-orders'] });
            queryClient.invalidateQueries({ queryKey: ['user', 'renewal-orders'] });
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            queryClient.invalidateQueries({ queryKey: ['user-wallet'] });
            navigate('/user/my-plan?purchase=success', { replace: true });
          } catch (err) {
            window.alert(err?.response?.data?.error ?? err?.message ?? 'Could not verify payment');
          }
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', () => {
        window.alert('Payment failed. Please try again.');
      });
      paymentObject.open();
    } catch (e) {
      window.alert(e?.response?.data?.error ?? e?.message ?? 'Failed to start payment');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Plan</h1>
          <p className="mt-1 text-slate-600">Browse products, add multiple items to cart, and place your order.</p>
        </div>
        <Link
          to="/user/cart"
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          View cart
          {cartCount > 0 && (
            <span className="rounded-full bg-teal-500 px-2 py-0.5 text-xs font-bold">{cartCount}</span>
          )}
        </Link>
      </div>

      {cartToast && (
        <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50 px-4 py-2 text-sm text-teal-800">
          {cartToast}
        </div>
      )}

      {purchaseSuccess && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Order placed successfully.
        </div>
      )}

      {/* All products */}
      <section className="mt-8">
        <h2 className="text-xl font-bold text-slate-900">All products</h2>
        <p className="mt-1 text-sm text-slate-600">
          Add one or more products to your cart, then checkout once for the full amount.
        </p>

        {loadingProducts ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            No active products available.
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <article key={product._id} className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="rounded-lg bg-slate-100 p-3">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="mx-auto h-36 w-auto object-contain" />
                  ) : (
                    <div className="flex h-36 items-center justify-center text-xs text-slate-400">No image</div>
                  )}
                </div>
                <h3 className="mt-3 text-base font-semibold text-slate-900">{product.name}</h3>
                {product.description ? (
                  <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-600">{product.description}</p>
                ) : (
                  <p className="mt-1 flex-1 text-sm text-slate-500">Wellness plan product</p>
                )}
                <p className="mt-2 text-sm text-slate-700">
                  Price: <span className="font-semibold">Rs {Number(product.price ?? 0).toLocaleString()}</span>
                </p>
                {product.businessVolume > 0 && (
                  <p className="text-xs text-slate-500">BV: {product.businessVolume}</p>
                )}
                <div className="mt-4 flex w-full flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => addToCartMutation.mutate({ productId: product._id, quantity: 1 })}
                    disabled={addToCartMutation.isPending}
                    className="inline-flex w-full items-center justify-center rounded-lg border border-teal-600 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-800 hover:bg-teal-100 disabled:opacity-60"
                  >
                    Add to cart
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBuyPlanDirect(product)}
                    className="inline-flex w-full items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
                  >
                    Buy now (pay)
                  </button>
                  <Link
                    to={`/checkout?productId=${product._id}`}
                    className="inline-flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Checkout with address
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Purchased */}
      <section className="mt-12 border-t border-slate-200 pt-10">
        <h2 className="text-xl font-bold text-slate-900">Your purchased plans</h2>
        <p className="mt-1 text-sm text-slate-600">Products you have paid for successfully.</p>

        {loading && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            Loading your purchased products...
          </div>
        )}

        {!loading && error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {!loading && !error && paidOrders.length === 0 && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            You have not purchased any plan yet. Add products from the catalog above.
          </div>
        )}

        {!loading && !error && paidOrders.length > 0 && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paidOrders.map((order) => (
              <article key={order._id} className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="rounded-lg bg-slate-100 p-3">
                  {order.productSnapshot?.imageUrl ? (
                    <img
                      src={order.productSnapshot.imageUrl}
                      alt={order.productSnapshot?.name ?? 'Product'}
                      className="mx-auto h-36 w-auto object-contain"
                    />
                  ) : (
                    <div className="flex h-36 items-center justify-center text-xs text-slate-400">No image</div>
                  )}
                </div>
                <h3 className="mt-3 text-base font-semibold text-slate-900">{order.productSnapshot?.name ?? 'Product'}</h3>
                <p className="mt-1 text-sm text-slate-700">
                  Amount: <span className="font-medium">Rs {order.amount?.toLocaleString() ?? 0}</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Purchased on: {order.paidAt ? new Date(order.paidAt).toLocaleString() : '—'}
                </p>
                <span className="mt-auto inline-flex w-fit rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                  Paid
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
