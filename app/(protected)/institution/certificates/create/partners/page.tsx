"use client";

import { useRouter } from 'next/navigation';
import { useDraft } from '../state';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Loader from '@/components/ui/Loader';
import Checkbox from '@/components/ui/Checkbox';

type PartnerItem = { id: string; name: string; industry?: string | null };
type ReferencePartner = {
  id: string;
  partnerPublicId: string;
  partnerName: string;
  partnerLogo?: string | null;
  status: string;
  isSpecialPartner: boolean;
  accreditationEndDate?: string | null;
  accreditationStatus?: 'active' | 'expiring_soon' | 'expired' | 'grace_period' | null;
};

// Special partners that require accreditation (ICF, CPD)
const SPECIAL_PARTNER_IDS = ['RFR-000001', 'RFR-000002'];

export default function PartnersStep() {
  const router = useRouter();
  const { draft, setDraft } = useDraft();
  const [partners, setPartners] = useState<PartnerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refPartners, setRefPartners] = useState<ReferencePartner[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/collaborations');
        if (res.ok) {
          const data = await res.json();
          // Only show approved collaborations - not pending or rejected
          const items: PartnerItem[] = (data.collaborations || [])
            .filter((row: any) => row.collaboration?.status === 'approved')
            .map((row: any) => ({
              id: row.partnerUser?.id,
              name: row.partnerOrg?.name || row.partnerUser?.email || 'Bilinmeyen Partner',
              industry: row.partnerOrg?.about || null,
            })).filter((x: PartnerItem) => !!x.id);
          if (mounted) setPartners(items);
        }
      } catch { }
      finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  // Fetch external partnerships with accreditation status
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/external-partnerships');
        if (res.ok) {
          const data = await res.json();
          // Only show approved partnerships
          const items: ReferencePartner[] = (data.partnerships || [])
            .filter((p: any) => p.status === 'approved')
            .map((p: any) => ({
              id: p.id,
              partnerPublicId: p.partnerPublicId,
              partnerName: p.partnerName,
              partnerLogo: p.partnerLogo || null,
              status: p.status,
              isSpecialPartner: p.isSpecialPartner,
              accreditationEndDate: p.accreditationEndDate,
              accreditationStatus: p.accreditationStatus,
            }));
          if (mounted) setRefPartners(items);
        } else {
          if (mounted) setRefPartners([]);
        }
      } catch {
        if (mounted) setRefPartners([]);
      } finally {
        if (mounted) setLoadingRefs(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const togglePartner = (id: string) => {
    setDraft(d => ({
      ...d,
      partners: d.partners.includes(id) ? d.partners.filter(p => p !== id) : [...d.partners, id],
      upperInstitutionPartnerId: d.upperInstitutionPartnerId === id ? null : d.upperInstitutionPartnerId,
    }));
  };

  const toggleReferencePartner = (publicId: string) => {
    setDraft(d => ({
      ...d,
      referencePartnerPublicIds: d.referencePartnerPublicIds.includes(publicId)
        ? d.referencePartnerPublicIds.filter(p => p !== publicId)
        : [...d.referencePartnerPublicIds, publicId],
    }));
  };

  // Edit mode detection
  const isEditMode = !!draft.editingCertificateId;

  return (
    <div className="mt-0">
      {/* Edit Mode Banner */}
      {isEditMode && (
        <div className="mb-4 p-3 rounded-lg bg-orange-50 border border-orange-200 flex items-center gap-2">
          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span className="text-sm text-orange-700 font-medium">{t('institution.certificates.create.reviseModeBanner')}</span>
        </div>
      )}

      <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('institution.certificates.create.partners.title')}</h2>
      <p className="text-gray-600 mt-1">{t('institution.certificates.create.partners.subtitle')}</p>

      <div className="mt-6 space-y-6">
        <div>
          <div className="mb-1 text-sm font-medium text-gray-700">{t('institution.certificates.create.partners.uiaTitle')}</div>
          <div className="flex items-center gap-6">
            <Checkbox
              checked={!draft.upperInstitutionRequired}
              onChange={(e) => setDraft(d => ({ ...d, upperInstitutionRequired: false, upperInstitutionPartnerId: null }))}
              label={t('common.no')}
            />
            <Checkbox
              checked={draft.upperInstitutionRequired}
              onChange={(e) => setDraft(d => ({ ...d, upperInstitutionRequired: true }))}
              label={t('common.yes')}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{t('institution.certificates.create.partners.uiaHint')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-1">
          {loading ? (
            <Loader label={t('institution.certificates.create.partners.loading')} />
          ) : partners.length ? (
            partners.map(p => (
              <div
                key={p.id}
                className={`group p-4 rounded-lg border transition-all hover:shadow-sm hover:border-gray-300 cursor-pointer ${draft.partners.includes(p.id) ? 'border-[#0945A5]/40 bg-[#0945A5]/5' : 'border-gray-200 bg-white'
                  }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-gray-800 truncate">{p.name}</div>
                    <div className="text-sm text-gray-500 truncate">{p.industry || '-'}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePartner(p.id)}
                    className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs border transition-colors cursor-pointer ${draft.partners.includes(p.id)
                      ? 'bg-[#0945A5] text-white border-[#0945A5]'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    {draft.partners.includes(p.id) ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.28-2.53a.75.75 0 1 0-1.06-1.06L10.5 12.44l-1.47-1.47a.75.75 0 1 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l4.5-4.56Z" clipRule="evenodd" /></svg>
                    ) : (
                      <span className="w-4 h-4 rounded-sm border border-gray-400 inline-block" />
                    )}
                    {draft.partners.includes(p.id) ? t('institution.certificates.create.partners.selected') : t('institution.certificates.create.partners.select')}
                  </button>
                </div>
                {draft.upperInstitutionRequired && draft.partners.includes(p.id) && (
                  <button
                    type="button"
                    onClick={() => setDraft(d => ({ ...d, upperInstitutionPartnerId: p.id }))}
                    className={`mt-3 inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs border transition-colors cursor-pointer ${draft.upperInstitutionPartnerId === p.id
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full border ${draft.upperInstitutionPartnerId === p.id ? 'bg-emerald-500 border-emerald-500' : 'border-gray-400'}`} />
                    {t('institution.certificates.create.partners.uiaResponsible')}
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500">{t('institution.certificates.create.partners.noPartners')}</div>
          )}
        </div>

        {/* External (Reference) Partners - cannot be upper institution */}
        <div>
          <div className="mt-8 mb-2 text-sm font-medium text-gray-700">{t('institution.certificates.create.partners.external')}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-80 overflow-y-auto pr-1">
            {loadingRefs ? (
              <Loader label={t('institution.certificates.create.partners.loading')} />
            ) : refPartners.length ? (
              refPartners.map((p) => {
                // Check if this is a special partner with expired accreditation
                const isSpecial = SPECIAL_PARTNER_IDS.includes(p.partnerPublicId);
                const isExpired = p.accreditationStatus === 'expired';
                const isGracePeriod = p.accreditationStatus === 'grace_period';
                const isExpiringSoon = p.accreditationStatus === 'expiring_soon';
                const isDisabled = isExpired; // Only fully disabled if completely expired (end_date + 3 months)
                const isSelected = draft.referencePartnerPublicIds.includes(p.partnerPublicId);

                return (
                  <div
                    key={p.partnerPublicId}
                    className={`group p-4 rounded-lg border transition-all ${isDisabled
                      ? 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed'
                      : isGracePeriod
                        ? 'border-orange-300 bg-orange-50 hover:shadow-sm cursor-pointer'
                        : isSelected
                          ? 'border-purple-400/60 bg-purple-50'
                          : 'border-gray-200 bg-white hover:shadow-sm hover:border-gray-300 cursor-pointer'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-800 truncate">
                          {p.partnerName}
                          {isExpiringSoon && <span className="ml-2 text-amber-600">⚠️</span>}
                          {isGracePeriod && <span className="ml-2 text-orange-600">⏳</span>}
                          {isExpired && <span className="ml-2 text-red-600">❌</span>}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{p.partnerPublicId}</div>
                        {isSpecial && p.accreditationEndDate && (
                          <div className={`text-xs mt-1 ${isExpired ? 'text-red-500' : isGracePeriod ? 'text-orange-500' : 'text-gray-400'}`}>
                            {t('institution.partners.references.accreditationEnd')}: {new Date(p.accreditationEndDate).toLocaleDateString('tr-TR')}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => !isDisabled && toggleReferencePartner(p.partnerPublicId)}
                        disabled={isDisabled}
                        className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs border transition-colors ${isDisabled
                          ? 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'
                          : isSelected
                            ? 'bg-purple-600 text-white border-purple-600 cursor-pointer'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 cursor-pointer'
                          }`}
                      >
                        {isSelected ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.28-2.53a.75.75 0 1 0-1.06-1.06L10.5 12.44l-1.47-1.47a.75.75 0 1 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l4.5-4.56Z" clipRule="evenodd" /></svg>
                        ) : (
                          <span className="w-4 h-4 rounded-sm border border-gray-400 inline-block" />
                        )}
                        {isDisabled
                          ? t('institution.certificates.create.partners.expired')
                          : isSelected
                            ? t('institution.certificates.create.partners.selected')
                            : t('institution.certificates.create.partners.select')}
                      </button>
                    </div>
                    {/* Not allowed to pick as upper institution */}
                    {draft.upperInstitutionRequired && (
                      <div className="mt-3 text-xs text-gray-500">{t('institution.certificates.create.partners.externalCannotBeUia')}</div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-gray-500">{t('institution.certificates.create.partners.noPartners')}</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button onClick={() => router.push('/institution/certificates/create/training')} className="btn-secondary">{t('common.back')}</button>
        <button onClick={() => router.push('/institution/certificates/create/students')} className="btn-primary">{t('common.next')}</button>
      </div>
    </div>
  );
}
