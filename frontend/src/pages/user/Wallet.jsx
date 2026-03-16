export default function Wallet() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Wallet</h1>
      <p className="mt-1 text-slate-600">Your balance and payout options.</p>
      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Available balance</p>
        <p className="mt-1 text-3xl font-bold text-teal-600">₹0</p>
        <div className="mt-6 flex gap-3">
          <button type="button" className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">
            Request withdrawal
          </button>
        </div>
      </div>
    </div>
  );
}
