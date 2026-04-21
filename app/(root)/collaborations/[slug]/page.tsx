"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Institution } from '@/types/institution';
import { useParams } from 'next/navigation';
import FirmProfile from '@/components/FirmProfile';
import { useLanguage } from '@/contexts/LanguageContext';
import Loader from '@/components/ui/Loader';

type TrainingLite = { id: string; name: string; languages?: string[] | null; mode?: string | null; country?: string | null };

export default function CollaborationDetail() {
  const { t } = useLanguage();
  const { slug } = useParams<{ slug: string }>();
  const [inst, setInst] = useState<Institution | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [trainings, setTrainings] = useState<TrainingLite[]>([]);
  const [role, setRole] = useState<'institution' | 'partner'>('institution');
  const [notFound, setNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/collaborations/public-list/${slug}`);
        if (!res.ok) { setNotFound(true); return; }
        const data = await res.json();
        if (!data.item) { setNotFound(true); return; }
        const it = data.item as { id: string; slug: string; name: string; logo?: string | null; role: 'institution' | 'acreditor'; trainings?: TrainingLite[]; organization?: any };
        setLogo(it.logo || null);
        setRole(it.role === 'acreditor' ? 'partner' : 'institution');
        setTrainings(it.trainings || []);
        // Map to Institution shape for FirmProfile
        const mapped: Institution = {
          id: it.id,
          slug: it.slug,
          name: it.name,
          vatNumber: '',
          taxOffice: '',
          loginEmail: '', // listing modunda gösterilmez
          email: it.organization?.infoEmail || '', // iletişim email'i - listing'de gösterilir
          phone: it.organization?.phone || '',
          website: it.organization?.website || undefined,
          address: it.organization?.address || undefined,
          about: it.organization?.about || undefined,
          mission: it.organization?.mission || undefined,
          vision: it.organization?.vision || undefined,
          socialMedia: {
            linkedin: it.organization?.socialLinkedin || '',
            twitter: it.organization?.socialTwitter || '',
            facebook: it.organization?.socialFacebook || '',
            instagram: it.organization?.socialInstagram || '',
          },
          advantages: it.organization?.advantages || [],
          isPartner: it.role === 'acreditor',
        };
        setInst(mapped);
      } catch {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [slug]);

  if (isLoading) {
    return (
      <Loader />
    );
  }

  if (notFound || !inst) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-800">{t('collaborationDetail.notFound')}</h1>
        <p className="text-gray-600">{t('collaborationDetail.notFoundDesc')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-6">
      {/* Hero Section with Trainings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FirmProfile entity={inst} role={role} mode="listing" logoDataUrl={logo} />
        </div>

        {/* Trainings Sidebar */}
        <aside className="lg:sticky lg:top-4 h-max space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">{t('collaborationDetail.trainings')}</h3>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                {trainings.length}
              </span>
            </div>

            <div className="space-y-3">
              {trainings.map((training) => (
                <Link
                  href={`/trainings/${training.id}`}
                  key={training.id}
                  className="block p-4 rounded-lg border border-gray-200 hover:border-[#0945A5] hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-medium text-gray-800 text-sm group-hover:text-[#0945A5] transition-colors">
                      {training.name}
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                    {training.languages && training.languages.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-gray-200 bg-gray-50">
                        <span>🌐</span>
                        <span className="font-mono">
                          {training.languages.map(l => l.toUpperCase()).join(', ')}
                        </span>
                      </span>
                    )}
                    {training.mode && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-gray-200 bg-gray-50">
                        <span>📋</span>
                        <span className="font-mono">{training.mode}</span>
                      </span>
                    )}
                    {training.country && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-gray-200 bg-gray-50">
                        <span>📍</span>
                        <span className="font-mono">{training.country.toUpperCase()}</span>
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {trainings.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-2 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
                <p className="text-sm">{t('collaborationDetail.noTrainings')}</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

