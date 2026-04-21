"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DRAFT_STORAGE_KEY, DraftState } from '../create/state';
import Loader from '@/components/ui/Loader';
import CertificateInspectModal from '@/components/certificates/CertificateInspectModal';

const getStatusText = (status: string, t: (key: string) => string): string => {
  const statusMap: Record<string, string> = {
    'pending': t('institution.certificates.approvals.status.pending'),
    'approved': t('institution.certificates.approvals.status.approved'),
    'rejected': t('institution.certificates.approvals.status.rejected'),
  };
  return statusMap[status] || status;
};

type ApprovalItem = {
  id: string;
  publicId: string;
  trainingName: string;
  institutionName?: string;
  dateIssued: string;
  status: 'pending' | 'approved' | 'rejected' | 'archived';
  uiaRequired: boolean;
  upperInstitutionRequired?: boolean; // Legacy
  institutionApproved?: boolean;
  studentCount?: number;
  creditsPerStudent?: number;
  createdAt: string;
  updatedAt?: string;
};

type TabType = 'institution' | 'partner' | 'history';

export default function CertificateApprovalsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('institution');
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [partnerItems, setPartnerItems] = useState<ApprovalItem[]>([]);
  const [historyItems, setHistoryItems] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [isPartner, setIsPartner] = useState(false);
  const [inspect, setInspect] = useState<{ open: boolean; certId?: string; item?: ApprovalItem; isHistory?: boolean }>({ open: false });
  const [inspectLoading, setInspectLoading] = useState(false);
  const [inspectDetails, setInspectDetails] = useState<any | null>(null);
  const [inspectStudents, setInspectStudents] = useState<any[]>([]);

  // Revize Et - Reddedilen sertifikayı düzenlemek için Review sayfasına yönlendir
  const handleRevise = async (id: string) => {
    if (!confirm(t('institution.certificates.approvals.actions.confirmRevise') || 'Sertifikayı düzenlemek üzeresiniz. Devam edilsin mi?')) return;

    setSubmitting(id);
    try {
      // 1. Sertifika detaylarını çek
      const resCert = await fetch(`/api/certificates/${id}`);
      if (!resCert.ok) throw new Error('Sertifika bilgileri alınamadı');
      const certData = await resCert.json();

      // 2. Öğrenci listesini çek
      const resStudents = await fetch(`/api/certificates/${id}/students`);
      if (!resStudents.ok) throw new Error('Öğrenci listesi alınamadı');
      const studentsData = await resStudents.json();
      const studentIds = (studentsData.students || []).map((s: any) => s.id);

      // 3. Draft objesini oluştur
      const draft: DraftState = {
        template: (certData.templateKey as any) || 'classic',
        trainingId: certData.trainingId || null,
        trainingName: certData.trainingName || null,
        trainingHours: certData.trainingHours || null,
        trainingLevel: certData.trainingLevel || null,
        trainingLanguage: certData.trainingLanguage || null,
        partners: (certData.partners || []).map((p: any) => p.id).filter(Boolean),
        referencePartnerPublicIds: (certData.externalPartners || []).map((p: any) => p.publicId),
        upperInstitutionRequired: !!certData.uiaRequired,
        upperInstitutionPartnerId: certData.uiaResponsibleId || null,
        studentMethod: 'single',
        selectedStudentIds: studentIds,
        csvPreview: [],
        certificateStartDate: certData.startDate || null,
        certificateEndDate: certData.endDate || certData.dateIssued || null,
        editingCertificateId: id,
      };

      // 4. localStorage'a kaydet ve yönlendir
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      router.push('/institution/certificates/create/review?mode=edit');

    } catch (err) {
      console.error('Revize hatası:', err);
      alert(t('common.error') || 'Bir hata oluştu');
    } finally {
      setSubmitting(null);
    }
  };

  const loadInstitutionApprovals = async () => {
    try {
      const res = await fetch('/api/certificates/approvals');
      if (res.ok) {
        const data = await res.json();
        setItems(data.approvals || []);
      }
    } catch { }
  };

  const loadPartnerApprovals = async () => {
    try {
      const res = await fetch('/api/certificates/partner-approvals');
      if (res.ok) {
        const data = await res.json();
        setPartnerItems(data.approvals || []);
      }
    } catch { }
  };

  const loadApprovalHistory = async () => {
    try {
      const res = await fetch('/api/certificates/approvals?history=true');
      if (res.ok) {
        const data = await res.json();
        setHistoryItems(data.approvals || []);
      }
    } catch { }
  };

  const checkPartnerStatus = async () => {
    try {
      const res = await fetch('/api/organization');
      if (res.ok) {
        const data = await res.json();
        setIsPartner(data.organization?.isPartner || false);
      }
    } catch { }
  };

  const load = async () => {
    setLoading(true);
    await checkPartnerStatus();
    await loadInstitutionApprovals();
    await loadPartnerApprovals();
    await loadApprovalHistory();
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const actInstitution = async (item: ApprovalItem, action: 'approve' | 'reject') => {
    // Confirmation dialogs
    if (action === 'reject') {
      const confirmed = window.confirm(t('institution.certificates.approvals.actions.confirmReject'));
      if (!confirmed) return;
    }
    if (action === 'approve') {
      const creditCount = (item.studentCount || 1) * (item.creditsPerStudent || 1);
      const confirmed = window.confirm(t('institution.certificates.approvals.actions.confirmApproveCredit', { count: creditCount }));
      if (!confirmed) return;
    }

    setSubmitting(item.id);
    try {
      const res = await fetch('/api/certificates/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, action })
      });

      if (res.ok) {
        const responseData = await res.json();
        if (action === 'approve') {
          const creditsUsed = responseData.creditsUsed || 1;
          alert(t('institution.certificates.approvals.messages.approved', { count: creditsUsed }));
        } else {
          alert(t('institution.certificates.approvals.messages.rejected'));
        }
        await loadInstitutionApprovals();
        await loadApprovalHistory();
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        if (errorData.error === 'insufficient_credits') {
          alert(t('institution.certificates.approvals.messages.insufficientCredits', { required: errorData.required, balance: errorData.balance }));
        } else {
          alert(errorData.error ? t('institution.certificates.approvals.messages.error', { error: errorData.error }) : t('institution.certificates.approvals.messages.errorUnknown'));
        }
        console.error('Institution approval error:', errorData);
      }
    } catch (err) {
      console.error('Institution approval request failed:', err);
      alert(t('institution.certificates.approvals.messages.connectionError'));
    } finally {
      setSubmitting(null);
    }
  };

  const actPartner = async (item: ApprovalItem, action: 'approve' | 'reject') => {
    // Confirmation dialog for reject
    if (action === 'reject') {
      const confirmed = window.confirm(t('institution.certificates.approvals.actions.confirmReject'));
      if (!confirmed) return;
    }

    setSubmitting(item.id);
    try {
      const res = await fetch('/api/certificates/partner-approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, action })
      });

      if (res.ok) {
        alert(action === 'approve' ? t('institution.certificates.approvals.messages.partnerApproved') : t('institution.certificates.approvals.messages.partnerRejected'));
        await loadPartnerApprovals();
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        alert(errorData.error ? t('institution.certificates.approvals.messages.error').replace('{error}', errorData.error) : t('institution.certificates.approvals.messages.errorUnknown'));
        console.error('Partner approval error:', errorData);
      }
    } catch (err) {
      console.error('Partner approval request failed:', err);
      alert(t('institution.certificates.approvals.messages.connectionError'));
    } finally {
      setSubmitting(null);
    }
  };

  const resubmitCertificate = async (id: string) => {
    const confirmed = window.confirm(t('institution.certificates.approvals.actions.confirmResubmit'));
    if (!confirmed) return;

    setSubmitting(id);
    try {
      const res = await fetch('/api/certificates/approvals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (res.ok) {
        alert(t('institution.certificates.approvals.messages.resubmitted'));
        await loadInstitutionApprovals();
        await loadApprovalHistory();
        closeInspect();
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        alert(errorData.error ? t('institution.certificates.approvals.messages.error').replace('{error}', errorData.error) : t('institution.certificates.approvals.messages.errorUnknown'));
      }
    } catch (err) {
      console.error('Resubmit request failed:', err);
      alert(t('institution.certificates.approvals.messages.connectionError'));
    } finally {
      setSubmitting(null);
    }
  };

  const currentItems = activeTab === 'institution' ? items : activeTab === 'partner' ? partnerItems : historyItems;
  const currentAction = (activeTab === 'institution' ? actInstitution : actPartner) as
    (item: ApprovalItem, action: 'approve' | 'reject') => Promise<void>;
  const currentListTitle = useMemo(() => {
    if (activeTab === 'institution') return t('institution.certificates.approvals.tabs.institution');
    if (activeTab === 'partner') return t('institution.certificates.approvals.tabs.partner');
    return t('institution.certificates.approvals.tabs.history');
  }, [activeTab, t]);

  const openInspect = async (it: ApprovalItem, isHistory = false) => {
    setInspect({ open: true, certId: it.id, item: it, isHistory });
    setInspectLoading(true);
    setInspectDetails(null);
    setInspectStudents([]);
    try {
      // Load certificate details
      const certRes = await fetch('/api/certificates');
      if (certRes.ok) {
        const list = await certRes.json();
        const cert = (list.certificates || []).find((c: any) => c.id === it.id);
        setInspectDetails(cert || null);
      }
      // Load student list for the certificate
      const stdRes = await fetch(`/api/certificates/${it.id}/students`);
      if (stdRes.ok) {
        const data = await stdRes.json();
        setInspectStudents(data.students || []);
      }
    } catch { }
    finally {
      setInspectLoading(false);
    }
  };
  const closeInspect = () => setInspect({ open: false });

  const getSubtitle = () => {
    if (activeTab === 'institution') return t('institution.certificates.approvals.institutionSubtitle');
    if (activeTab === 'partner') return t('institution.certificates.approvals.partnerSubtitle');
    return t('institution.certificates.approvals.historySubtitle');
  };

  const getEmptyMessage = () => {
    if (activeTab === 'history') return t('institution.certificates.approvals.noHistory');
    return t('institution.certificates.approvals.noPending');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">{t('institution.certificates.approvals.title')}</h1>
          <p className="text-gray-600 mt-2">{getSubtitle()}</p>
        </div>
        <Link href="/institution/certificates" className="btn-secondary">{t('institution.certificates.approvals.backToCertificates')}</Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('institution')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${activeTab === 'institution'
              ? 'border-[#0945A5] text-[#0945A5]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            {t('institution.certificates.approvals.tabs.institution')}
            {items.length > 0 && (
              <span className="ml-2 bg-[#0945A5] text-white text-xs rounded-full px-2 py-0.5">
                {items.length}
              </span>
            )}
          </button>
          {isPartner && (
            <button
              onClick={() => setActiveTab('partner')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${activeTab === 'partner'
                ? 'border-[#0945A5] text-[#0945A5]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {t('institution.certificates.approvals.tabs.partner')}
              {partnerItems.length > 0 && (
                <span className="ml-2 bg-[#0945A5] text-white text-xs rounded-full px-2 py-0.5">
                  {partnerItems.length}
                </span>
              )}
            </button>
          )}
          <button
            onClick={() => setActiveTab('history')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${activeTab === 'history'
              ? 'border-[#0945A5] text-[#0945A5]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            {t('institution.certificates.approvals.tabs.history')}
            {historyItems.length > 0 && (
              <span className="ml-2 bg-gray-200 text-gray-700 text-xs rounded-full px-2 py-0.5">
                {historyItems.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center">
            <Loader />
          </div>
        ) : currentItems.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-4 text-gray-600 text-sm">{getEmptyMessage()}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700 min-w-[800px]">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-6 py-3">{t('institution.certificates.approvals.table.certificateId')}</th>
                  <th className="px-6 py-3">{t('institution.certificates.approvals.table.training')}</th>
                  {activeTab === 'partner' && <th className="px-6 py-3">{t('institution.certificates.approvals.table.institution')}</th>}
                  {activeTab === 'history' && <th className="px-6 py-3">{t('institution.certificates.approvals.table.status')}</th>}
                  <th className="px-6 py-3">{t('institution.certificates.approvals.table.date')}</th>
                  <th className="px-6 py-3">{t('common.uia')}</th>
                  <th className="px-6 py-3 text-right">{t('institution.certificates.approvals.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map(it => (
                  <tr key={it.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-500 whitespace-nowrap">{it.publicId}</td>
                    <td className="px-6 py-4">{it.trainingName}</td>
                    {activeTab === 'partner' && <td className="px-6 py-4">{it.institutionName || '-'}</td>}
                    {activeTab === 'history' && (
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${it.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                          }`}>
                          {it.status === 'approved' ? (
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          )}
                          {getStatusText(it.status, t)}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(it.dateIssued).toLocaleDateString('tr-TR')}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {it.uiaRequired || it.upperInstitutionRequired ? (
                        <span title={t('institution.certificates.approvals.uiaTooltip.required')} className="inline-flex items-center text-emerald-600">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                          </svg>
                          <span className="sr-only">{t('institution.certificates.approvals.uiaTooltip.yes')}</span>
                        </span>
                      ) : (
                        <span title={t('institution.certificates.approvals.uiaTooltip.notRequired')} className="inline-flex items-center text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
                          </svg>
                          <span className="sr-only">{t('institution.certificates.approvals.uiaTooltip.no')}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openInspect(it, activeTab === 'history')}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                        title={t('institution.certificates.approvals.actions.inspect')}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {t('institution.certificates.approvals.actions.inspect')}
                      </button>
                      {activeTab !== 'history' && (
                        <>
                          <button
                            disabled={submitting === it.id}
                            onClick={() => currentAction(it, 'reject')}
                            className="btn-secondary btn-sm disabled:opacity-50"
                          >
                            {t('institution.certificates.approvals.actions.reject')}
                          </button>
                          <button
                            disabled={submitting === it.id}
                            onClick={() => currentAction(it, 'approve')}
                            className="btn-primary btn-sm disabled:opacity-50"
                          >
                            {t('institution.certificates.approvals.actions.approve')}
                          </button>
                        </>
                      )}
                      {activeTab === 'history' && it.status === 'rejected' && (
                        <>
                          <button
                            disabled={submitting === it.id}
                            onClick={() => handleRevise(it.id)}
                            className="btn-primary btn-sm disabled:opacity-50"
                          >
                            {t('institution.certificates.approvals.actions.revise') || 'Revize Et'}
                          </button>
                          <button
                            disabled={submitting === it.id}
                            onClick={() => resubmitCertificate(it.id)}
                            className="btn-secondary btn-sm disabled:opacity-50"
                          >
                            {t('institution.certificates.approvals.actions.resubmit')}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Modal */}
      <CertificateInspectModal
        isOpen={inspect.open}
        onClose={closeInspect}
        item={inspect.item}
        isHistory={inspect.isHistory}
        details={inspectDetails}
        students={inspectStudents}
        loading={inspectLoading}
        onResubmit={resubmitCertificate}
        submitting={submitting === inspect.item?.id}
        title={currentListTitle}
      />
    </div>
  );
}
