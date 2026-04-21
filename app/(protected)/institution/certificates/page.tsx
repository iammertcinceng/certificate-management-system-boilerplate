"use client";
import Loading from '@/components/Loading';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import UiaTooltip from '@/components/UiaTooltip';
import StatusTooltip from '@/components/StatusTooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import { downloadCertificatePdf } from '@/utils/certificateDownload';
import Loader from '@/components/ui/Loader';

type CertStatus = 'pending' | 'approved' | 'rejected';

type Certificate = {
  // IDs
  id: string; // System UUID - internal use only
  publicId: string; // CRT-000001 - Display ID
  trainingId: string;

  // Training info (from JOIN)
  trainingName: string;

  // Partners (from certificatePartners table)
  partners: {
    userId: string;
    name: string | null;
    publicId: string | null;
  }[];

  // Dates
  dateIssued: string; // ISO date (legacy, same as endDate)
  startDate?: string | null; // Optional certificate start date
  endDate?: string | null; // Certificate end date
  createdAt: string;

  // Status
  status: CertStatus;

  // Approvals
  institutionApproved: boolean;
  partnerApproved: boolean;
  adminApproved: boolean;

  // Üst Kurum (Upper Institution) - UIA
  uiaRequired: boolean; // Üst kurum onayı gerekli mi?
  uiaResponsibleId: string | null; // UIA sorumlusu
  upperInstitutionRequired?: boolean; // Legacy field (deprecated)
  upperInstitutionPartnerUserId?: string | null; // Legacy field (deprecated)

  // Students
  studentCount: number;

  // Theme
  templateKey: string;
  colorPrimary: string | null;
  colorSecondary: string | null;
};

