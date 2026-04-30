import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getProductById } from '../api/products.js';
import { createOrder, verifyOrderPayment } from '../api/orders.js';
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
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    pincode: '',
    district: '',
    tehsil: '',
    state: '',
  });
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
  const deliveryCharge = selectedAddress ? (selectedAddress.state?.toLowerCase() === 'maharashtra' ? 120 : 150) : null;
  const totalAmount = Number(product?.price ?? 0) + Number(deliveryCharge ?? 0);

  const addAddressMutation = useMutation({
    mutationFn: createMyAddress,
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({ queryKey: ['user', 'addresses'] });
      const createdId = res?.data?.address?._id ?? '';
      setSelectedAddressId(createdId);
      setShowAddressForm(false);
      setAddressMessage('Address added successfully.');
      setAddressForm({ fullName: '', phone: '', pincode: '', district: '', tehsil: '', state: '' });
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

  const handleBuyPlan = async () => {
    if (!product?._id) return;
    if (!selectedAddress) {
      setPaymentMessage('Please add/select address before buying plan.');
      return;
    }
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
          queryClient.invalidateQueries({ queryKey: ['cart'] });
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

  const handleAddressInput = (event) => {
    const { name, value } = event.target;
    setAddressForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'pincode' ? { state: '', district: '', tehsil: '' } : {}),
    }));
  };

  const handlePincodeBlur = async () => {
    const pincode = addressForm.pincode?.trim();
    if (!/^\d{6}$/.test(pincode)) return;
    setIsFetchingPincodeDetails(true);
    try {
      const res = await detectAddressStateByPincode(pincode);
      const state = res?.data?.state ?? '';
      const district = res?.data?.district ?? '';
      const tehsil = res?.data?.tehsil ?? '';
      setAddressForm((prev) => ({ ...prev, state, district, tehsil }));
    } catch {
      setAddressForm((prev) => ({ ...prev, state: '', district: '', tehsil: '' }));
    } finally {
      setIsFetchingPincodeDetails(false);
    }
  };

  const handleAddAddress = (event) => {
    event.preventDefault();
    setAddressMessage('');
    addAddressMutation.mutate({
      fullName: addressForm.fullName,
      phone: addressForm.phone,
      pincode: addressForm.pincode,
    });
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-6 sm:px-5 lg:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Checkout</h1>

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
                        <p>{address.tehsil}, {address.district} - {address.pincode}</p>
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
                <form onSubmit={handleAddAddress} className="mt-4 grid gap-2 sm:grid-cols-2">
                  <input name="fullName" value={addressForm.fullName} onChange={handleAddressInput} placeholder="Full Name" className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs" required />
                  <input name="phone" value={addressForm.phone} onChange={handleAddressInput} placeholder="Phone" className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs" required />
                  <input name="pincode" value={addressForm.pincode} onChange={handleAddressInput} onBlur={handlePincodeBlur} placeholder="Pincode" className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs" required />
                  <input name="district" value={addressForm.district} readOnly placeholder="District (auto from pincode)" className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-2 text-xs text-slate-700" />
                  <input name="tehsil" value={addressForm.tehsil} readOnly placeholder="Tehsil (auto from pincode)" className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-2 text-xs text-slate-700" />
                  <input name="state" value={addressForm.state} readOnly placeholder="State (auto from pincode)" className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-2 text-xs text-slate-700" />
                  {isFetchingPincodeDetails && (
                    <div className="sm:col-span-2 flex items-center gap-2 text-xs text-slate-500">
                      <span className="h-3 w-3 animate-spin rounded-full border border-slate-400 border-t-transparent" />
                      Fetching details...
                    </div>
                  )}
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
              )}
              {addressMessage && <p className="mt-2 text-xs text-slate-600">{addressMessage}</p>}
            </div>
          </div>

          <aside className="h-fit rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-20">
            <h2 className="text-xl font-bold text-slate-900">Order Summary</h2>

            <div className="mt-3 flex items-center gap-2.5 rounded-lg bg-slate-50 p-2.5">
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

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-semibold text-slate-900">Rs {Number(product.price ?? 0).toLocaleString()}</span>
              </div>
              {selectedAddress && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Delivery Charges</span>
                  <span className="font-semibold text-slate-900">Rs {Number(deliveryCharge ?? 0).toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="mt-3 border-t border-slate-200 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-slate-900">Total</span>
                <span className="text-base font-bold text-slate-900">
                  Rs {Number(selectedAddress ? totalAmount : Number(product.price ?? 0)).toLocaleString()}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleBuyPlan}
              disabled={paying || !selectedAddress}
              className="mt-4 w-full rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {paying ? 'Processing...' : 'Buy Plan'}
            </button>
            {!selectedAddress && (
              <p className="mt-2 text-xs text-red-600">Add address to enable Buy Plan.</p>
            )}
            {paymentMessage && <p className="mt-2 text-xs text-slate-600">{paymentMessage}</p>}
          </aside>
        </div>
      )}

      <div className="mt-4">
        <Link to="/business-plan" className="text-xs font-medium text-teal-600 hover:text-teal-700">
          ← Back to products
        </Link>
      </div>
    </section>
  );
}
