"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import PetitionDownloadButton from '@/components/petition/PetitionDownloadButton';
import Loader from '@/components/ui/Loader';

type CertificateStatus = 'pending' | 'approved' | 'rejected';

type ApprovalItem = {
  id: string;
  trainingName: string;
  institution: string;
  date: string;
  uiaRequired: boolean;
  uiaResponsible: boolean;
  hasExcel: boolean;
  status: CertificateStatus;
  totalStudents: number;
  completedUiaCodes: number;
};

type Student = {
  id: string;
  publicId: string;
  nationalId: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  email?: string | null;
  phone?: string | null;
  approvalCode?: string | null;
};

type CertificateDetails = {
  id: string;
  trainingName: string;
  institution: string;
  templateKey: string;
  dateIssued: string;
  partnerIds: string[];
  students: Student[];
  status: CertificateStatus;
  hasExcel: boolean;
  totalHours?: number | null;
};

export default function ApprovalsPage() {
  const { t } = useLanguage();
  const [onlyResponsible, setOnlyResponsible] = useState(false);
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [orgName, setOrgName] = useState<string>('');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedCert, setSelectedCert] = useState<CertificateDetails | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'students' | 'excel'>('details');
  const [approvalCodes, setUiaCodes] = useState<Record<string, string>>({});
  const [excelFile, setExcelFile] = useState<File | null>(null);

  // Load approvals list
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/approvals', { cache: 'no-store' });
        const data = await res.json();
        setItems(data.items || []);
      } catch {
        setItems([]);
      }
      setLoading(false);
    };
    load();
  }, []);

  // Load current partner organization name for PDF header
  useEffect(() => {
    const loadOrg = async () => {
      try {
        const res = await fetch('/api/organization', { cache: 'no-store' });
        const data = await res.json();
        const name = data?.organization?.name || data?.name || '';
        setOrgName(name);
      } catch { }
    };
    loadOrg();
  }, []);

  // Filter logic
  const filtered = useMemo(() => {
    let data = [...items];
    if (query.trim()) {
      const q = query.toLowerCase();
      data = data.filter(d =>
        d.id.toLowerCase().includes(q) ||
        d.trainingName.toLowerCase().includes(q) ||
        d.institution.toLowerCase().includes(q)
      );
    }
    if (onlyResponsible) data = data.filter(d => d.uiaResponsible);
    return data;
  }, [items, onlyResponsible, query]);

  // Open modal and load certificate details
  const openModal = async (certId: string) => {
    setModalOpen(true);
    setModalLoading(true);
    setActiveTab('details');

    try {
      console.log('Fetching certificate details for:', certId);
      const res = await fetch(`/api/certificates/${certId}/details`, { cache: 'no-store' });
      const data = await res.json();
      console.log('Certificate data received:', data);

      if (!res.ok) {
        console.error('API error:', data);
        setSelectedCert(null);
        setModalLoading(false);
        return;
      }

      setSelectedCert(data.certificate);
      console.log('Students count:', data.certificate?.students?.length || 0);

      const codes: Record<string, string> = {};
      if (data.certificate?.students) {
        data.certificate.students.forEach((s: Student) => {
          if (s.approvalCode) codes[s.id] = s.approvalCode;
        });
      }
      setUiaCodes(codes);
    } catch (err) {
      console.error('Failed to load certificate details:', err);
      setSelectedCert(null);
    }

    setModalLoading(false);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedCert(null);
    setUiaCodes({});
    setExcelFile(null);
    setActiveTab('details');
  };

  const handleCodeChange = (studentId: string, code: string) => {
    setUiaCodes(prev => ({ ...prev, [studentId]: code }));
  };

  const saveUiaCodes = async () => {
    if (!selectedCert) return;

    try {
      const items = Object.entries(approvalCodes)
        .filter(([, code]) => code && code.trim())
        .map(([studentId, approvalCode]) => ({ studentId, approvalCode: approvalCode.trim() }));

      await fetch('/api/approvals/uia-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificateId: selectedCert.id, codes: items })
      });

      alert(t('acreditor.approvals.messages.approvalCodesSaved'));
      const res = await fetch('/api/approvals', { cache: 'no-store' });
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      alert(t('acreditor.approvals.messages.approvalCodesSaveError'));
    }
  };

  const downloadExcel = async () => {
    if (!selectedCert) return;

    try {
      const res = await fetch(`/api/certificates/${selectedCert.id}/export-excel`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedCert.id}_approval_codes.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(t('acreditor.approvals.messages.excelDownloadError'));
    }
  };

  const uploadExcel = async () => {
    if (!excelFile || !selectedCert) return;

    const formData = new FormData();
    formData.append('file', excelFile);
    formData.append('certificateId', selectedCert.id);

    try {
      const res = await fetch('/api/approvals/uia-codes/upload', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        alert(t('acreditor.approvals.messages.approvalCodesUploaded'));
        setExcelFile(null);
        const listRes = await fetch('/api/approvals', { cache: 'no-store' });
        const data = await listRes.json();
        setItems(data.items || []);
        closeModal();
      } else {
        alert(t('acreditor.approvals.messages.excelUploadError'));
      }
    } catch (err) {
      alert(t('acreditor.approvals.messages.excelUploadErrorUnknown'));
    }
  };

  const approveCertificate = async () => {
    if (!selectedCert) return;

    const item = items.find(i => i.id === selectedCert.id);
    if (!item) return;

    if (item.uiaResponsible && item.completedUiaCodes < item.totalStudents) {
      const confirm = window.confirm(
        `UIA kodları tamamlanmadı (${item.completedUiaCodes}/${item.totalStudents}). Yine de onaylamak istiyor musunuz?`
      );
      if (!confirm) return;
    }

    try {
      await fetch('/api/approvals/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificateId: selectedCert.id })
      });

      alert(t('acreditor.approvals.messages.certificateApproved'));
      const res = await fetch('/api/approvals', { cache: 'no-store' });
      const data = await res.json();
      setItems(data.items || []);
      closeModal();
    } catch (err) {
      alert(t('common.error'));
    }
  };

  const rejectCertificate = async () => {
    if (!selectedCert) return;

    try {
      await fetch('/api/approvals/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificateId: selectedCert.id })
      });

      alert(t('acreditor.approvals.messages.certificateRejected'));
      const res = await fetch('/api/approvals', { cache: 'no-store' });
      const data = await res.json();
      setItems(data.items || []);
      closeModal();
    } catch (err) {
      alert(t('common.error'));
    }
  };

  // (moved PDF generator into component PetitionDownloadButton)

  const getEyeIconColor = (item: ApprovalItem) => {
    if (item.status === 'approved') return 'text-green-600';
    if (item.status === 'rejected') return 'text-red-600';
    if (!item.uiaResponsible) return 'text-gray-600';
    if (item.completedUiaCodes < item.totalStudents) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">{t('acreditor.approvals.title')}</h1>
          <p className="text-gray-600 mt-2">{t('acreditor.approvals.subtitle')}</p>
        </div>
        <Link href="/acreditor" className="btn-secondary">{t('nav.dashboard')}</Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 gap-3">
          <div className="relative w-full md:w-80">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              type="text"
              placeholder={t('acreditor.approvals.searchPlaceholder')}
              className="input w-full pr-10 p-3 rounded-lg"
            />
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 104.473 8.746l2.64 2.64a.75.75 0 101.06-1.06l-2.64-2.64A5.5 5.5 0 009 3.5zm-4 5.5a4 4 0 118 0 4 4 0 01-8 0z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            className="accent-[#0945A5] w-4 h-4"
            checked={onlyResponsible}
            onChange={e => setOnlyResponsible(e.target.checked)}
          />
          {t('acreditor.approvals.onlyResponsible')}
        </label>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3 whitespace-nowrap">{t('acreditor.approvals.table.certificateId')}</th>
              <th className="px-6 py-3">{t('acreditor.approvals.table.training')}</th>
              <th className="px-6 py-3">{t('acreditor.approvals.table.institution')}</th>
              <th className="px-6 py-3">{t('acreditor.approvals.table.date')}</th>
              <th className="px-6 py-3 whitespace-nowrap">{t('acreditor.approvals.table.uia')}</th>
              <th className="px-6 py-3 text-center">{t('common.status.active')}</th>
              <th className="px-6 py-3 text-center">{t('acreditor.approvals.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-6 py-10 text-center text-gray-500" colSpan={7}>
                  <Loader />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-6 py-10 text-center text-gray-500" colSpan={7}>
                  Aramanızla eşleşen sertifika bulunamadı.
                </td>
              </tr>
            ) : filtered.map(item => (
              <tr
                key={item.id}
                className={`border-b border-gray-200 ${item.uiaResponsible ? 'bg-indigo-50/30' : 'hover:bg-gray-50'} transition-colors`}
              >
                <td className="px-6 py-4 font-mono text-xs text-gray-500 whitespace-nowrap">{item.id}</td>
                <td className="px-6 py-4 font-medium text-gray-800">{item.trainingName}</td>
                <td className="px-6 py-4">{item.institution}</td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(item.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.uiaRequired ? (
                    item.uiaResponsible ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                          {t('acreditor.approvals.uia.responsible')}
                        </span>
                        <span className="text-xs text-gray-600">
                          {item.completedUiaCodes}/{item.totalStudents}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                        {t('acreditor.approvals.uia.exists')}
                      </span>
                    )
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                      {t('acreditor.approvals.uia.none')}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  {item.status === 'approved' ? (
                    <span className="inline-flex items-center gap-1 text-green-600 font-medium text-xs">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {t('acreditor.approvals.filter.approved')}
                    </span>
                  ) : item.status === 'rejected' ? (
                    <span className="inline-flex items-center gap-1 text-red-600 font-medium text-xs">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      {t('acreditor.approvals.filter.rejected')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-yellow-600 font-medium text-xs">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      {t('acreditor.approvals.filter.pending')}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => openModal(item.id)}
                    className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${getEyeIconColor(item)}`}
                    title={t('acreditor.approvals.actions.inspect')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M10.5 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm0 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm0 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" clipRule="evenodd" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-5xl max-h-[90vh] rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{t('acreditor.approvals.inspect.title')}</h2>
                {selectedCert && (
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedCert.trainingName} • {selectedCert.institution}
                  </p>
                )}
              </div>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-white/50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {modalLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : selectedCert ? (
              <>
                {/* Tabs */}
                <div className="border-b border-gray-200 bg-gray-50">
                  <nav className="flex px-6">
                    <button
                      onClick={() => setActiveTab('details')}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-800'
                        }`}
                    >
                      📋 {t('acreditor.approvals.inspect.tabs.details')}
                    </button>
                    {items.find(i => i.id === selectedCert.id)?.uiaResponsible && (
                      <button
                        onClick={() => setActiveTab('students')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'students'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-600 hover:text-gray-800'
                          }`}
                      >
                        👥 {t('acreditor.approvals.inspect.tabs.students')}
                      </button>
                    )}
                    {items.find(i => i.id === selectedCert.id)?.uiaResponsible &&
                      items.find(i => i.id === selectedCert.id)?.hasExcel && (
                        <button
                          onClick={() => setActiveTab('excel')}
                          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'excel'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-600 hover:text-gray-800'
                            }`}
                        >
                          📊 {t('acreditor.approvals.inspect.tabs.excel')}
                        </button>
                      )}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {/* Details Tab */}
                  {activeTab === 'details' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">{t('acreditor.approvals.inspect.fields.certificateId')}</p>
                          <p className="font-mono text-sm font-semibold">{selectedCert.id}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">{t('acreditor.approvals.table.training')}</p>
                          <p className="text-sm font-semibold">{selectedCert.trainingName}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">{t('acreditor.approvals.table.institution')}</p>
                          <p className="text-sm font-semibold">{selectedCert.institution}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">{t('acreditor.approvals.inspect.fields.issueDate')}</p>
                          <p className="text-sm font-semibold">
                            {new Date(selectedCert.dateIssued).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">{t('acreditor.approvals.inspect.fields.template')}</p>
                          <p className="text-sm font-semibold">{selectedCert.templateKey}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">{t('acreditor.approvals.inspect.fields.studentCount')}</p>
                          <p className="text-sm font-semibold">{selectedCert.students.length}</p>
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Partner Bilgileri</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedCert.partnerIds.map(pid => (
                            <span key={pid} className="px-3 py-1 bg-white rounded-full text-sm font-mono">
                              {pid}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Students Tab */}
                  {activeTab === 'students' && (
                    <div className="space-y-4">
                      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                        <p className="text-sm text-yellow-800">{t('acreditor.approvals.inspect.students.note')}</p>
                      </div>

                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                            <tr>
                              <th className="px-4 py-3 text-left">{t('acreditor.approvals.inspect.students.cols.student')}</th>
                              <th className="px-4 py-3 text-left">{t('acreditor.approvals.inspect.students.cols.tc')}</th>
                              <th className="px-4 py-3 text-left">{t('acreditor.approvals.inspect.students.cols.birthDate')}</th>
                              <th className="px-4 py-3 text-left">{t('acreditor.approvals.inspect.students.cols.approvalCode')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedCert.students.map(student => (
                              <tr key={student.id} className="border-t border-gray-200 hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-800">
                                  {student.firstName} {student.lastName}
                                </td>
                                <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                                  {student.nationalId}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                  {new Date(student.birthDate).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3">
                                  <input
                                    type="text"
                                    value={approvalCodes[student.id] || ''}
                                    onChange={(e) => handleCodeChange(student.id, e.target.value)}
                                    placeholder={t('acreditor.approvals.inspect.students.placeholder.approvalCode')}
                                    className="input w-full text-sm"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <button
                        onClick={saveUiaCodes}
                        className="btn-primary w-full"
                      >
                        💾 {t('acreditor.approvals.inspect.students.actions.saveCodes')}
                      </button>
                    </div>
                  )}

                  {/* Excel Tab */}
                  {activeTab === 'excel' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                        <h3 className="font-semibold text-blue-900 mb-2">📊 {t('acreditor.approvals.inspect.excel.title')}</h3>
                        <p className="text-sm text-blue-800">
                          Mevcut sertifika verilerini içeren Excel dosyasını indirin, sadece UIA_CODE sütununu doldurun ve yükleyin.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg">
                          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-700 font-bold">1</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{t('acreditor.approvals.inspect.excel.step1.title')}</p>
                            <p className="text-sm text-gray-600">{t('acreditor.approvals.inspect.excel.step1.desc')}</p>
                          </div>
                          <button
                            onClick={downloadExcel}
                            className="btn-secondary flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {t('acreditor.approvals.inspect.excel.actions.download')}
                          </button>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg">
                          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-700 font-bold">2</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{t('acreditor.approvals.inspect.excel.step2.title')}</p>
                            <p className="text-sm text-gray-600">{t('acreditor.approvals.inspect.excel.step2.desc')}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg">
                          <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-purple-700 font-bold">3</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{t('acreditor.approvals.inspect.excel.step3.title')}</p>
                            <div className="mt-2">
                              <input
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                                className="block w-full text-sm text-gray-500
                                  file:mr-4 file:py-2 file:px-4
                                  file:rounded-lg file:border-0
                                  file:text-sm file:font-semibold
                                  file:bg-blue-50 file:text-blue-700
                                  hover:file:bg-blue-100"
                              />
                            </div>
                          </div>
                        </div>

                        {excelFile && (
                          <button
                            onClick={uploadExcel}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            {t('acreditor.approvals.inspect.excel.actions.upload')}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between gap-3 px-6 py-4 border-t bg-gray-50">
                  <button
                    onClick={closeModal}
                    className="btn-secondary"
                  >
                    {t('common.cancel')}
                  </button>
                  <div className="flex-1 flex items-center justify-center">
                    {selectedCert && (
                      <PetitionDownloadButton
                        cert={{
                          id: selectedCert.id,
                          trainingName: selectedCert.trainingName,
                          dateIssued: selectedCert.dateIssued,
                          totalHours: selectedCert.totalHours ?? null,
                          students: selectedCert.students.map(s => ({
                            id: s.id,
                            nationalId: s.nationalId,
                            firstName: s.firstName,
                            lastName: s.lastName,
                            birthDate: s.birthDate,
                          }))
                        }}
                        orgName={orgName}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={rejectCertificate}
                      className="px-4 py-2 rounded-lg border border-red-300 bg-white text-red-700 hover:bg-red-50 font-medium transition-colors"
                    >
                      ❌ {t('acreditor.approvals.actions.reject')}
                    </button>
                    <button
                      onClick={approveCertificate}
                      className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium transition-colors"
                    >
                      ✅ {t('acreditor.approvals.actions.approve')}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-6 text-center text-gray-500">
                Sertifika detayları yüklenemedi.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}