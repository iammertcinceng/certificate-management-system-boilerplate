"use client";

import { useEffect, useState } from 'react';

type CertificateApproval = {
  id: string;
  publicId: string;
  trainingName: string;
  institutionName: string;
  institutionApproved: boolean;
  partnerApproved: boolean;
  adminApproved: boolean;
  uiaRequired: boolean;
  status: string;
  createdAt: string;
};

export default function CertificateApprovalsPage() {
  const [approvals, setApprovals] = useState<CertificateApproval[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedApproval, setSelectedApproval] = useState<CertificateApproval | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/approvals/certificates', { cache: 'no-store' });
        const data = res.ok ? await res.json() : { approvals: [] };
        setApprovals((data.approvals || []).map((a: any) => ({
          id: a.id,
          publicId: a.publicId,
          trainingName: a.trainingName || 'Eğitim',
          institutionName: a.institutionName || 'Kurum',
          institutionApproved: a.institutionApproved,
          partnerApproved: a.partnerApproved,
          adminApproved: a.adminApproved,
          uiaRequired: a.uiaRequired,
          status: a.status,
          createdAt: a.createdAt,
        })));
      } catch {
        setApprovals([]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleApprove = async (id: string) => {
    if (!confirm('Bu sertifikayı onaylamak istediğinizden emin misiniz?')) return;
    try {
      const res = await fetch(`/api/admin/approvals/certificates/${id}/approve`, { method: 'POST' });
      if (res.ok) {
        alert('Sertifika onaylandı!');
        window.location.reload();
      } else {
        alert('Bir hata oluştu.');
      }
    } catch {
      alert('Bir hata oluştu.');
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Bu sertifikayı reddetmek istediğinizden emin misiniz?')) return;
    try {
      const res = await fetch(`/api/admin/approvals/certificates/${id}/reject`, { method: 'POST' });
      if (res.ok) {
        alert('Sertifika reddedildi.');
        window.location.reload();
      } else {
        alert('Bir hata oluştu.');
      }
    } catch {
      alert('Bir hata oluştu.');
    }
  };

  const handleView = (id: string) => {
    const approval = approvals.find(a => a.id === id);
    if (approval) {
      setSelectedApproval(approval);
      setShowModal(true);
    }
  };

  const filtered = approvals.filter(a => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return a.publicId.toLowerCase().includes(q) || a.trainingName.toLowerCase().includes(q) || a.institutionName.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sertifika Onayları</h1>
        <p className="text-gray-600 mt-2">Onay bekleyen sertifikaları görüntüleyin ve inceleyin.</p>
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
              <th className="px-6 py-3 whitespace-nowrap">Kurum Onayı</th>
              <th className="px-6 py-3 whitespace-nowrap">Partner Onayı</th>
              <th className="px-6 py-3 whitespace-nowrap">Admin Onayı</th>
              <th className="px-6 py-3 whitespace-nowrap">Üst Kurum</th>
              <th className="px-6 py-3">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-6 py-6 text-gray-500" colSpan={8}>Yükleniyor...</td></tr>
            ) : filtered.length ? filtered.map(a => (
              <tr key={a.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4 font-mono text-xs text-gray-500 whitespace-nowrap">{a.publicId}</td>
                <td className="px-6 py-4 font-medium text-gray-800">{a.trainingName}</td>
                <td className="px-6 py-4">{a.institutionName}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 text-xs rounded-full border ${a.institutionApproved ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-700'}`}>
                    {a.institutionApproved ? 'Evet' : 'Hayır'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 text-xs rounded-full border ${a.partnerApproved ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-700'}`}>
                    {a.partnerApproved ? 'Evet' : 'Hayır'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 text-xs rounded-full border ${a.adminApproved ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-700'}`}>
                    {a.adminApproved ? 'Evet' : 'Hayır'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 text-xs rounded-full border ${a.uiaRequired ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-700'}`}>
                    {a.uiaRequired ? 'Gerekli' : 'Yok'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {!a.adminApproved && a.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(a.id)}
                          className="p-2 hover:bg-green-50 rounded-lg transition-colors group"
                          title="Onayla"
                        >
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleReject(a.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                          title="Reddet"
                        >
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleView(a.id)}
                      className="p-2 hover:bg-blue-50 rounded-lg transition-colors group"
                      title="İncele"
                    >
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td className="px-6 py-6 text-gray-500" colSpan={8}>Kayıt bulunamadı.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {showModal && selectedApproval && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl max-w-3xl w-full my-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Sertifika Detayları</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Sertifika ID</label>
                  <p className="mt-1 text-base font-mono text-gray-800">{selectedApproval.publicId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Durum</label>
                  <p className="mt-1">
                    <span className={`inline-block px-3 py-1 text-sm rounded-full border ${selectedApproval.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        selectedApproval.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          'bg-red-50 text-red-700 border-red-200'
                      }`}>
                      {selectedApproval.status === 'approved' ? 'Onaylandı' :
                        selectedApproval.status === 'pending' ? 'Beklemede' : 'Reddedildi'}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Eğitim Adı</label>
                <p className="mt-1 text-base font-semibold text-gray-800">{selectedApproval.trainingName}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Kurum</label>
                <p className="mt-1 text-base text-gray-800">{selectedApproval.institutionName}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Kurum Onayı</label>
                  <p className="mt-1">
                    <span className={`px-2 py-1 text-xs rounded-full border ${selectedApproval.institutionApproved ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-700'
                      }`}>
                      {selectedApproval.institutionApproved ? 'Onaylandı' : 'Beklemede'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Partner Onayı</label>
                  <p className="mt-1">
                    <span className={`px-2 py-1 text-xs rounded-full border ${selectedApproval.partnerApproved ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-700'
                      }`}>
                      {selectedApproval.partnerApproved ? 'Onaylandı' : 'Beklemede'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Admin Onayı</label>
                  <p className="mt-1">
                    <span className={`px-2 py-1 text-xs rounded-full border ${selectedApproval.adminApproved ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-700'
                      }`}>
                      {selectedApproval.adminApproved ? 'Onaylandı' : 'Beklemede'}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">UIA Gerekli</label>
                <p className="mt-1">
                  <span className={`px-2 py-1 text-xs rounded-full border ${selectedApproval.uiaRequired ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-700'
                    }`}>
                    {selectedApproval.uiaRequired ? 'Evet' : 'Hayır'}
                  </span>
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Oluşturulma Tarihi</label>
                <p className="mt-1 text-base text-gray-800">
                  {new Date(selectedApproval.createdAt).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            {!selectedApproval.adminApproved && selectedApproval.status === 'pending' && (
              <div className="border-t px-6 py-4 bg-gray-50 flex items-center justify-end gap-3 rounded-b-xl">
                <button
                  onClick={() => {
                    setShowModal(false);
                    handleReject(selectedApproval.id);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Reddet
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    handleApprove(selectedApproval.id);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Onayla
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
