import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getProductById } from '../api/products.js';
import { createOrder, verifyOrderPayment, createCartCheckout, verifyCartCheckout } from '../api/orders.js';
import { getCart } from '../api/cart.js';
import { getStoredUser } from '../api/auth.js';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { createMyAddress, detectAddressStateByPincode, getMyAddresses } from '../api/user.js';

export default function Checkout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [paying, setPaying] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [addressMessage, setAddressMessage] = useState('');
  const [isFetchingPincodeDetails, setIsFetchingPincodeDetails] = useState(false);
  const [lastFetchedPincode, setLastFetchedPincode] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    streetAddress: '',
    pincode: '',
    district: '',
    tehsil: '',
    state: '',
  });
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId') ?? '';
  const fromCart = searchParams.get('fromCart') === '1';
  const user = getStoredUser();

  const {
    data: productData,
    isLoading: loadingProduct,
    error: queryError,
  } = useQuery({
    queryKey: ['checkout', 'product', productId],
    queryFn: () => getProductById(productId),
    enabled: Boolean(productId) && !fromCart,
  });

  const {
    data: cartPayload,
    isLoading: loadingCart,
    error: cartError,
  } = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
    enabled: fromCart,
  });

  const product = productData?.data?.product ?? null;
  const cartItems = cartPayload?.data?.items ?? [];
  const cartTotal = Number(cartPayload?.data?.totalAmount ?? 0);
  const error = fromCart
    ? (cartError ? (cartError.response?.data?.error ?? 'Failed to load cart') : '')
    : (queryError ? (queryError.response?.data?.error ?? 'Failed to load product details') : '');
  const loading = fromCart ? loadingCart : loadingProduct;
  const readyToCheckout = fromCart ? cartItems.length > 0 : Boolean(product);
  const {
    data: addressesData,
    isLoading: loadingAddresses,
  } = useQuery({
    queryKey: ['user', 'addresses'],
    queryFn: getMyAddresses,
  });
  const addresses = addressesData?.data?.addresses ?? [];
  const shouldShowAddressForm = addresses.length === 0 || showAddressForm;
  const selectedAddress = addresses.find((item) => item._id === selectedAddressId) ?? addresses[0] ?? null;
  const totalAmount = fromCart ? cartTotal : Number(product?.price ?? 0);

  const addAddressMutation = useMutation({
    mutationFn: createMyAddress,
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({ queryKey: ['user', 'addresses'] });
      const createdId = res?.data?.address?._id ?? '';
      setSelectedAddressId(createdId);
      setShowAddressForm(false);
      setAddressMessage('Address added successfully.');
      setAddressForm({
        fullName: '',
        phone: '',
        streetAddress: '',
        pincode: '',
        district: '',
        tehsil: '',
        state: '',
      });
    },
    onError: (e) => {
      setAddressMessage(e?.response?.data?.error ?? 'Failed to add address');
    },
  });

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

  const afterPaymentSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['cart'] });
    queryClient.invalidateQueries({ queryKey: ['user', 'my-orders'] });
    queryClient.invalidateQueries({ queryKey: ['user', 'renewal-orders'] });
    queryClient.invalidateQueries({ queryKey: ['user-wallet'] });
    setPaymentMessage('Payment successful. Your order has been placed.');
    setTimeout(() => {
      navigate('/user/my-plan?purchase=success');
    }, 700);
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setPaymentMessage('Please add or select a delivery address before placing your order.');
      return;
    }
    if (fromCart && cartItems.length === 0) {
      setPaymentMessage('Your cart is empty.');
      return;
    }
    if (!fromCart && !product?._id) return;

    setPaying(true);
    setPaymentMessage('');
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Failed to load Razorpay SDK');

      if (fromCart) {
        const created = await createCartCheckout();
        const pendingCartPaymentId = created?.data?.pendingCartPaymentId;
        const razorpayOrder = created?.data?.razorpayOrder;
        const razorpayKeyId = created?.data?.razorpayKeyId;
        if (!pendingCartPaymentId || !razorpayOrder || !razorpayKeyId) {
          throw new Error('Cart checkout initialization failed');
        }

        const options = {
          key: razorpayKeyId,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: 'Amruta Wellness',
          description: `Cart order (${cartItems.length} item line(s))`,
          order_id: razorpayOrder.id,
          prefill: {
            name: user?.name ?? '',
            email: user?.email ?? '',
            contact: user?.mobile ?? '',
          },
          theme: { color: '#0f766e' },
          handler: async (response) => {
            await verifyCartCheckout({
              pendingCartPaymentId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            afterPaymentSuccess();
          },
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.on('payment.failed', () => {
          setPaymentMessage('Payment failed. Please try again.');
        });
        paymentObject.open();
        return;
      }

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
          afterPaymentSuccess();
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

  const fetchPincodeDetails = async (rawPincode) => {
    const pincode = String(rawPincode ?? '').trim();
    if (!/^\d{6}$/.test(pincode)) return;
    if (pincode === lastFetchedPincode) return;
    setIsFetchingPincodeDetails(true);
    try {
      const res = await detectAddressStateByPincode(pincode);
      const state = res?.data?.state ?? '';
      const district = res?.data?.district ?? '';
      const tehsil = res?.data?.tehsil ?? '';
      setAddressForm((prev) => ({ ...prev, state, district, tehsil }));
      setLastFetchedPincode(pincode);
    } catch {
      setAddressForm((prev) => ({ ...prev, state: '', district: '', tehsil: '' }));
      setLastFetchedPincode('');
    } finally {
      setIsFetchingPincodeDetails(false);
    }
  };

  const handleAddressInput = (event) => {
    const { name, value } = event.target;
    if (name === 'pincode') {
      const cleanedPincode = value.replace(/\D/g, '').slice(0, 6);
      setAddressForm((prev) => ({
        ...prev,
        pincode: cleanedPincode,
        state: '',
        district: '',
        tehsil: '',
      }));
      setLastFetchedPincode('');
      if (cleanedPincode.length === 6) {
        void fetchPincodeDetails(cleanedPincode);
      }
      return;
    }

    setAddressForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddAddress = (event) => {
    event.preventDefault();
    setAddressMessage('');
    addAddressMutation.mutate({
      fullName: addressForm.fullName,
      phone: addressForm.phone,
      streetAddress: addressForm.streetAddress,
      pincode: addressForm.pincode,
    });
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-6 sm:px-5 lg:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Checkout</h1>

      {!fromCart && !productId && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-700">
          No product selected.{' '}
          <Link to="/user/my-plan" className="font-semibold underline">Browse products</Link> or{' '}
          <Link to="/user/cart" className="font-semibold underline">open your cart</Link>.
        </div>
      )}

      {fromCart && !loading && cartItems.length === 0 && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-700">
          Your cart is empty.{' '}
          <Link to="/user/my-plan" className="font-semibold underline">Add products</Link>
        </div>
      )}

      {loading && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 text-slate-500">
          {fromCart ? 'Loading cart...' : 'Loading product...'}
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
      )}

      {readyToCheckout && !loading && (
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.65fr_0.95fr]">
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Payment Method</h2>
              <label className="mt-3 flex items-start gap-2.5 rounded-lg border border-slate-300 p-3">
                <input type="radio" checked readOnly className="mt-1" />
                <div>
                  <p className="text-base font-semibold text-slate-900">Pay Online</p>
                  <p className="text-xs text-slate-600">UPI, Cards, Net Banking</p>
                </div>
              </label>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Deliver To</h2>

              {loadingAddresses ? (
                <p className="mt-3 text-xs text-slate-500">Loading addresses...</p>
              ) : addresses.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {addresses.map((address) => (
                    <label key={address._id} className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-slate-200 p-2.5">
                      <input
                        type="radio"
                        name="selectedAddress"
                        value={address._id}
                        checked={(selectedAddressId || addresses[0]?._id) === address._id}
                        onChange={(e) => setSelectedAddressId(e.target.value)}
                        className="mt-1"
                      />
                      <div className="text-xs text-slate-700">
                        <p className="font-semibold text-slate-900">{address.fullName} ({address.phone})</p>
                        {address.streetAddress ? (
                          <p className="mt-0.5 text-slate-800">{address.streetAddress}</p>
                        ) : null}
                        <p className="mt-0.5">{address.tehsil}, {address.district} — {address.pincode}</p>
                        <p>{address.state}</p>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="mt-3 rounded-lg border border-dashed border-slate-300 p-2.5 text-xs text-slate-600">
                  No saved address yet. Add one to continue.
                </p>
              )}

              {!shouldShowAddressForm && (
                <button
                  type="button"
                  onClick={() => setShowAddressForm(true)}
                  className="mt-4 rounded-lg border border-slate-400 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                >
                  + Add Address
                </button>
              )}

              {shouldShowAddressForm && (
                <div className="relative mt-4">
                  <form
                    onSubmit={handleAddAddress}
                    className={`grid gap-2 sm:grid-cols-2 ${isFetchingPincodeDetails ? 'pointer-events-none select-none blur-[1px]' : ''}`}
                  >
                    <input name="fullName" value={addressForm.fullName} onChange={handleAddressInput} placeholder="Full Name" className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs" required />
                    <input name="phone" value={addressForm.phone} onChange={handleAddressInput} placeholder="Phone" className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs" required />
                    <label className="sm:col-span-2 block text-[10px] font-medium uppercase tracking-wide text-slate-500">
                      Street address
                      <textarea
                        name="streetAddress"
                        value={addressForm.streetAddress}
                        onChange={handleAddressInput}
                        placeholder="House no., building, road, area"
                        rows={2}
                        required
                        minLength={5}
                        maxLength={500}
                        className="mt-1 w-full resize-y rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
                      />
                    </label>
                    <input name="pincode" value={addressForm.pincode} onChange={handleAddressInput} placeholder="Pincode" className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs" required />
                    <input name="district" value={addressForm.district} readOnly placeholder="District (auto from pincode)" className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-2 text-xs text-slate-700" />
                    <input name="tehsil" value={addressForm.tehsil} readOnly placeholder="Tehsil (auto from pincode)" className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-2 text-xs text-slate-700" />
                    <input name="state" value={addressForm.state} readOnly placeholder="State (auto from pincode)" className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-2 text-xs text-slate-700" />
                    <div className="sm:col-span-2 flex flex-wrap gap-1.5">
                      <button
                        type="submit"
                        disabled={addAddressMutation.isPending}
                        className="rounded-lg border border-slate-400 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
                      >
                        {addAddressMutation.isPending ? 'Saving Address...' : 'Save Address'}
                      </button>
                      {addresses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowAddressForm(false)}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>

                  {isFetchingPincodeDetails && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/80 backdrop-blur-sm">
                      <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-sm">
                        <span className="h-3 w-3 animate-spin rounded-full border border-slate-400 border-t-transparent" />
                        Fetching details...
                      </div>
                    </div>
                  )}
                </div>
              )}
              {addressMessage && <p className="mt-2 text-xs text-slate-600">{addressMessage}</p>}
            </div>
          </div>

          <aside className="h-fit rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-20">
            <h2 className="text-xl font-bold text-slate-900">Order summary</h2>

            <div className="mt-3 max-h-52 space-y-2 overflow-y-auto">
              {fromCart ? (
                cartItems.map((item) => (
                  <div key={item.product._id} className="flex items-center gap-2.5 rounded-lg bg-slate-50 p-2.5">
                    {item.product.imageUrl ? (
                      <img src={item.product.imageUrl} alt={item.product.name} className="h-10 w-10 rounded-md object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-slate-200" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-900">{item.product.name}</p>
                      <p className="text-xs text-slate-600">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-xs font-semibold text-slate-900">Rs {Number(item.lineTotal ?? 0).toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-2.5 rounded-lg bg-slate-50 p-2.5">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="h-12 w-12 rounded-md object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-md bg-slate-200" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-900">{product.name}</p>
                    <p className="text-xs text-slate-600">Qty: 1</p>
                  </div>
                  <p className="ml-auto text-xs font-semibold text-slate-900">Rs {Number(product.price ?? 0).toLocaleString()}</p>
                </div>
              )}
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-semibold text-slate-900">Rs {Number(totalAmount).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Shipping</span>
                <span className="font-semibold text-green-700">FREE</span>
              </div>
            </div>

            <div className="mt-3 border-t border-slate-200 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-slate-900">Total</span>
                <span className="text-base font-bold text-slate-900">
                  Rs {Number(totalAmount).toLocaleString()}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={paying || !selectedAddress}
              className="mt-4 w-full rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {paying ? 'Processing...' : fromCart ? 'Place order & pay' : 'Buy plan'}
            </button>
            {!selectedAddress && (
              <p className="mt-2 text-xs text-red-600">Add an address to place your order.</p>
            )}
            {paymentMessage && <p className="mt-2 text-xs text-slate-600">{paymentMessage}</p>}
          </aside>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-4">
        <Link to="/user/my-plan" className="text-xs font-medium text-teal-600 hover:text-teal-700">
          ← Back to products
        </Link>
        {fromCart && (
          <Link to="/user/cart" className="text-xs font-medium text-slate-600 hover:text-slate-900">
            Edit cart
          </Link>
        )}
      </div>
    </section>
  );
}
