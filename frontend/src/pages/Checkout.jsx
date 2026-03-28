import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProductById } from '../api/products.js';
import { createOrder, verifyOrderPayment } from '../api/orders.js';
import { getStoredUser } from '../api/auth.js';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

export default function Checkout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [paying, setPaying] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId') ?? '';
  const user = getStoredUser();

  const {
    data: productData,
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: ['checkout', 'product', productId],
    queryFn: () => getProductById(productId),
    enabled: Boolean(productId),
  });

  const product = productData?.data?.product ?? null;
  const error = queryError ? (queryError.response?.data?.error ?? 'Failed to load product details') : '';

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

  const handleBuyPlan = async () => {
    if (!product?._id) return;
    setPaying(true);
    setPaymentMessage('');
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
          await verifyOrderPayment({
            orderId: backendOrder._id,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          queryClient.invalidateQueries({ queryKey: ['user', 'my-orders'] });
          queryClient.invalidateQueries({ queryKey: ['user', 'renewal-orders'] });
          setPaymentMessage('Payment successful. Your order has been placed.');
          setTimeout(() => {
            navigate('/user/my-plan');
          }, 700);
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', () => {
        setPaymentMessage('Payment failed. Please try again.');
      });
      paymentObject.open();
    } catch (e) {
      setPaymentMessage(e?.response?.data?.error ?? e.message ?? 'Failed to start payment');
    } finally {
      setPaying(false);
    }
  };

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900">Checkout</h1>
      <p className="mt-2 text-slate-600">Review your selected product and continue with plan purchase.</p>

      {!productId && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-700">
          No product selected. Please go back and choose a product.
        </div>
      )}

      {productId && loading && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 text-slate-500">
          Loading product...
        </div>
      )}

      {productId && error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
      )}

      {product && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl bg-slate-100 p-4">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="mx-auto max-h-72 w-auto object-contain" />
              ) : (
                <div className="flex h-72 items-center justify-center text-slate-400">No image</div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">{product.name}</h2>
              {product.description && <p className="mt-3 text-slate-600">{product.description}</p>}
              <div className="mt-5 space-y-2 text-sm">
                <p className="text-slate-700">
                  <span className="font-medium">Price:</span> Rs {product.price?.toLocaleString() ?? '0'}
                </p>
                <p className="text-slate-700">
                  <span className="font-medium">Business Volume:</span> {product.businessVolume ?? 0}
                </p>
              </div>
              <button
                type="button"
                onClick={handleBuyPlan}
                disabled={paying}
                className="mt-6 w-full rounded-lg bg-teal-600 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
              >
                {paying ? 'Processing...' : 'Buy Plan'}
              </button>
              {paymentMessage && (
                <p className="mt-3 text-sm text-slate-600">{paymentMessage}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        <Link to="/business-plan" className="text-sm font-medium text-teal-600 hover:text-teal-700">
          ← Back to products
        </Link>
      </div>
    </section>
  );
}
