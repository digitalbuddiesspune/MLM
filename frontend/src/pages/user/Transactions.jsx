export default function Transactions() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
      <p className="mt-1 text-slate-600">Ledger and transaction history.</p>
      <div className="mt-8 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Type</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-slate-500 text-sm">No transactions yet.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
