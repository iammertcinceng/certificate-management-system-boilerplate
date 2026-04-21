"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import Loader from '@/components/ui/Loader';

type CollabStatus = 'pending' | 'approved' | 'rejected';
type Item = {
  id: string; // collaboration id
  institutionId: string;
  institutionPublicId?: string;
  name: string;
  sector?: string;
  since?: string; // ISO
  status: CollabStatus;
};

export default function InstitutionsPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<Item[]>([]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'id' | 'date_desc' | 'name_az'>('id');
  const [loading, setLoading] = useState(false);
  const [detailModal, setDetailModal] = useState<{ open: boolean; item: Item | null }>({ open: false, item: null });

  const openDetails = (item: Item) => {
    setDetailModal({ open: true, item });
  };

  const closeDetails = () => {
    setDetailModal({ open: false, item: null });
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/collaborations?side=partner', { cache: 'no-store' });
        const data = await res.json();
        const mapped: Item[] = (data.collaborations || []).map((row: any) => ({
          id: row.collaboration.id,
          institutionId: row.collaboration.institutionUserId,
          institutionPublicId: row.partnerOrg?.publicId,
          name: row.partnerOrg?.name || row.partnerUser?.email || t('acreditor.institutions.table.name'),
          sector: '',
          since: row.collaboration.sinceDate,
          status: row.collaboration.status,
        }));
        setItems(mapped);
      } catch { }
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    let data = [...items];
    if (query.trim()) {
      const q = query.toLowerCase();
      data = data.filter(i => i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q));
    }
    switch (sort) {
      case 'date_desc':
        data.sort((a, b) => new Date(b.since || '1970-01-01').getTime() - new Date(a.since || '1970-01-01').getTime());
        break;
      case 'name_az':
        data.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'id':
      default:
        data.sort((a, b) => a.id.localeCompare(b.id));
    }
    return data;
  }, [items, query, sort]);

  const confirmAnd = async (fn: () => Promise<void>, message: string) => {
    if (!window.confirm(message)) return;
    await fn();
  };

  const approve = async (id: string) => {
    await fetch('/api/collaborations', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action: 'approve' }) });
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'approved' } : i));
  };
  const reject = async (id: string) => {
    await fetch('/api/collaborations', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action: 'reject' }) });
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'rejected' } : i));
  };
  const endCollab = async (id: string) => {
    await fetch(`/api/collaborations?id=${id}`, { method: 'DELETE' });
    setItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">{t('acreditor.institutions.title')}</h1>
          <p className="text-gray-600 mt-2">{t('acreditor.institutions.subtitle')}</p>
        </div>
        <Link href="/acreditor" className="btn-secondary">{t('nav.dashboard')}</Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 gap-3">
          <div className="relative w-60 md:w-72">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              type="text"
              placeholder={t('acreditor.institutions.searchPlaceholder')}
              className="input w-full pr-10 p-3 rounded-lg"
            />
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 104.473 8.746l2.64 2.64a.75.75 0 101.06-1.06l-2.64-2.64A5.5 5.5 0 009 3.5zm-4 5.5a4 4 0 118 0 4 4 0 01-8 0z" clipRule="evenodd" /></svg>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{t('acreditor.institutions.sort.label')}</span>
          <div className="relative w-56">
            <select
              value={sort}
              onChange={e => setSort(e.target.value as 'id' | 'date_desc' | 'name_az')}
              className="appearance-none input w-full p-3 rounded-lg pr-10 shadow-sm focus:border-[#0945A5] focus:ring-2 focus:ring-[#0945A5]/30"
            >
              <option value="id">{t('acreditor.institutions.sort.id')}</option>
              <option value="date_desc">{t('acreditor.institutions.sort.dateDesc')}</option>
              <option value="name_az">{t('acreditor.institutions.sort.nameAz')}</option>
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3 whitespace-nowrap">ID</th>
              <th className="px-6 py-3 whitespace-nowrap">{t('acreditor.institutions.table.name')}</th>
              <th className="px-6 py-3 whitespace-nowrap">{t('acreditor.institutions.table.since')}</th>
              <th className="px-6 py-3 whitespace-nowrap">{t('acreditor.institutions.table.status')}</th>
              <th className="px-6 py-3"><span className="sr-only">{t('acreditor.institutions.table.actions')}</span></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-6 py-6 text-gray-500" colSpan={4}><Loader /></td></tr>
            ) : filtered.length ? filtered.map(item => (
              <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-gray-600 whitespace-nowrap">{item.institutionPublicId || '-'}</td>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-800">{item.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{item.since ? new Date(item.since).toLocaleDateString() : '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-0.5 text-xs rounded-full border bg-gray-50 text-gray-700">
                    {item.status === 'pending' ? t('acreditor.institutions.status.pending') : item.status === 'approved' ? t('acreditor.institutions.status.approved') : t('acreditor.institutions.status.rejected')}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  {item.status === 'pending' && (
                    <>
                      <button className="btn-primary btn-sm" onClick={() => confirmAnd(() => approve(item.id), t('acreditor.institutions.confirm.approve'))}>{t('acreditor.institutions.actions.approve')}</button>
                      <button className="btn-secondary btn-sm" onClick={() => confirmAnd(() => reject(item.id), t('acreditor.institutions.confirm.reject'))}>{t('acreditor.institutions.actions.reject')}</button>
                    </>
                  )}
                  {item.status === 'approved' && (
                    <>
                      <button className="btn-secondary btn-sm" onClick={() => openDetails(item)}>{t('acreditor.institutions.actions.viewDetails')}</button>
                      <button className="btn-secondary btn-sm" onClick={() => confirmAnd(() => endCollab(item.id), t('acreditor.institutions.confirm.end'))}>{t('acreditor.institutions.actions.end')}</button>
                    </>
                  )}
                  {item.status === 'rejected' && (
                    <button className="btn-secondary btn-sm" onClick={() => confirmAnd(() => endCollab(item.id), t('acreditor.institutions.confirm.delete'))}>{t('acreditor.institutions.actions.delete')}</button>
                  )}
                </td>
              </tr>
            )) : (
              <tr><td className="px-6 py-6 text-gray-500" colSpan={4}>{t('acreditor.institutions.noRecords')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      {detailModal.open && detailModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <h2 className="text-xl font-bold text-gray-900">{t('acreditor.institutions.modal.title')}</h2>
              <button
                onClick={closeDetails}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-white/50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">{t('acreditor.institutions.modal.institutionId')}</p>
                  <p className="font-mono text-sm font-semibold">{detailModal.item.institutionPublicId || '-'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">{t('acreditor.institutions.table.name')}</p>
                  <p className="text-sm font-semibold">{detailModal.item.name}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">{t('acreditor.institutions.table.since')}</p>
                  <p className="text-sm font-semibold">
                    {detailModal.item.since ? new Date(detailModal.item.since).toLocaleDateString('tr-TR') : '-'}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">{t('acreditor.institutions.table.status')}</p>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {t('acreditor.institutions.status.approved')}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              <button onClick={closeDetails} className="btn-secondary">
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
