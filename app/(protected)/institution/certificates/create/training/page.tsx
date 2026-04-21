"use client";

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import { useDraft } from '../state';
import Loader from '@/components/ui/Loader';

type Training = {
  id: string;
  publicId: string;
  name: string;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected';
  totalHours: number;
  level: string;
  language: string;
};

export default function TrainingStep() {
  const router = useRouter();
  const { draft, setDraft } = useDraft();
  const [items, setItems] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/trainings');
        if (res.ok) {
          const data = await res.json();
          if (mounted) setItems(data.trainings || []);
        }
      } catch { }
      finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  // Edit mode detection
  const isEditMode = !!draft.editingCertificateId;

  return (
    <div>
      {/* Edit Mode Banner */}
      {isEditMode && (
        <div className="mb-4 p-3 rounded-lg bg-orange-50 border border-orange-200 flex items-center gap-2">
          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span className="text-sm text-orange-700 font-medium">{t('institution.certificates.create.reviseModeBanner')}</span>
        </div>
      )}

      <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('institution.certificates.create.training.title')}</h2>
      <p className="text-gray-600 mt-1">{t('institution.certificates.create.training.subtitle')}</p>
      {loading ? (
        <Loader />
      ) : (
        <div className="mt-6 space-y-4">
          {items.map(training => {
            const isSelectable = training.status === 'approved';
            const isSelected = draft.trainingId === training.id;

            return (
              <div
                key={training.id}
                onClick={() => isSelectable && setDraft(d => ({
                  ...d,
                  trainingId: training.id,
                  trainingName: training.name,
                  trainingHours: training.totalHours,
                  trainingLevel: training.level,
                  trainingLanguage: training.language
                }))}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${!isSelectable
                  ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
                  : isSelected
                    ? 'bg-primary-500/10 border-primary-500/30'
                    : 'border-gray-200 hover:bg-gray-50'
                  }`}
              >
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  {training.name}
                  {training.status === 'pending' && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">{t('institution.certificates.create.training.pending')}</span>
                  )}
                  {training.status === 'rejected' && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 border border-red-200">{t('institution.certificates.create.training.rejected') || 'Reddedildi'}</span>
                  )}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{training.description || '-'}</p>
              </div>
            );
          })}
          {!items.length && (
            <div className="text-sm text-gray-500">{t('institution.certificates.create.training.noItems')}</div>
          )}
        </div>
      )}
      <div className="mt-6 flex justify-between">
        <button onClick={() => router.push('/institution/certificates/create/template')} className="btn-secondary">{t('common.back')}</button>
        <button disabled={!draft.trainingId} onClick={() => router.push('/institution/certificates/create/partners')} className="btn-primary disabled:opacity-50">{t('common.next')}</button>
      </div>
    </div>
  );
}
