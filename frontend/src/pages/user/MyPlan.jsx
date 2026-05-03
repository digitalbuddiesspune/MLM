import { useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyOrders } from '../../api/orders.js';
import { getProducts } from '../../api/products.js';
import { createOrder, verifyOrderPayment } from '../../api/orders.js';
import { getStoredUser } from '../../api/auth.js';
export default function MyPlan() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const purchaseSuccess = searchParams.get('purchase') === 'success';
  const user = getStoredUser();

  const { data, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['user', 'my-orders'],
    queryFn: getMyOrders,
  });
  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ['products', 'order-more'],
    queryFn: getProducts,
    select: (res) => res?.data?.products ?? [],
  });
  const error = queryError ? (queryError.response?.data?.error ?? 'Failed to load your plan') : '';
  const orders = data?.data?.orders ?? [];
  const products = productsData ?? [];

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
      <h1 className="text-2xl font-bold text-slate-900">My Plan</h1>
      <p className="mt-1 text-slate-600">Products you have purchased successfully.</p>
      {purchaseSuccess && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Product purchased successfully.
        </div>
      )}

      {loading && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Loading your purchased products...
        </div>
      )}

      {!loading && error && (
        <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {!loading && !error && paidOrders.length === 0 && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          You have not purchased any plan yet.
        </div>
      )}

      {!loading && !error && paidOrders.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              <h2 className="mt-3 text-base font-semibold text-slate-900">{order.productSnapshot?.name ?? 'Product'}</h2>
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

      <div className="mt-10">
        <h2 className="text-xl font-bold text-slate-900">Buy a plan</h2>
        <p className="mt-1 text-sm text-slate-600">
          Pay here with Razorpay — no address required. Optionally use{' '}
          <strong>Checkout with address</strong> below if you need delivery details saved.
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
                <p className="mt-1 flex-1 text-sm text-slate-700">
                  Amount: <span className="font-medium">Rs {Number(product.price ?? 0).toLocaleString()}</span>
                </p>
                <div className="mt-4 flex w-full flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => handleBuyPlanDirect(product)}
                    className="inline-flex w-full items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
                  >
                    Buy plan (pay now)
                  </button>
                  <Link
                    to={`/checkout?productId=${product._id}`}
                    className="inline-flex w-full items-center justify-center rounded-lg border border-teal-600 bg-white px-4 py-2 text-sm font-medium text-teal-800 hover:bg-teal-50"
                  >
                    Checkout with address
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
