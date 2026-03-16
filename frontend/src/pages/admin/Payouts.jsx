export default function AdminPayouts() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Payouts</h1>
      <p className="mt-1 text-slate-600">Manage payout runs and reports.</p>
      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-center text-slate-500">Payout history and management will appear here.</p>
        <p className="mt-2 text-center text-sm text-slate-400">Monthly payout runs (days 1–5) are processed automatically.</p>
      </div>
    </div>
  );
}
