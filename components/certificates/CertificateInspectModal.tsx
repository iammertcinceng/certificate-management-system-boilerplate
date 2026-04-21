"use client";

import { useState, memo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Loader from '@/components/ui/Loader';

type Student = {
    id: string;
    firstName: string;
    lastName: string;
    nationalId: string;
    email?: string;
    phone?: string;
    birthDate?: string;
};

type Partner = {
    userId?: string;
    name?: string;
    publicId?: string;
    logo?: string;
};

type CertificateDetails = {
    id: string;
    publicId: string;
    trainingName: string;
    dateIssued: string;
    status: string;
    uiaRequired?: boolean;
    upperInstitutionRequired?: boolean;
    partners?: Partner[];
    studentCount?: number;
};

type ApprovalItem = {
    id: string;
    publicId: string;
    trainingName: string;
    status: 'pending' | 'approved' | 'rejected' | 'archived';
};

interface CertificateInspectModalProps {
    isOpen: boolean;
    onClose: () => void;
    item?: ApprovalItem;
    isHistory?: boolean;
    details: CertificateDetails | null;
    students: Student[];
    loading: boolean;
    onResubmit?: (id: string) => void;
    submitting?: boolean;
    title: string;
}

const getStatusText = (status: string, t: (key: string) => string): string => {
    const statusMap: Record<string, string> = {
        'pending': t('institution.certificates.approvals.status.pending'),
        'approved': t('institution.certificates.approvals.status.approved'),
        'rejected': t('institution.certificates.approvals.status.rejected'),
    };
    return statusMap[status] || status;
};

function CertificateInspectModalBase({
    isOpen,
    onClose,
    item,
    isHistory = false,
    details,
    students,
    loading,
    onResubmit,
    submitting = false,
    title
}: CertificateInspectModalProps) {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'details' | 'students'>('details');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-[900px] max-w-[95vw] min-h-[400px] max-h-[85vh] h-auto rounded-2xl bg-white shadow-2xl overflow-hidden border border-[var(--border)] flex flex-col">
                {/* Header - Theme gradient */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)] bg-gradient-to-r from-[var(--primary)]/5 via-[var(--primary-light)]/5 to-[var(--secondary)]/5">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold gradient-text">{title} • {t('institution.certificates.approvals.inspect.title')}</h3>
                        {item && (
                            <div className="flex items-center gap-3 mt-2">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-semibold font-mono">
                                    {item.publicId}
                                </span>
                                <span className="text-sm text-[var(--muted-foreground)] truncate">{item.trainingName}</span>
                                {isHistory && item.status && (
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${item.status === 'approved'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-red-100 text-red-700'
                                        }`}>
                                        {item.status === 'approved' ? (
                                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                        {getStatusText(item.status, t)}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-4 p-2.5 rounded-xl hover:bg-[var(--muted)] transition-all duration-200 text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer group"
                        title={t('common.close')}
                    >
                        <svg className="w-5 h-5 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-6 border-b border-[var(--border)] bg-white">
                    <nav className="flex gap-1">
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`relative py-3.5 px-4 text-sm font-medium transition-all duration-200 cursor-pointer rounded-t-lg ${activeTab === 'details'
                                ? 'text-[var(--primary)] bg-[var(--primary)]/5'
                                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]'
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {t('institution.certificates.approvals.inspect.tabs.details')}
                            </span>
                            {activeTab === 'details' && (
                                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)]" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('students')}
                            className={`relative py-3.5 px-4 text-sm font-medium transition-all duration-200 cursor-pointer rounded-t-lg ${activeTab === 'students'
                                ? 'text-[var(--primary)] bg-[var(--primary)]/5'
                                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]'
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                {t('institution.certificates.approvals.inspect.tabs.students')}
                                {students.length > 0 && (
                                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                                        {students.length}
                                    </span>
                                )}
                            </span>
                            {activeTab === 'students' && (
                                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)]" />
                            )}
                        </button>
                    </nav>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                    {loading ? (
                        <div className="flex-1 min-h-[300px] flex items-center justify-center">
                            <Loader />
                        </div>
                    ) : activeTab === 'details' ? (
                        <div className="flex-1 overflow-y-auto p-6 pb-24">
                            {details ? (
                                <div className="space-y-4">
                                    {/* Info Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <DetailCard
                                            label={t('institution.certificates.approvals.inspect.details.certificateNo')}
                                            value={details.publicId}
                                            icon={
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                            }
                                            highlight
                                        />
                                        <DetailCard
                                            label={t('institution.certificates.approvals.inspect.details.training')}
                                            value={details.trainingName}
                                            icon={
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                </svg>
                                            }
                                        />
                                        <DetailCard
                                            label={t('institution.certificates.approvals.inspect.details.issueDate')}
                                            value={new Date(details.dateIssued).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                            icon={
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            }
                                        />
                                        <DetailCard
                                            label={t('institution.certificates.approvals.inspect.details.status')}
                                            value={getStatusText(details.status, t)}
                                            icon={
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            }
                                            statusColor={
                                                details.status === 'approved' ? 'success' :
                                                    details.status === 'rejected' ? 'danger' : 'warning'
                                            }
                                        />
                                    </div>

                                    {/* UIA Status */}
                                    <div className={`flex items-center gap-4 p-4 rounded-xl border ${details.uiaRequired || details.upperInstitutionRequired
                                        ? 'bg-[var(--secondary)]/5 border-[var(--secondary)]/20'
                                        : 'bg-[var(--muted)] border-[var(--border)]'
                                        }`}>
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${details.uiaRequired || details.upperInstitutionRequired
                                            ? 'bg-[var(--secondary)]/10 text-[var(--secondary)]'
                                            : 'bg-gray-200 text-gray-500'
                                            }`}>
                                            {details.uiaRequired || details.upperInstitutionRequired ? (
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-[var(--foreground)]">{t('common.uia')}</p>
                                            <p className={`text-sm font-semibold ${details.uiaRequired || details.upperInstitutionRequired
                                                ? 'text-[var(--secondary)]'
                                                : 'text-[var(--muted-foreground)]'
                                                }`}>
                                                {details.uiaRequired || details.upperInstitutionRequired
                                                    ? t('institution.certificates.approvals.inspect.details.uiaRequired')
                                                    : t('institution.certificates.approvals.inspect.details.uiaNotRequired')
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    {/* Partners */}
                                    {details.partners && details.partners.length > 0 && (
                                        <div className="p-4 rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5">
                                            <h4 className="text-sm font-semibold text-[var(--primary)] mb-3 flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                                {t('institution.certificates.approvals.inspect.details.partners')}
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {details.partners.map((p, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[var(--primary)]/20 text-sm font-medium text-[var(--foreground)]"
                                                    >
                                                        {p.logo ? (
                                                            <img src={p.logo} alt="" className="w-5 h-5 rounded object-contain" />
                                                        ) : (
                                                            <span className="w-5 h-5 rounded bg-[var(--primary)]/10 flex items-center justify-center text-xs font-bold text-[var(--primary)]">
                                                                {(p.name || '?').charAt(0).toUpperCase()}
                                                            </span>
                                                        )}
                                                        {p.name || '-'}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-[var(--muted-foreground)]">
                                    <svg className="w-16 h-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-sm font-medium">{t('institution.certificates.approvals.inspect.details.notFound')}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto pb-24">
                            {students.length > 0 ? (
                                <table className="w-full text-sm">
                                    <thead className="bg-gradient-to-r from-[var(--muted)] to-[var(--cream-light)] sticky top-0 z-10">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider">
                                                {t('institution.certificates.approvals.inspect.students.student')}
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider">
                                                {t('institution.certificates.approvals.inspect.students.tc')}
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider">
                                                {t('institution.certificates.approvals.inspect.students.email')}
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider">
                                                {t('institution.certificates.approvals.inspect.students.phone')}
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider">
                                                {t('institution.certificates.approvals.inspect.students.birthDate')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border)]">
                                        {students.map((s, idx) => (
                                            <tr
                                                key={s.id}
                                                className={`hover:bg-[var(--primary)]/5 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-[var(--muted)]/30'}`}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center text-white text-xs font-bold">
                                                            {s.firstName?.charAt(0)}{s.lastName?.charAt(0)}
                                                        </span>
                                                        <span className="font-medium text-[var(--foreground)]">{s.firstName} {s.lastName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-mono text-xs px-2 py-1 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">
                                                        {s.nationalId}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-[var(--muted-foreground)]">{s.email || '-'}</td>
                                                <td className="px-6 py-4 text-[var(--muted-foreground)]">{s.phone || '-'}</td>
                                                <td className="px-6 py-4 text-[var(--muted-foreground)] whitespace-nowrap">
                                                    {s.birthDate ? new Date(s.birthDate).toLocaleDateString('tr-TR') : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-[var(--muted-foreground)]">
                                    <svg className="w-20 h-20 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    <p className="text-sm font-medium">{t('institution.certificates.approvals.inspect.students.notFound')}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {isHistory && item?.status === 'rejected' && onResubmit && (
                    <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/50 flex justify-end gap-3">
                        <button onClick={onClose} className="btn-secondary">
                            {t('common.close')}
                        </button>
                        <button
                            disabled={submitting}
                            onClick={() => onResubmit(item.id)}
                            className="btn-primary disabled:opacity-50"
                        >
                            {t('institution.certificates.approvals.actions.resubmit')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper component for detail cards
function DetailCard({
    label,
    value,
    icon,
    highlight = false,
    statusColor
}: {
    label: string;
    value: string;
    icon: React.ReactNode;
    highlight?: boolean;
    statusColor?: 'success' | 'danger' | 'warning';
}) {
    const getStatusStyles = () => {
        switch (statusColor) {
            case 'success': return 'text-emerald-600';
            case 'danger': return 'text-red-600';
            case 'warning': return 'text-amber-600';
            default: return 'text-[var(--foreground)]';
        }
    };

    return (
        <div className={`flex items-start gap-4 p-4 rounded-xl border transition-all hover:shadow-sm ${highlight
            ? 'bg-gradient-to-br from-[var(--primary)]/5 to-[var(--primary-light)]/5 border-[var(--primary)]/20'
            : 'bg-white border-[var(--border)]'
            }`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${highlight
                ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                }`}>
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">{label}</p>
                <p className={`text-sm font-semibold mt-0.5 truncate ${statusColor ? getStatusStyles() : (highlight ? 'text-[var(--primary)]' : 'text-[var(--foreground)]')}`}>
                    {value}
                </p>
            </div>
        </div>
    );
}

// Memoize the component to prevent unnecessary re-renders
const CertificateInspectModal = memo(CertificateInspectModalBase);
export default CertificateInspectModal;
