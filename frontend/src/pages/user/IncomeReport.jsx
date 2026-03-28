import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMyTransactions } from '../../api/user.js';

export default function IncomeReport() {
  const { data, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['user-income-report'],
    queryFn: getMyTransactions,
  });

  const error = queryError ? (queryError.response?.data?.error ?? 'Failed to load income report') : '';
  const transactions = data?.data?.transactions ?? [];

  const report = useMemo(() => {
    const direct = transactions.filter((entry) => entry.type === 'joining_bonus' && Number(entry.amount) > 0);
    const generation = transactions.filter((entry) => entry.type === 'generation' && Number(entry.amount) > 0);
    const binary = transactions.filter((entry) => entry.type === 'binary' && Number(entry.amount) > 0);

    const sum = (rows) => rows.reduce((acc, row) => acc + Number(row.amount ?? 0), 0);

    return {
      direct,
      generation,
      binary,
      totals: {
        direct: sum(direct),
        generation: sum(generation),
        binary: sum(binary),
      },
    };
  }, [transactions]);

  const allRows = useMemo(() => {
    const rows = [
      ...report.direct.map((entry) => ({ ...entry, source: 'Direct Sharing' })),
      ...report.generation.map((entry) => ({ ...entry, source: 'Generational Sharing' })),
      ...report.binary.map((entry) => ({ ...entry, source: 'Binary Sharing' })),
    ];
    return rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [report]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Income Report</h1>
      <p className="mt-1 text-slate-600">Summary of your earnings and income history.</p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Direct Sharing</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">₹{report.totals.direct.toLocaleString()}</p>
          <p className="mt-1 text-xs text-slate-500">{report.direct.length} entries</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Generational Sharing</p>
          <p className="mt-1 text-2xl font-bold text-indigo-700">₹{report.totals.generation.toLocaleString()}</p>
          <p className="mt-1 text-xs text-slate-500">{report.generation.length} entries</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Binary Sharing</p>
          <p className="mt-1 text-2xl font-bold text-teal-700">₹{report.totals.binary.toLocaleString()}</p>
          <p className="mt-1 text-xs text-slate-500">{report.binary.length} entries</p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Source</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500">Loading income report...</td>
              </tr>
            ) : allRows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500">No income entries found.</td>
              </tr>
            ) : (
              allRows.map((row) => (
                <tr key={row._id}>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{row.source}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-700">
                    +₹{Number(row.amount ?? 0).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
