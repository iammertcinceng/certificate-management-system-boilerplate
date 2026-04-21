"use client";

import { useMemo, useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Loading from '@/components/Loading';
import Loader from '@/components/ui/Loader';






type Training = {
  id: string;
  publicId: string;
  name: string;
  description: string | null;
  level: 'level_a' | 'level_b' | 'level_c' | 'level_d';
  language: 'tr' | 'en' | 'de' | 'fr';
  totalHours: number;
  duration: string | null;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  languages?: string[] | null;
  mode?: 'hybrid' | 'online' | 'onsite' | null;
  country?: 'tr' | 'us' | 'de' | 'gb' | 'fr' | null;
};

const StatusPill = ({ status, t }: { status: 'pending' | 'approved' | 'rejected', t: any }) => {
  const map = {
    pending: { text: t('institution.trainings.status.pending'), cls: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20' },
    approved: { text: t('institution.trainings.status.approved'), cls: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' },
    rejected: { text: t('institution.trainings.status.rejected'), cls: 'bg-red-500/10 text-red-700 border-red-500/20' },
  };
  const item = map[status];
  return <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full border whitespace-nowrap ${item.cls}`}>{item.text}</span>;
};

export default function TrainingsPage() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    try {
      const res = await fetch('/api/trainings');
      if (res.ok) {
        const data = await res.json();
        setTrainings(data.trainings || []);
      } else {
        console.error('Failed to fetch trainings');
      }
    } catch (err) {
      console.error('Error fetching trainings:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let data = [...trainings];
    if (query.trim()) {
      const q = query.toLowerCase();
      data = data.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.publicId.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      data = data.filter(t => t.status === statusFilter);
    }
    return data;
  }, [trainings, query, statusFilter]);

  const addTraining = async (payload: { name: string; description?: string; level: Training['level']; language: Training['language']; totalHours: number; languages?: string[]; mode?: 'hybrid' | 'online' | 'onsite' | null; country?: 'tr' | 'us' | 'de' | 'gb' | 'fr' | null }) => {
    try {
      const res = await fetch('/api/trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchTrainings();
        setAddOpen(false);
      } else {
        const error = await res.json();
        alert(`${t('common.error')}: ${error.error || t('institution.trainings.errors.cannotAdd')}`);
      }
    } catch (err) {
      console.error('Error adding training:', err);
      alert(t('institution.trainings.errors.addError'));
    }
  };

  const deleteTraining = async (trainingId: string) => {
    if (!confirm(t('institution.trainings.confirmDelete'))) return;

    try {
      const res = await fetch(`/api/trainings?id=${trainingId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchTrainings();
      } else {
        alert(t('institution.trainings.errors.cannotDelete'));
      }
    } catch (err) {
      console.error('Error deleting training:', err);
      alert(t('institution.trainings.errors.deleteError'));
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">{t('institution.trainings.title')}</h1>
          <p className="text-gray-600 mt-2">{t('institution.trainings.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-primary" onClick={() => setAddOpen(true)}>{t('institution.trainings.addNew')}</button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-3 items-center flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('institution.trainings.searchPlaceholder')}
            className="input w-full md:w-96"
          />
          <div className="relative w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="appearance-none input p-1 w-full border-gray-300 rounded-lg pr-10 shadow-sm focus:border-[#0945A5] focus:ring-2 focus:ring-[#0945A5]/30"
            >
              <option value="all">{t('institution.trainings.filter.all')}</option>
              <option value="pending">{t('institution.trainings.filter.pending')}</option>
              <option value="approved">{t('institution.trainings.filter.approved')}</option>
              <option value="rejected">{t('institution.trainings.filter.rejected')}</option>
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-700 min-w-[1050px]">
          <thead className="text-[10px] text-gray-500 uppercase bg-gray-50">
            <tr>
              <th className="px-3 py-3 w-20 whitespace-nowrap">ID</th>
              <th className="px-3 py-3 w-44 whitespace-nowrap">EĞİTİM ADI</th>
              <th className="px-3 py-3 w-64">AÇIKLAMA</th>
              <th className="px-2 py-3 w-12 text-center whitespace-nowrap">SEV.</th>
              <th className="px-2 py-3 w-20 whitespace-nowrap">DİLLER</th>
              <th className="px-2 py-3 w-14 whitespace-nowrap">ŞEKİL</th>
              <th className="px-2 py-3 w-12 whitespace-nowrap">ÜLKE</th>
              <th className="px-2 py-3 w-12 text-center whitespace-nowrap">SAAT</th>
              <th className="px-2 py-3 w-20 whitespace-nowrap">DURUM</th>
              <th className="px-2 py-3 w-20 whitespace-nowrap">OLUŞTURMA</th>
              <th className="px-2 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(training => (
              <tr key={training.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors align-top">
                <td className="px-3 py-3 font-mono text-[11px] text-gray-500">{training.publicId}</td>
                <td className="px-3 py-3 font-medium text-gray-800 text-[13px]">{training.name}</td>
                <td className="px-3 py-3 text-[12px] text-gray-600">
                  <p className="line-clamp-2 leading-snug" title={training.description || ''}>
                    {training.description || '-'}
                  </p>
                </td>
                <td className="px-2 py-3 text-[11px] text-gray-600 text-center">{training.level === 'level_d' ? 'CCE' : `L${training.level.replace('level', '')}`}</td>
                <td className="px-2 py-3 text-[11px] text-gray-600">{training.languages && training.languages.length ? training.languages.map(l => l.toUpperCase()).join(', ') : '-'}</td>
                <td className="px-2 py-3 text-[11px] text-gray-600">{training.mode ? t(`common.trainings.modes.${training.mode}`).slice(0, 6) : '-'}</td>
                <td className="px-2 py-3 text-[11px] text-gray-600">{training.country ? training.country.toUpperCase() : '-'}</td>
                <td className="px-2 py-3 text-[12px] text-gray-700 text-center font-medium">{training.totalHours}</td>
                <td className="px-2 py-3"><StatusPill status={training.status} t={t} /></td>
                <td className="px-2 py-3 text-[11px] text-gray-500 whitespace-nowrap">{new Date(training.createdAt).toLocaleDateString('tr-TR')}</td>
                <td className="px-2 py-3">
                  <button
                    type="button"
                    onClick={() => deleteTraining(training.id)}
                    title={t('common.delete')}
                    className="inline-flex items-center justify-center w-7 h-7 rounded border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                      <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Yeni Eğitim Ekle Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">{t('institution.trainings.addNew')}</h3>
              <button onClick={() => setAddOpen(false)} className="text-gray-500">✕</button>
            </div>
            <AddTrainingForm onCancel={() => setAddOpen(false)} onSubmit={addTraining} />
          </div>
        </div>
      )}
    </div>
  );
}

function AddTrainingForm({ onSubmit, onCancel }: {
  onSubmit: (v: { name: string; description?: string; level: 'level_a' | 'level_b' | 'level_c' | 'level_d'; language: 'tr' | 'en' | 'de' | 'fr'; totalHours: number; languages?: string[]; mode?: 'hybrid' | 'online' | 'onsite' | null; country?: 'tr' | 'us' | 'de' | 'gb' | 'fr' | null }) => void;
  onCancel: () => void
}) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState<'level_a' | 'level_b' | 'level_c' | 'level_d'>('level_a');
  const [totalHours, setTotalHours] = useState<string>('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [mode, setMode] = useState<'hybrid' | 'online' | 'onsite' | ''>('');
  const [country, setCountry] = useState<'tr' | 'us' | 'de' | 'gb' | 'fr' | ''>('');

  const valid = useMemo(() => {
    return name.trim().length > 2 && totalHours && Number(totalHours) > 0 && languages.length > 0;
  }, [name, totalHours, languages]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onSubmit({
          name: name.trim(),
          description: description.trim() || undefined,
          level,
          language: (languages[0] as any),
          totalHours: Number(totalHours),
          languages: languages.length ? languages : undefined,
          mode: mode || null,
          country: country || null,
        });
      }}
      className="grid grid-cols-1 gap-4"
    >
      <div>
        <label className="block text-sm text-gray-600 mb-1">{t('institution.trainings.form.name')} *</label>
        <input className="input w-full py-3" value={name} onChange={e => setName(e.target.value)} placeholder={t('institution.trainings.form.namePlaceholder')} />
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">{t('institution.trainings.form.description')}</label>
        <textarea className="input w-full py-3" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder={t('institution.trainings.form.descriptionPlaceholder')} />
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">{t('institution.trainings.form.level')}</label>
        <select className="appearance-none input p-1 w-full border-gray-300 rounded-lg pr-10 shadow-sm focus:border-[#0945A5] focus:ring-2 focus:ring-[#0945A5]/30" value={level} onChange={e => setLevel(e.target.value as any)}>
          <option value="level_a">{t('institution.trainings.form.level_a')}</option>
          <option value="level_b">{t('institution.trainings.form.level_b')}</option>
          <option value="level_c">{t('institution.trainings.form.level_c')}</option>
          <option value="level_d">CCE</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">{t('common.trainings.languages')}</label>
        <div className="grid grid-cols-2 gap-2">
          {(['tr', 'en', 'de', 'fr'] as const).map(code => (
            <label key={code} className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={languages.includes(code)}
                onChange={(e) => {
                  setLanguages(prev => e.target.checked ? Array.from(new Set([...prev, code])) : prev.filter(x => x !== code));
                }}
              />
              <span>{t(`common.languageNames.${code}`)}</span>
            </label>
          ))}
        </div>
        {languages.length === 0 && (
          <div className="mt-1 text-xs text-red-600">{t('common.trainings.languagesRequired')}</div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-600 mb-1">{t('common.trainings.mode')}</label>
          <select className="appearance-none input p-1 w-full border-gray-300 rounded-lg pr-10 shadow-sm focus:border-[#0945A5] focus:ring-2 focus:ring-[#0945A5]/30" value={mode} onChange={e => setMode(e.target.value as any)}>
            <option value="">-</option>
            <option value="hybrid">{t('common.trainings.modes.hybrid')}</option>
            <option value="online">{t('common.trainings.modes.online')}</option>
            <option value="onsite">{t('common.trainings.modes.onsite')}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">{t('common.trainings.country')}</label>
          <select className="appearance-none input p-1 w-full border-gray-300 rounded-lg pr-10 shadow-sm focus:border-[#0945A5] focus:ring-2 focus:ring-[#0945A5]/30" value={country} onChange={e => setCountry(e.target.value as any)}>
            <option value="">-</option>
            <option value="tr">{t('common.countryNames.tr')}</option>
            <option value="us">{t('common.countryNames.us')}</option>
            <option value="de">{t('common.countryNames.de')}</option>
            <option value="gb">{t('common.countryNames.gb')}</option>
            <option value="fr">{t('common.countryNames.fr')}</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">{t('institution.trainings.form.totalHours')} *</label>
        <input type="number" min="1" className="input w-full py-3" value={totalHours} onChange={e => setTotalHours(e.target.value)} placeholder={t('institution.trainings.form.totalHoursPlaceholder')} />
      </div>

      <div className="mt-2 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="btn-secondary">{t('common.cancel')}</button>
        <button disabled={!valid} className={`btn-primary ${!valid ? 'opacity-60 cursor-not-allowed' : ''}`}>{t('common.add')}</button>
      </div>
    </form>
  );
}
