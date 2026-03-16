export default function Rank() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Rank</h1>
      <p className="mt-1 text-slate-600">Your current rank and progression.</p>
      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Current rank</p>
        <p className="mt-1 text-xl font-semibold text-teal-600">Beginner</p>
        <p className="mt-2 text-sm text-slate-600">Progress to next rank will be shown here.</p>
      </div>
    </div>
  );
}