const CertificateStatus = ({ status, cert }: { status: CertStatus; cert: Certificate }) => {
  const { t } = useLanguage();

  // Sadece admin onayı varsa ve diğer onaylar gerekmiyorsa approved göster
  const hasPartnerApprovalRequired = cert.partners.length > 0;
  const effective = cert.adminApproved && !hasPartnerApprovalRequired ? 'approved' : (status === 'approved' ? 'approved' : status);

  const statusStyles: Record<CertStatus, string> = {
    approved: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    pending: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
    rejected: 'bg-red-500/10 text-red-700 border-red-500/20',
  };
  const statusText: Record<CertStatus, string> = {
    approved: t('institution.certificates.filter.approved'),
    pending: t('institution.certificates.filter.pending'),
    rejected: t('institution.certificates.filter.rejected'),
  };

  // Tooltip content for pending/rejected
  const getTooltipContent = () => {
    if (cert.adminApproved && !hasPartnerApprovalRequired) {
      // Sadece admin onayı varsa boş döndür
      return '';
    }

    if (status === 'pending') {
      // Show current stage waiting for approval
      if (!cert.institutionApproved) return t('institution.certificates.tooltip.waitingInstitution');
      if (!cert.partnerApproved && cert.partners.length > 0) return t('institution.certificates.tooltip.waitingPartner');
      return '';
    }
    if (status === 'rejected') {
      // Show where it was rejected
      if (!cert.institutionApproved) return t('institution.certificates.tooltip.rejectedInstitution');
      if (!cert.partnerApproved) return t('institution.certificates.tooltip.rejectedPartner');
      return '';
    }
    return '';
  };

  const tooltipContent = getTooltipContent();

  return (
    <StatusTooltip content={tooltipContent}>
      <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${statusStyles[effective]} cursor-help`}>
        {statusText[effective]}
      </span>
    </StatusTooltip>
  );
};

export default function CertificatesPage() {
  const { t } = useLanguage();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'id' | 'date_desc' | 'students_desc'>('id');
  const [statusFilter, setStatusFilter] = useState<'all' | CertStatus>('all');
  const [partnerFilter, setPartnerFilter] = useState<string>('all');
  const [trainingFilter, setTrainingFilter] = useState<string>('all');
  const [eDevletFilter, setEDevletFilter] = useState<'approved' | 'unapproved' | 'disabled'>('disabled');
  const [studentModal, setStudentModal] = useState<{ open: boolean; cert?: Certificate }>(() => ({ open: false }));
  const [addTrainingOpen, setAddTrainingOpen] = useState(false);
  const [isPartner, setIsPartner] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [pendingPartnerApprovals, setPendingPartnerApprovals] = useState(0);
  const [modalStudents, setModalStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [sendingEmailTo, setSendingEmailTo] = useState<string | null>(null); // student.id veya 'all'
  const [downloadingCert, setDownloadingCert] = useState<string | null>(null);
  const [bulkDownloadLoading, setBulkDownloadLoading] = useState(false);

  useEffect(() => {
    fetchCertificates();
    fetchPendingApprovals();
    checkPartnerStatus();
  }, []);

  const checkPartnerStatus = async () => {
    try {
      const res = await fetch('/api/organization');
      if (res.ok) {
        const data = await res.json();
        setIsPartner(data.organization?.isPartner || false);
      }
    } catch { }
  };

  const fetchPendingApprovals = async () => {
    try {
      // Admin onayı artık gerekli değil - sadece partner onaylarını çek
      const partnerRes = await fetch('/api/certificates/partner-approvals');

      // Kurum onayları kaldırıldı
      setPendingApprovals(0);

      if (partnerRes.ok) {
        const data = await partnerRes.json();
        setPendingPartnerApprovals((data.approvals || []).length);
      }
    } catch { }
  };

  const fetchCertificates = async () => {
    try {
      const res = await fetch('/api/certificates');
      if (res.ok) {
        const data = await res.json();
        // API response is already in correct format
        setCertificates(data.certificates || []);
      } else {
        console.error('Failed to fetch certificates');
      }
    } catch (err) {
      console.error('Error fetching certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  const partnerOptions = useMemo(() => {
    const set = new Set<string>();
    certificates.forEach(c => c.partners.forEach(p => {
      if (p.name) set.add(p.name);
    }));
    return Array.from(set).sort();
  }, [certificates]);

  const trainingOptions = useMemo(() => {
    const set = new Set<string>();
    certificates.forEach(c => set.add(c.trainingName));
    return Array.from(set).sort();
  }, [certificates]);

  const filtered = useMemo(() => {
    let data = [...certificates];

    // Partner filter
    if (partnerFilter !== 'all') {
      data = data.filter(c => c.partners.some(p => p.name === partnerFilter));
    }

    // Training filter
    if (trainingFilter !== 'all') {
      data = data.filter(c => c.trainingName === trainingFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      data = data.filter(c => c.status === statusFilter);
    }

    // Üst Kurum tri-state filter
    if (eDevletFilter !== 'disabled') {
      data = data.filter(c => (eDevletFilter === 'approved' ? c.uiaRequired : !c.uiaRequired));
    }

    // Sort
    switch (sort) {
      case 'date_desc':
        data.sort((a, b) => new Date(b.dateIssued).getTime() - new Date(a.dateIssued).getTime());
        break;
      case 'students_desc':
        data.sort((a, b) => b.studentCount - a.studentCount);
        break;
      case 'id':
      default:
        data.sort((a, b) => a.publicId.localeCompare(b.publicId));
    }
    return data;
  }, [certificates, partnerFilter, trainingFilter, statusFilter, eDevletFilter, sort]);

  const openStudentModal = async (cert: Certificate) => {
    setStudentModal({ open: true, cert });
    setLoadingStudents(true);
    try {
      const res = await fetch(`/api/certificates/${cert.id}/students`);
      if (res.ok) {
        const data = await res.json();
        setModalStudents(data.students || []);
      } else {
        setModalStudents([]);
      }
    } catch {
      setModalStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const closeStudentModal = () => {
    setStudentModal({ open: false });
    setModalStudents([]);
  };

  const bulkDownload = async () => {
    if (!studentModal.cert || bulkDownloadLoading) return;

    setBulkDownloadLoading(true);
    try {
      // Call bulk download API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5 minute timeout

      const res = await fetch(`/api/certificates/${studentModal.cert.id}/download-all`, {
        method: 'POST',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const blob = await res.blob();

        // Check if blob is valid
        if (blob.size === 0) {
          console.error('[bulkDownload] Empty ZIP file received');
          alert(t('institution.certificates.errors.cannotDownload') + '\n\nDetay: Boş dosya alındı. Lütfen tekrar deneyin.');
          return;
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${studentModal.cert.publicId}-certificates.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Try to get error details from response
        let errorDetails = '';
        try {
          const errorData = await res.json();
          errorDetails = errorData.details || errorData.error || '';
          console.error('[bulkDownload] Server error:', errorData);
        } catch {
          errorDetails = `HTTP ${res.status}`;
        }

        alert(t('institution.certificates.errors.cannotDownload') + (errorDetails ? `\n\nDetay: ${errorDetails}` : ''));
      }
    } catch (err: any) {
      console.error('[bulkDownload] Error:', err);

      if (err.name === 'AbortError') {
        alert('İndirme zaman aşımına uğradı. Lütfen daha küçük gruplar halinde indirmeyi deneyin.');
      } else {
        alert(t('institution.certificates.errors.downloadError') + `\n\nDetay: ${err.message || 'Bilinmeyen hata'}`);
      }
    } finally {
      setBulkDownloadLoading(false);
    }
  };

  const downloadSingleCertificate = async (studentId: string, studentName: string) => {
    if (!studentModal.cert) return;

    setDownloadingCert(studentId);
    try {
      const success = await downloadCertificatePdf({
        certificateId: studentModal.cert.id,
        studentId,
        onProgress: (msg) => console.log('PDF:', msg),
      });

      if (!success) {
        alert(t('institution.certificates.errors.cannotDownloadSingle'));
      }
    } catch (err) {
      console.error('Download error:', err);
      alert(t('institution.certificates.errors.downloadError'));
    } finally {
      setDownloadingCert(null);
    }
  };

  // Mail Gönder fonksiyonu
  const sendEmailToStudent = async (studentId?: string) => {
    if (!studentModal.cert) return;

    const targetId = studentId || 'all';
    setSendingEmailTo(targetId);

    try {
      const res = await fetch('/api/email/send-certificate-ready', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificateId: studentModal.cert.id,
          studentId: studentId || undefined
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message || t('institution.certificates.email.success'));
      } else {
        alert(data.error || t('institution.certificates.email.error'));
      }
    } catch (err) {
      console.error('Email send error:', err);
      alert(t('institution.certificates.email.error'));
    } finally {
      setSendingEmailTo(null);
    }
  };

  if (loading) {
    return (
      <Loader />
    );
  }

  // Sadece partner onaylarını göster
  const totalPending = pendingPartnerApprovals;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">{t('institution.certificates.title')}</h1>
          <p className="text-gray-600 mt-2">{t('institution.certificates.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/institution/certificates/approvals"
            className="btn-secondary relative"
          >
            {t('institution.certificates.approvals.title')}
            {totalPending > 0 && (
              <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-red-600 rounded-full">
                {totalPending}
              </span>
            )}
          </Link>
          <Link href="/institution/trainings" className="btn-secondary">{t('institution.certificates.trainings')}</Link>
          <Link href="/institution/certificates/create" className="btn-primary">{t('institution.certificates.createNew')}</Link>
        </div>
      </div>

      {/* Pending Approvals Alert */}
      {totalPending > 0 && (
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-900">{t('institution.certificates.pendingApprovals.title')}</h3>
              <div className="mt-2 text-sm text-amber-800 space-y-1">
                {/* Kurum (admin) onayları gizlendi */}
                {pendingPartnerApprovals > 0 && isPartner && (
                  <p>• <strong>{pendingPartnerApprovals}</strong> {t('institution.certificates.pendingApprovals.partnerWaiting')}</p>
                )}
              </div>
              <div className="mt-3">
                <Link
                  href="/institution/certificates/approvals"
                  className="inline-flex items-center gap-2 text-sm font-medium text-amber-900 hover:text-amber-700 transition-colors"
                >
                  {t('institution.certificates.pendingApprovals.viewApprovals')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtreler & Sıralama */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 gap-3 items-center">
          {/* TODO: dinamik - eğitim listesi backend'den/CTX'den beslenecek */}
          <div className="relative w-60 md:w-72">
            <select
              value={trainingFilter}
              onChange={e => setTrainingFilter(e.target.value)}
              className="appearance-none input p-1 w-full border-gray-300 rounded-lg pr-10 shadow-sm focus:border-[#0945A5] focus:ring-2 focus:ring-[#0945A5]/30"
            >
              <option value="all">{t('institution.certificates.dropdowns.allTrainings')}</option>
              {trainingOptions.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
            </span>
          </div>
          {/* TODO: dinamik - partner listesi backend'den/CTX'den beslenecek */}
          <div className="relative w-60 md:w-72">
            <select
              value={partnerFilter}
              onChange={e => setPartnerFilter(e.target.value)}
              className="appearance-none input p-1 w-full border-gray-300 rounded-lg pr-10 shadow-sm focus:border-[#0945A5] focus:ring-2 focus:ring-[#0945A5]/30"
            >
              <option value="all">{t('institution.certificates.dropdowns.allPartners')}</option>
              {partnerOptions.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
            </span>
          </div>
          {/* TODO: dinamik - durum sabit ancak i18n'den beslenecek */}
          <div className="relative w-40">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="appearance-none input p-1 w-full border-gray-300 rounded-lg pr-10 shadow-sm focus:border-[#0945A5] focus:ring-2 focus:ring-[#0945A5]/30"
            >
              <option value="all">{t('institution.certificates.filter.all')}</option>
              <option value="approved">{t('institution.certificates.filter.approved')}</option>
              <option value="pending">{t('institution.certificates.filter.pending')}</option>
              <option value="rejected">{t('institution.certificates.filter.rejected')}</option>
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
            </span>
          </div>
          {/* Üst Kurum tri-state filter button (compact square) */}
          <button
            type="button"
            onClick={() => setEDevletFilter(prev => prev === 'disabled' ? 'approved' : prev === 'approved' ? 'unapproved' : 'disabled')}
            className={`inline-flex items-center justify-center w-9 h-9 rounded-md border transition-colors ${eDevletFilter === 'approved' ? 'border-emerald-400 text-emerald-600 bg-white' :
              eDevletFilter === 'unapproved' ? 'border-gray-300 text-gray-500 bg-white' :
                'border-gray-200 text-gray-400 bg-white'
              }`}
            aria-label={
              eDevletFilter === 'approved' ? t('institution.certificates.uia.filterApproved') :
                eDevletFilter === 'unapproved' ? t('institution.certificates.uia.filterUnapproved') :
                  t('institution.certificates.uia.filterOff')
            }
          >
            {eDevletFilter === 'approved' && (
              // check-circle
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm4.28 7.22a.75.75 0 0 0-1.06-1.06l-4.72 4.72-1.72-1.72a.75.75 0 1 0-1.06 1.06l2.25 2.25c.3.3.79.3 1.09 0l5.22-5.25Z" clipRule="evenodd" />
              </svg>
            )}
            {eDevletFilter === 'unapproved' && (
              // plain circle
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <circle cx="12" cy="12" r="6" />
              </svg>
            )}
            {eDevletFilter === 'disabled' && (
              // minus-circle (disabled icon)
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Z" />
                <rect x="7.5" y="11.25" width="9" height="1.5" rx="0.75" className="fill-white" />
              </svg>
            )}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{t('institution.certificates.sort.label')}</span>
          <div className="relative w-56">
            <select
              value={sort}
              onChange={e => setSort(e.target.value as 'id' | 'date_desc' | 'students_desc')}
              className="appearance-none input p-1 w-full border-gray-300 rounded-lg pr-10 shadow-sm focus:border-[#0945A5] focus:ring-2 focus:ring-[#0945A5]/30"
            >
              <option value="id">{t('institution.certificates.sort.idDefault')}</option>
              <option value="date_desc">{t('institution.certificates.sort.dateDesc')}</option>
              <option value="students_desc">{t('institution.certificates.sort.studentsDesc')}</option>
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50">
            <tr>
              {/* TODO: dinamik - kolonlar yapılandırılabilir olacak (feature flags/ayarlar) */}
              <th scope="col" className="px-6 py-3 whitespace-nowrap">{t('institution.certificates.table.certificateId')}</th>
              <th scope="col" className="px-6 py-3">{t('institution.certificates.table.trainingName')}</th>
              <th scope="col" className="px-6 py-3">{t('institution.certificates.table.partners')}</th>
              <th scope="col" className="px-6 py-3">{t('institution.certificates.table.date')}</th>
              <th scope="col" className="px-6 py-3">{t('institution.certificates.table.status')}</th>
              <th scope="col" className="px-6 py-3 whitespace-nowrap">
                <UiaTooltip>
                  <span>UIA</span>
                </UiaTooltip>
              </th>
              <th scope="col" className="px-6 py-3">{t('institution.certificates.table.students')}</th>
              <th scope="col" className="px-6 py-3">{t('institution.certificates.table.studentList')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((cert) => (
              <tr
                key={cert.id}
                className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${cert.upperInstitutionPartnerUserId ? 'bg-blue-50/30' : ''
                  }`}
              >
                <td className="px-6 py-4 font-mono text-xs text-gray-500 whitespace-nowrap">{cert.publicId}</td>
                <td className="px-6 py-4 font-medium text-gray-800">{cert.trainingName}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {(cert.partners.length > 2 ? cert.partners.slice(0, 2) : cert.partners).map((p) => (
                      <span key={p.userId} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                        {p.name || t('institution.certificates.partners.unknown')}
                      </span>
                    ))}
                    {cert.partners.length > 2 && (
                      <span className="relative group">
                        <span
                          className="px-2 py-0.5 text-xs rounded-full bg-gray-50 text-gray-600 border border-gray-200 cursor-pointer"
                          aria-label={`${t('institution.certificates.partners.more')}: ${cert.partners.slice(2).map(p => p.name).join(', ')}`}
                        >
                          +{cert.partners.length - 2}
                        </span>
                        <div className="absolute z-20 hidden group-hover:block left-0 mt-1 min-w-[12rem] rounded-md border border-gray-200 bg-[var(--muted)] p-2 shadow-lg">
                          <div className="text-xs text-gray-500 mb-1">{t('institution.certificates.partners.more')}</div>
                          <ul className="max-h-40 overflow-auto pr-1">
                            {cert.partners.slice(2).map(p => (
                              <li key={p.userId} className="text-sm text-gray-700 py-0.5">{p.name || t('institution.certificates.partners.unknown')}</li>
                            ))}
                          </ul>
                        </div>
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {cert.startDate && cert.endDate ? (
                    <span>
                      {new Date(cert.startDate).toLocaleDateString('tr-TR')} - {new Date(cert.endDate).toLocaleDateString('tr-TR')}
                    </span>
                  ) : (
                    new Date(cert.endDate || cert.dateIssued).toLocaleDateString('tr-TR')
                  )}
                </td>
                <td className="px-6 py-4"><CertificateStatus status={cert.status} cert={cert} /></td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {cert.uiaRequired ? (
                    <span title={t('institution.certificates.uia.requiredTitle')} className="inline-flex items-center text-emerald-600">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm4.28 7.22a.75.75 0 0 0-1.06-1.06l-4.72 4.72-1.72-1.72a.75.75 0 1 0-1.06 1.06l2.25 2.25c.3.3.79.3 1.09 0l5.22-5.25Z" clipRule="evenodd" /></svg>
                      <span className="sr-only">{t('institution.certificates.uia.yes')}</span>
                    </span>
                  ) : (
                    <span title={t('institution.certificates.uia.notRequiredTitle')} className="inline-flex items-center text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Z" /><path d="M9 9l6 6M15 9l-6 6" className="text-white" /></svg>
                      <span className="sr-only">{t('common.no')}</span>
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">{cert.studentCount}</td>
                <td className="px-6 py-4">
                  <button onClick={() => openStudentModal(cert)} className="text-[#0945A5] hover:underline">{t('institution.certificates.actions.view')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Training Modal (placeholder) */}
      {addTrainingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">{t('institution.certificates.modal.addTraining')}</h3>
              <button onClick={() => setAddTrainingOpen(false)} className="text-gray-500">✕</button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t('institution.certificates.addTrainingModal.trainingNameLabel')}</label>
                <input className="input w-full" placeholder={t('institution.certificates.addTrainingModal.trainingNamePlaceholder')} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t('institution.certificates.addTrainingModal.descriptionLabel')}</label>
                <textarea className="input w-full" rows={3} placeholder={t('institution.certificates.addTrainingModal.descriptionPlaceholder')} />
              </div>
              <div className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                {t('institution.certificates.modal.pendingNote')}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setAddTrainingOpen(false)} className="btn-secondary">{t('institution.certificates.addTrainingModal.cancel')}</button>
              <button disabled className="btn-primary opacity-60 cursor-not-allowed">{t('institution.certificates.addTrainingModal.submitSoon')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Student List Modal - Full Screen */}
      {studentModal.open && studentModal.cert && (
        <div className="fixed inset-0 z-50 bg-white overflow-auto">
          <div className="min-h-screen">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
              <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{t('institution.certificates.studentsModal.title')}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="font-mono text-sm text-gray-500">{studentModal.cert.publicId}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-700">{studentModal.cert.trainingName}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-500">{studentModal.cert.studentCount} Öğrenci</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={bulkDownload}
                      disabled={bulkDownloadLoading}
                      className="btn-primary flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {bulkDownloadLoading ? (
                        <>
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {t('institution.certificates.actions.downloadingBulk') || 'İndiriliyor...'}
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          {t('institution.certificates.actions.downloadBulk')}
                        </>
                      )}
                    </button>
                    <button
                      onClick={closeStudentModal}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-6">
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left text-gray-700">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase sticky top-0">
                    <tr>
                      <th className="px-6 py-3">{t('institution.certificates.studentsModal.table.index')}</th>
                      <th className="px-6 py-3">{t('institution.certificates.studentsModal.table.fullName')}</th>
                      <th className="px-6 py-3">{t('institution.certificates.studentsModal.table.nationalId')}</th>
                      {/* <th className="px-6 py-3">E-posta</th> */}
                      <th className="px-6 py-3">{t('institution.certificates.studentsModal.table.birthDate')}</th>
                      <th className="px-6 py-3">{t('institution.certificates.studentsModal.table.trainingName')}</th>
                      <th className="px-6 py-3">{t('institution.certificates.studentsModal.table.trainingDate')}</th>
                      <th className="px-6 py-3 text-center">{t('institution.certificates.studentsModal.table.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingStudents ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          <div className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {t('institution.certificates.studentsModal.loading')}
                          </div>
                        </td>
                      </tr>
                    ) : modalStudents.length > 0 ? (
                      modalStudents.map((student, index) => (
                        <tr key={student.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                          <td className="px-6 py-4 font-medium text-gray-800">
                            {student.firstName} {student.lastName}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs">{student.nationalId}</td>
                          <td className="px-6 py-4 text-gray-600">
                            {student.birthDate ? new Date(student.birthDate).toLocaleDateString('tr-TR') : '-'}
                          </td>
                          <td className="px-6 py-4 text-gray-600">{studentModal.cert?.trainingName}</td>
                          <td className="px-6 py-4 text-gray-600">
                            {studentModal.cert?.dateIssued ? new Date(studentModal.cert.dateIssued).toLocaleDateString('tr-TR') : '-'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <a
                                href={`/institution/certificates/${studentModal.cert?.id}/view?studentId=${student.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={t('institution.certificates.actions.view')}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                  <path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 110-10 5 5 0 010 10zm0-2a3 3 0 100-6 3 3 0 000 6z" />
                                </svg>
                              </a>
                              <button
                                onClick={() => downloadSingleCertificate(student.id, `${student.firstName}-${student.lastName}`)}
                                disabled={downloadingCert === student.id}
                                title={t('institution.certificates.actions.downloadSingle')}
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {downloadingCert === student.id ? (
                                  <>
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    İndiriliyor...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    PDF
                                  </>
                                )}
                              </button>
                              {student.email ? (
                                <button
                                  onClick={() => sendEmailToStudent(student.id)}
                                  disabled={sendingEmailTo === student.id}
                                  title={t('institution.certificates.actions.sendEmail')}
                                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {sendingEmailTo === student.id ? (
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                  )}
                                  {t('institution.certificates.actions.sendEmail')}
                                </button>
                              ) : (
                                <span
                                  title={t('institution.certificates.email.noEmail')}
                                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-100 text-gray-400 text-sm font-medium cursor-not-allowed"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  {t('institution.certificates.actions.sendEmail')}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          Öğrenci bulunamadı
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Loading Overlay for Bulk Download */}
      {bulkDownloadLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <svg className="animate-spin h-16 w-16 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {t('institution.certificates.loading.downloadingBulk') || 'PDF\'ler Hazırlanıyor'}
            </h3>
            <p className="text-gray-600 mb-4">
              {t('institution.certificates.loading.downloadingBulkDesc') || 'Tüm sertifikalar ZIP olarak indiriliyor. Bu işlem birkaç dakika sürebilir, lütfen bekleyin...'}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full animate-pulse" style={{ width: '70%' }}></div>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              {studentModal.cert?.studentCount || 0} öğrenci için sertifikalar oluşturuluyor...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
