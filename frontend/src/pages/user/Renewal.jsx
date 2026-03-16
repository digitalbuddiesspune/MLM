export default function Renewal() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Renewal</h1>
      <p className="mt-1 text-slate-600">Activation and renewal status.</p>
      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <dl className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-slate-500">Activation date</dt>
            <dd className="mt-0.5 text-slate-900">—</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Renewal date</dt>
            <dd className="mt-0.5 text-slate-900">—</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Status</dt>
            <dd className="mt-0.5 text-slate-900">—</dd>
          </div>
        </dl>
        <button type="button" className="mt-6 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">
          Renew now
        </button>
      </div>
    </div>
  );
}
