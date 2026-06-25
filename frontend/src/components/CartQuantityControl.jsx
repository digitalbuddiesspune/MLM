import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addToCart, getCart, removeFromCart, updateCartItem } from '../api/cart.js';
import { isAuthenticated } from '../api/auth.js';

const VARIANTS = {
  teal: {
    add: 'border border-teal-600 bg-teal-50 text-teal-800 hover:bg-teal-100',
    control: 'border border-teal-600 bg-teal-50',
    btn: 'text-teal-800 hover:bg-teal-100',
    qty: 'text-teal-900',
    ring: 'ring-teal-400',
  },
  dark: {
    add: 'border border-[#0b0d10] bg-white text-[#0b0d10] hover:bg-[#d7dde1]',
    control: 'border border-[#0b0d10] bg-white',
    btn: 'text-[#0b0d10] hover:bg-[#d7dde1]',
    qty: 'text-[#0b0d10]',
    ring: 'ring-[#0b0d10]/30',
  },
  slate: {
    add: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
    control: 'border border-slate-300 bg-slate-50',
    btn: 'text-slate-700 hover:bg-slate-100',
    qty: 'text-slate-900',
    ring: 'ring-slate-400',
  },
};

export default function CartQuantityControl({
  productId,
  variant = 'teal',
  fullWidth = true,
  compact = false,
  removeAtZero = true,
  onAdded,
}) {
  const queryClient = useQueryClient();
  const [highlight, setHighlight] = useState(false);
  const [popKey, setPopKey] = useState(0);
  const styles = VARIANTS[variant] ?? VARIANTS.teal;

  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
    enabled: isAuthenticated(),
  });

  const quantity = useMemo(() => {
    const items = cartData?.data?.items ?? [];
    const item = items.find((entry) => entry.product._id === productId);
    return item?.quantity ?? 0;
  }, [cartData, productId]);

  const invalidateCart = () => {
    queryClient.invalidateQueries({ queryKey: ['cart'] });
  };

  const pulse = () => {
    setPopKey((key) => key + 1);
    setHighlight(true);
    window.setTimeout(() => setHighlight(false), 500);
  };

  const addMutation = useMutation({
    mutationFn: () => addToCart(productId, 1),
    onSuccess: () => {
      invalidateCart();
      pulse();
      onAdded?.();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (nextQuantity) => updateCartItem(productId, nextQuantity),
    onSuccess: () => {
      invalidateCart();
      pulse();
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => removeFromCart(productId),
    onSuccess: () => {
      invalidateCart();
    },
  });

  const isPending = addMutation.isPending || updateMutation.isPending || removeMutation.isPending;
  const widthClass = fullWidth ? 'w-full' : 'w-auto';
  const sizeClass = compact ? 'h-8 text-xs' : 'h-10 text-sm';

  const handleDecrement = () => {
    if (quantity <= 1 && removeAtZero) {
      removeMutation.mutate();
      return;
    }
    if (quantity > 1) {
      updateMutation.mutate(quantity - 1);
    }
  };

  const handleIncrement = () => {
    updateMutation.mutate(quantity + 1);
  };

  if (!isAuthenticated()) {
    return (
      <Link
        to="/login"
        className={`inline-flex ${widthClass} items-center justify-center rounded-lg px-4 py-2 font-medium transition-colors ${sizeClass} ${styles.add}`}
      >
        Add to cart
      </Link>
    );
  }

  if (quantity === 0) {
    return (
      <button
        type="button"
        onClick={() => addMutation.mutate()}
        disabled={isPending}
        className={`inline-flex ${widthClass} items-center justify-center rounded-lg px-4 py-2 font-medium transition-all duration-300 disabled:opacity-60 ${sizeClass} ${styles.add} ${
          highlight ? `scale-[1.02] ring-2 ${styles.ring}` : ''
        }`}
      >
        Add to cart
      </button>
    );
  }

  return (
    <div
      className={`inline-flex ${widthClass} items-center justify-between overflow-hidden rounded-lg transition-all duration-300 ${sizeClass} ${styles.control} animate-cart-expand-in ${
        highlight ? `ring-2 ${styles.ring}` : ''
      }`}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={isPending}
        className={`flex h-full flex-1 items-center justify-center font-semibold transition-colors disabled:opacity-50 ${styles.btn}`}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span
        key={popKey}
        className={`min-w-10 px-2 text-center font-bold tabular-nums animate-cart-pop ${styles.qty}`}
      >
        {quantity}
      </span>
      <button
        type="button"
        onClick={handleIncrement}
        disabled={isPending}
        className={`flex h-full flex-1 items-center justify-center font-semibold transition-colors disabled:opacity-50 ${styles.btn}`}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
