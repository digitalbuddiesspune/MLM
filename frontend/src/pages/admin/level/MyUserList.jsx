import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import ListPagination from '../../../components/ListPagination.jsx';
import { getAdminUsers } from '../../../api/admin.js';

const PAGE_SIZE = 15;

export default function AdminMyUserList() {
  const navigate = useNavigate();
  const [nameDraft, setNameDraft] = useState('');
  const [mobileDraft, setMobileDraft] = useState('');
  /** Applied filters; query refetches when this changes (Search button). */
  const [appliedSearch, setAppliedSearch] = useState({ searchName: '', searchMobile: '' });
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [appliedSearch.searchName, appliedSearch.searchMobile]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-level', 'my-user-list', appliedSearch.searchName, appliedSearch.searchMobile, page],
    queryFn: () =>
      getAdminUsers({
        page,
        limit: PAGE_SIZE,
        ...(appliedSearch.searchName ? { searchName: appliedSearch.searchName } : {}),
        ...(appliedSearch.searchMobile ? { searchMobile: appliedSearch.searchMobile } : {}),
      }),
  });
  const rows = data?.data?.users ?? [];
  const pagination = data?.data?.pagination;

  useEffect(() => {
    const totalPages = pagination?.totalPages ?? 1;
    if (pagination && page > totalPages) {
      setPage(Math.max(1, totalPages));
    }
  }, [pagination?.totalPages, page, pagination]);

  const message = error ? (error.response?.data?.error ?? 'Failed to load users') : '';

  const runSearch = () => {
    setAppliedSearch({
      searchName: nameDraft.trim(),
      searchMobile: mobileDraft.trim(),
    });
  };

  const clearFilters = () => {
    setNameDraft('');
    setMobileDraft('');
    setAppliedSearch({ searchName: '', searchMobile: '' });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">My User List</h1>
      <p className="mt-1 text-slate-600">
        Click a user to open their referral downline as on My Hierarchy (level-wise list).
      </p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Find users</p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="min-w-[12rem] flex-1">
            <label htmlFor="user-list-search-name" className="block text-xs font-medium text-slate-700">
              Name
            </label>
            <input
              id="user-list-search-name"
              type="text"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') runSearch();
              }}
              placeholder="Partial name"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="min-w-[12rem] flex-1">
            <label htmlFor="user-list-search-mobile" className="block text-xs font-medium text-slate-700">
              Mobile
            </label>
            <input
              id="user-list-search-mobile"
              type="text"
              inputMode="numeric"
              value={mobileDraft}
              onChange={(e) => setMobileDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') runSearch();
              }}
              placeholder="Partial mobile"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={runSearch}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              Search
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Clear
            </button>
          </div>
        </div>
        {(appliedSearch.searchName || appliedSearch.searchMobile) && (
          <p className="mt-2 text-xs text-slate-500">
            Filtering by{' '}
            {[
              appliedSearch.searchName && `name matching “${appliedSearch.searchName}”`,
              appliedSearch.searchMobile && `mobile matching “${appliedSearch.searchMobile}”`,
            ]
              .filter(Boolean)
              .join(' and ')}
            {' '}(15 per page).
          </p>
        )}
      </div>

      {isLoading && <p className="mt-6 text-sm text-slate-500">Loading...</p>}
      {message && <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>}
      {!isLoading && !message && (
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full table-fixed divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="w-[18%] px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Name</th>
                  <th className="w-[26%] px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Email</th>
                  <th className="w-[14%] px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Mobile</th>
                  <th className="w-[14%] px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Role</th>
                  <th className="w-[12%] px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">No users found.</td></tr>
                ) : rows.map((u) => (
                  <tr
                    key={u._id}
                    role="button"
                    tabIndex={0}
                    title="View this user’s referral hierarchy"
                    className="cursor-pointer hover:bg-indigo-50/60 focus-visible:bg-indigo-50/60 focus-visible:outline-none"
                    onClick={() => navigate(`/admin/level/my-hierarchy/${u._id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/admin/level/my-hierarchy/${u._id}`);
                      }
                    }}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-slate-900"><span className="block truncate">{u.name ?? '—'}</span></td>
                    <td className="px-4 py-3 text-sm text-slate-600"><span className="block truncate">{u.email ?? '—'}</span></td>
                    <td className="px-4 py-3 text-sm text-slate-600"><span className="block truncate">{u.mobile ?? '—'}</span></td>
                    <td className="px-4 py-3 text-sm text-slate-600"><span className="block truncate">{u.role ?? 'user'}</span></td>
                    <td className="px-4 py-3 text-sm text-slate-600"><span className="block truncate">{u.level ?? 0}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && (
            <ListPagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              disabled={isLoading}
            />
          )}
        </div>
      )}
    </div>
  );
}
