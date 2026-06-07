import { useState } from 'react';

function EyeIcon({ hidden }) {
  if (hidden) {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.58 10.58A2 2 0 0013.42 13.42" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.88 5.09A10.89 10.89 0 0112 4.9c4.56 0 8.36 2.95 9.5 7.1a10.6 10.6 0 01-3.2 4.9M6.53 6.53A10.94 10.94 0 002.5 12c.53 1.93 1.7 3.62 3.27 4.86A10.86 10.86 0 0012 19.1c1 0 1.98-.13 2.9-.39"
        />
      </svg>
    );
  }

  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.5 12C3.64 7.85 7.44 4.9 12 4.9s8.36 2.95 9.5 7.1c-1.14 4.15-4.94 7.1-9.5 7.1S3.64 16.15 2.5 12z"
      />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function PasswordInput({
  id,
  value,
  onChange,
  required = false,
  autoComplete,
  disabled = false,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative mt-1">
      <input
        id={id}
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        disabled={disabled}
        className="block w-full rounded-lg border border-slate-300 py-2 pl-3 pr-10 shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-60"
      />
      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        disabled={disabled}
        className="absolute inset-y-0 right-0 flex items-center rounded-r-lg px-3 text-slate-400 hover:text-teal-600 disabled:opacity-60"
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        title={showPassword ? 'Hide password' : 'Show password'}
      >
        <EyeIcon hidden={showPassword} />
      </button>
    </div>
  );
}
