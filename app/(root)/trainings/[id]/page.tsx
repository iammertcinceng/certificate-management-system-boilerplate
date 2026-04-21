"use client";

import { useEffect, useState } from 'react';
import { Institution } from '@/types/institution';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

type TrainingDetail = {
  id: string;
  name: string;
  description?: string | null;
  level: string;
  language: string;
  languages?: string[] | null;
  mode?: string | null;
  country?: string | null;
  totalHours: number;
};

type PublicOrg = {
  userId: string;
  slug: string | null;
  publicId: string | null;
  name: string | null;
  logo: string | null;
  infoEmail?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  about?: string | null;
  mission?: string | null;
  vision?: string | null;
  socialLinkedin?: string | null;
  socialTwitter?: string | null;
  socialFacebook?: string | null;
  socialInstagram?: string | null;
  advantages?: string[] | null;
};

export default function TrainingDetailPage() {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [training, setTraining] = useState<TrainingDetail | null>(null);
  const [institution, setInstitution] = useState<PublicOrg | null>(null);
  const [partners, setPartners] = useState<PublicOrg[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/trainings/public/${id}`);
        if (!res.ok) { setNotFound(true); return; }
        const data = await res.json();
        if (!data.training) { setNotFound(true); return; }
        setTraining(data.training as TrainingDetail);
        setInstitution((data.institution || null) as PublicOrg | null);
        setPartners((data.partners || []) as PublicOrg[]);
      } catch {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const toInstitutionModel = (org: PublicOrg): Institution => ({
    id: org.publicId || org.userId,
    slug: org.slug || undefined,
    name: org.name || '—',
    vatNumber: '',
    taxOffice: '',
    loginEmail: '',
    email: org.infoEmail || '',
    phone: org.phone || '',
    website: org.website || undefined,
    address: org.address || undefined,
    about: org.about || undefined,
    mission: org.mission || undefined,
    vision: org.vision || undefined,
    socialMedia: {
      linkedin: org.socialLinkedin || '',
      twitter: org.socialTwitter || '',
      facebook: org.socialFacebook || '',
      instagram: org.socialInstagram || '',
    },
    advantages: org.advantages || [],
    isPartner: false,
  });

  if (isLoading) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-10 space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm animate-pulse h-40" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm animate-pulse h-64" />
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm animate-pulse h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !training) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-10">
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">{t('trainingDetail.notFound')}</h1>
          <p className="text-gray-600">{t('trainingDetail.notFoundDesc')}</p>
        </div>
      </div>
    );
  }

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
    return lang.toUpperCase();
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{training.name}</h1>
        {/* <div className="text-sm text-gray-600">Toplam Süre: {training.totalHours} saat • Dil: {training.language.toUpperCase()}</div> */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">{t('trainingDetail.description')}</h2>
            <p className="text-gray-700 whitespace-pre-line">{training.description || t('trainingDetail.noDescription')}</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="text-xs uppercase tracking-wide text-gray-500">{t('trainingDetail.totalHours')}</div>
                <div className="mt-1 text-xl font-semibold text-gray-900">{training.totalHours}</div>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="text-xs uppercase tracking-wide text-gray-500">{t('trainingDetail.level')}</div>
                <div className="mt-1 text-xl font-semibold text-gray-900">{formatLevel(training.level)}</div>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="text-xs uppercase tracking-wide text-gray-500">{t('trainingDetail.language')}</div>
                <div className="mt-1 text-xl font-semibold text-gray-900">{formatLanguage(training.language)}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="text-xs uppercase tracking-wide text-gray-500">{t('common.trainings.languages')}</div>
                <div className="mt-1 text-sm font-medium text-gray-900">{training.languages && training.languages.length ? training.languages.map(l => l.toUpperCase()).join(', ') : '-'}</div>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="text-xs uppercase tracking-wide text-gray-500">{t('common.trainings.mode')}</div>
                <div className="mt-1 text-sm font-medium text-gray-900">{training.mode || '-'}</div>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="text-xs uppercase tracking-wide text-gray-500">{t('common.trainings.country')}</div>
                <div className="mt-1 text-sm font-medium text-gray-900">{training.country ? training.country.toUpperCase() : '-'}</div>
              </div>
            </div>
          </div>

          {partners.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('trainingDetail.accreditors')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {partners.map((partner) => (
                  <Link key={partner.userId} href={`/collaborations/${partner.slug}`} className="block">
                    <div className="p-4 rounded-xl border border-gray-200 hover:border-[#0945A5] hover:shadow-sm transition">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                          {partner.logo ? <img src={partner.logo} alt={partner.name || ''} className="w-full h-full object-cover" /> : <span>🤝</span>}
                        </div>
                        <div className="text-sm font-medium text-gray-800">{partner.name}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          {institution && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('trainingDetail.institution')}</h3>
              <Link href={`/collaborations/${institution.slug}`} className="flex items-center gap-3 hover:text-[#0945A5]">
                <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                  {institution.logo ? <img src={institution.logo} alt={institution.name || ''} className="w-full h-full object-cover" /> : <span>🏢</span>}
                </div>
                <span className="font-medium text-gray-800">{institution.name}</span>
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
