"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Certificate = {
  id: string;
  publicId: string;
  trainingName: string;
  institutionName: string;
  templateKey: string;
  status: string;
  dateIssued: string;
  createdAt: string;
};

// Status translation helper (trainings page ile aynı)
const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': 'Onay Bekliyor',
    'approved': 'Onaylandı',
    'rejected': 'Reddedildi',
    'archived': 'Arşivlendi',
  };
  return statusMap[status] || status;
};

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'archived'>('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/certificates', { cache: 'no-store' });
        const data = res.ok ? await res.json() : { certificates: [] };
        setCertificates((data.certificates || []).map((c: any) => ({
          id: c.id,
          publicId: c.publicId,
          trainingName: c.trainingName || 'Eğitim',
          institutionName: c.institutionName || 'Kurum',
          templateKey: c.templateKey,
          status: c.status,
          dateIssued: c.dateIssued,
          createdAt: c.createdAt,
        })));
      } catch {
        setCertificates([]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const filtered = certificates.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return c.publicId.toLowerCase().includes(q) || c.trainingName.toLowerCase().includes(q) || c.institutionName.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sertifikalar</h1>
        <p className="text-gray-600 mt-2">Tüm sertifikaları görüntüleyin.</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            type="text"
            placeholder="Sertifika, eğitim veya kurum ara..."
            className="input w-full pr-10 p-3 rounded-lg"
          />
          <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 104.473 8.746l2.64 2.64a.75.75 0 101.06-1.06l-2.64-2.64A5.5 5.5 0 009 3.5zm-4 5.5a4 4 0 118 0 4 4 0 01-8 0z" clipRule="evenodd" /></svg>
          </span>
        </div>
        <div className="relative w-48">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="appearance-none input w-full p-3 rounded-lg pr-10"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="pending">Beklemede</option>
            <option value="approved">Onaylandı</option>
            <option value="rejected">Reddedildi</option>
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3 whitespace-nowrap">ID</th>
              <th className="px-6 py-3">Eğitim</th>
              <th className="px-6 py-3">Kurum</th>
              <th className="px-6 py-3">Şablon</th>
              <th>
                <Link href="/admin/approvals/certificates" className="px-6 py-3 hover: cursor-pointer hover:text-black">Durum</Link>
              </th>
              <th className="px-6 py-3 whitespace-nowrap">Düzenlenme Tarihi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-6 py-6 text-gray-500" colSpan={6}>Yükleniyor...</td></tr>
            ) : filtered.length ? filtered.map(c => (
              <tr key={c.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4 font-mono text-xs text-gray-500 whitespace-nowrap">{c.publicId}</td>
                <td className="px-6 py-4 font-medium text-gray-800">{c.trainingName}</td>
                <td className="px-6 py-4">{c.institutionName}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 text-xs rounded-full border bg-blue-50 text-blue-700">{c.templateKey}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 text-xs rounded-full border ${c.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    c.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      c.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}>{getStatusText(c.status)}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(c.dateIssued).toLocaleDateString()}</td>
              </tr>
            )) : (
              <tr><td className="px-6 py-6 text-gray-500" colSpan={6}>Kayıt bulunamadı.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
