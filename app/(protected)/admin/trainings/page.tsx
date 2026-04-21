"use client";

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

type Training = {
  id: string;
  publicId: string;
  name: string;
  description: string | null;
  level: string;
  language: string;
  languages: string[] | null;
  status: string;
  totalHours: number;
  mode: string | null;
  country: string | null;
  startDate: string | null;
  endDate: string | null;
  institutionUserId: string;
  institutionName: string | null;
  createdAt: string;
};

// Status translation helper
const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': 'Onay Bekliyor',
    'approved': 'Onaylandı',
    'rejected': 'Reddedildi',
  };
  return statusMap[status] || status;
};

// Level formatting helper
const formatLevel = (level: string): string => {
  // level_c -> Level 3, level_a -> Level 1
  const match = level.match(/level(\d+)/i);
  if (match) {
    return `Level ${match[1]}`;
  }
  else if (level === 'level_d') {
    return 'CCE';
  }
  return level;
};

// Language formatting helper
const formatLanguage = (lang: string): string => {
  const langMap: Record<string, string> = {
    'tr': 'Türkçe',
    'en': 'İngilizce',
    'de': 'Almanca',
    'fr': 'Fransızca',
  };
  return langMap[lang] || lang.toUpperCase();
};

// Mode formatting helper
const formatMode = (mode: string | null): string => {
  if (!mode) return '-';
  const modeMap: Record<string, string> = {
    'hybrid': 'Hibrit',
    'online': 'Online',
    'onsite': 'Yüz Yüze',
  };
  return modeMap[mode] || mode;
};

// Country formatting helper
const formatCountry = (country: string | null): string => {
  if (!country) return '-';
  const countryMap: Record<string, string> = {
    'tr': 'Türkiye',
    'us': 'ABD',
    'de': 'Almanya',
    'gb': 'İngiltere',
    'fr': 'Fransa',
  };
  return countryMap[country] || country.toUpperCase();
};

