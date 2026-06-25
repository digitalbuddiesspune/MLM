import { useEffect, useState } from 'react';

export default function CartToast({ message, onDone }) {
  const [visible, setVisible] = useState(Boolean(message));
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!message) return undefined;

    setVisible(true);
    setExiting(false);

    const fadeTimer = window.setTimeout(() => setExiting(true), 1700);
    const hideTimer = window.setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 2000);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, [message, onDone]);

  if (!visible || !message) return null;

  return (
    <div
      role="status"
      className={`fixed right-4 top-20 z-50 flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800 shadow-lg sm:right-6 ${
        exiting ? 'animate-cart-fade-out' : 'animate-cart-slide-in'
      }`}
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-white">
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </span>
      {message}
    </div>
  );
}
