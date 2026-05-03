/**
 * Prev / Next + range text for paginated tables (admin level lists).
 * @param {{ page: number, totalPages: number, total: number, pageSize: number, onPageChange: (p: number) => void, disabled?: boolean }} props
 */
export default function ListPagination({ page, totalPages, total, pageSize, onPageChange, disabled = false }) {
  if (total < 1) return null;

  const safePage = Math.min(Math.max(1, page), totalPages);
  const from = (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
      <p>
        Showing <span className="font-medium text-slate-900">{from}</span>–
        <span className="font-medium text-slate-900">{to}</span> of{' '}
        <span className="font-medium text-slate-900">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled || safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
        >
          Previous
        </button>
        <span className="min-w-[5.5rem] text-center text-xs text-slate-500">
          Page {safePage} / {totalPages}
        </span>
        <button
          type="button"
          disabled={disabled || safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