export default function TrainingsPage() {
  const { t } = useLanguage();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/trainings', { cache: 'no-store' });
        const data = res.ok ? await res.json() : { trainings: [] };
        setTrainings((data.trainings || []).map((t: any) => ({
          id: t.id,
          publicId: t.publicId,
          name: t.name,
          description: t.description,
          level: t.level,
          language: t.language,
          languages: t.languages,
          status: t.status,
          totalHours: t.totalHours,
          mode: t.mode,
          country: t.country,
          startDate: t.startDate,
          endDate: t.endDate,
          institutionUserId: t.institutionUserId,
          institutionName: t.institutionName || 'Bilinmeyen',
          createdAt: t.createdAt,
        })));
      } catch {
        setTrainings([]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleApprove = async (id: string) => {
    if (!confirm('Bu eğitimi onaylamak istediğinizden emin misiniz?')) return;
    try {
      const res = await fetch(`/api/admin/trainings/${id}/approve`, { method: 'POST' });
      if (res.ok) {
        alert('Eğitim onaylandı!');
        window.location.reload();
      } else {
        alert('Bir hata oluştu.');
      }
    } catch {
      alert('Bir hata oluştu.');
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Bu eğitimi reddetmek istediğinizden emin misiniz?')) return;
    try {
      const res = await fetch(`/api/admin/trainings/${id}/reject`, { method: 'POST' });
      if (res.ok) {
        alert('Eğitim reddedildi.');
        window.location.reload();
      } else {
        alert('Bir hata oluştu.');
      }
    } catch {
      alert('Bir hata oluştu.');
    }
  };

  const handleView = (id: string) => {
    const training = trainings.find(t => t.id === id);
    if (training) {
      setSelectedTraining(training);
      setShowModal(true);
    }
  };

  const filtered = trainings.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return t.publicId.toLowerCase().includes(q) || t.name.toLowerCase().includes(q) || (t.institutionName?.toLowerCase().includes(q) ?? false);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Eğitim Onayları</h1>
        <p className="text-gray-600 mt-2">Kurumlardan gelen eğitim taleplerini inceleyin ve onaylayın.</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            type="text"
            placeholder="Eğitim veya kurum ara..."
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
              <th className="px-6 py-3">Eğitim Adı</th>
              <th className="px-6 py-3">Kurum</th>
              <th className="px-6 py-3">Seviye</th>
              <th className="px-6 py-3">Dil</th>
              <th className="px-6 py-3">Toplam Saat</th>
              <th className="px-6 py-3">Durum</th>
              <th className="px-6 py-3">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-6 py-6 text-gray-500" colSpan={8}>Yükleniyor...</td></tr>
            ) : filtered.length > 0 ? (
              filtered.map(t => (
                <tr key={t.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-xs text-gray-500 whitespace-nowrap">{t.publicId}</td>
                  <td className="px-6 py-4 font-medium text-gray-800">{t.name}</td>
                  <td className="px-6 py-4 text-gray-700">{t.institutionName}</td>
                  <td className="px-6 py-4">{formatLevel(t.level)}</td>
                  <td className="px-6 py-4">{formatLanguage(t.language)}</td>
                  <td className="px-6 py-4">{t.totalHours}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 text-xs rounded-full border ${t.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      t.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200'
                      }`}>{getStatusText(t.status)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {t.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(t.id)}
                            className="p-2 hover:bg-green-50 rounded-lg transition-colors group"
                            title="Onayla"
                          >
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleReject(t.id)}
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
                        onClick={() => handleView(t.id)}
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
              ))
            ) : (
              <tr>
                <td className="px-6 py-12 text-center text-gray-500" colSpan={8}>
                  <div className="flex flex-col items-center gap-3">
                    <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <p className="text-base font-medium text-gray-700">Eğitim bulunamadı</p>
                      <p className="text-sm text-gray-500 mt-1">Henüz onay bekleyen eğitim bulunmuyor.</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Training Detail Modal */}
      {showModal && selectedTraining && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl max-w-3xl w-full my-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Eğitim Detayları</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Kapat"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Eğitim ID</label>
                  <p className="mt-1 text-base font-mono text-gray-800">{selectedTraining.publicId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Durum</label>
                  <p className="mt-1">
                    <span className={`inline-block px-3 py-1 text-sm rounded-full border ${selectedTraining.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      selectedTraining.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                      {getStatusText(selectedTraining.status)}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Eğitim Adı</label>
                <p className="mt-1 text-base font-semibold text-gray-800">{selectedTraining.name}</p>
              </div>

              {selectedTraining.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Açıklama</label>
                  <p className="mt-1 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedTraining.description}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-500">Kurum</label>
                <p className="mt-1 text-base text-gray-800">{selectedTraining.institutionName}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Seviye</label>
                  <p className="mt-1 text-base text-gray-800">{formatLevel(selectedTraining.level)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Dil</label>
                  <p className="mt-1 text-base text-gray-800">{formatLanguage(selectedTraining.language)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Toplam Saat</label>
                  <p className="mt-1 text-base text-gray-800">{selectedTraining.totalHours} Saat</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Eğitim Modu</label>
                  <p className="mt-1 text-base text-gray-800">{formatMode(selectedTraining.mode)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Ülke</label>
                  <p className="mt-1 text-base text-gray-800">{formatCountry(selectedTraining.country)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Başlangıç Tarihi</label>
                  <p className="mt-1 text-base text-gray-800">
                    {selectedTraining.startDate ? new Date(selectedTraining.startDate).toLocaleDateString('tr-TR') : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Bitiş Tarihi</label>
                  <p className="mt-1 text-base text-gray-800">
                    {selectedTraining.endDate ? new Date(selectedTraining.endDate).toLocaleDateString('tr-TR') : '-'}
                  </p>
                </div>
              </div>

              {selectedTraining.languages && selectedTraining.languages.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Ek Diller</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {selectedTraining.languages.map((lang, idx) => (
                      <span key={idx} className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                        {formatLanguage(lang)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-500">Oluşturulma Tarihi</label>
                <p className="mt-1 text-base text-gray-800">
                  {new Date(selectedTraining.createdAt).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            {selectedTraining.status === 'pending' && (
              <div className="border-t px-6 py-4 bg-gray-50 flex items-center justify-end gap-3 rounded-b-xl">
                <button
                  onClick={() => {
                    setShowModal(false);
                    handleReject(selectedTraining.id);
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
                    handleApprove(selectedTraining.id);
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
