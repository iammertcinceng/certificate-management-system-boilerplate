"use client";
import { useMemo, useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Loading from '@/components/Loading';
import { getStudentDisplayName, getStudentSearchableText, hasAlternativeSurname, type LastNameDisplay } from '@/utils/studentName';
import { downloadCertificatePdf } from '@/utils/certificateDownload';
import Loader from '@/components/ui/Loader';

type Student = {
  id: string;
  publicId: string;
  nationalId: string;
  firstName: string;
  lastName: string;
  otherLastName?: string | null;
  lastNameDisplay?: LastNameDisplay | null;
  email: string | null;
  phone: string | null;
  birthDate: string;
  createdAt: string;
  certificateCount?: number;
};

export default function StudentsPage() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'id' | 'date_desc' | 'cert_desc' | 'name_az'>('id');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editModal, setEditModal] = useState<{ open: boolean; student?: Student }>({ open: false });
  const [certModal, setCertModal] = useState<{ open: boolean; student?: Student }>({ open: false });
  const [studentCerts, setStudentCerts] = useState<any[]>([]);
  const [loadingCerts, setLoadingCerts] = useState(false);
  const [downloadingCert, setDownloadingCert] = useState<string | null>(null);
  const [sendingEmailTo, setSendingEmailTo] = useState<string | null>(null); // certificateId
  // Student ID selection mode for bulk copy
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // Fetch students from API
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/students');
      if (res.ok) {
        const data = await res.json();
        const base: Student[] = data.students || [];
        setStudents(base);
        // Load certificate counts per student
        loadCertificateCounts(base);
      } else {
        console.error('Failed to fetch students');
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (student: Student) => {
    setEditModal({ open: true, student });
  };

  const closeEditModal = () => {
    setEditModal({ open: false });
  };

  const updateStudent = async (payload: {
    id: string;
    nationalId?: string;
    firstName?: string;
    lastName?: string;
    otherLastName?: string | null;
    lastNameDisplay?: LastNameDisplay;
    birthDate?: string;
    email?: string | null;
    phone?: string | null
  }) => {
    try {
      const res = await fetch('/api/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await fetchStudents();
        setEditModal({ open: false });
      } else {
        const error = await res.json().catch(() => ({}));
        alert(`${t('common.error')}: ${error.error || t('institution.students.errors.cannotUpdate')}`);
      }
    } catch (err) {
      console.error('Error updating student:', err);
      alert(t('institution.students.errors.updateError'));
    }
  };

  const loadCertificateCounts = async (list: Student[]) => {
    try {
      const results = await Promise.all(
        list.map(async (s) => {
          try {
            const r = await fetch(`/api/students/${s.id}/certificates`);
            if (r.ok) {
              const d = await r.json();
              return { id: s.id, count: (d.certificates || []).length };
            }
          } catch { }
          return { id: s.id, count: 0 };
        })
      );
      const counts = new Map(results.map((x) => [x.id, x.count]));
      setStudents((prev) => prev.map((s) => ({ ...s, certificateCount: counts.get(s.id) ?? s.certificateCount ?? 0 })));
    } catch (e) {
      console.warn('Certificate counts could not be fully loaded');
    }
  };

  const filtered = useMemo(() => {
    let data = [...students];
    if (query.trim()) {
      const q = query.toLowerCase();
      // Search in all name fields (firstName, lastName, otherLastName) plus email, publicId, nationalId, phone
      data = data.filter(s => {
        const searchableText = getStudentSearchableText(s);
        return searchableText.includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.publicId.toLowerCase().includes(q) ||
          s.nationalId.includes(q) ||
          s.phone?.replace(/\s/g, '').includes(q.replace(/\s/g, ''));
      });
    }
    switch (sort) {
      case 'date_desc':
        data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'name_az':
        // Sort by display name for consistency
        data.sort((a, b) => getStudentDisplayName(a).localeCompare(getStudentDisplayName(b)));
        break;
      case 'id':
      default:
        data.sort((a, b) => a.publicId.localeCompare(b.publicId));
    }
    return data;
  }, [students, query, sort]);

  const addStudent = async (payload: { nationalId: string; firstName: string; lastName: string; otherLastName?: string; lastNameDisplay?: LastNameDisplay; birthDate: string; email?: string; phone?: string }) => {
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchStudents(); // Refresh list
        setAddOpen(false);
      } else {
        const error = await res.json();
        alert(`${t('common.error')}: ${error.error || t('institution.students.errors.cannotAdd')}`);
      }
    } catch (err) {
      console.error('Error adding student:', err);
      alert(t('institution.students.errors.addError'));
    }
  };

  const deleteStudent = async (studentId: string) => {
    if (!confirm(t('institution.students.confirmDelete'))) return;

    try {
      const res = await fetch(`/api/students?id=${studentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchStudents(); // Refresh list
      } else {
        alert(t('institution.students.errors.cannotDelete'));
      }
    } catch (err) {
      console.error('Error deleting student:', err);
      alert(t('institution.students.errors.deleteError'));
    }
  };

  const openCertModal = async (student: Student) => {
    setCertModal({ open: true, student });
    setLoadingCerts(true);
    try {
      const res = await fetch(`/api/students/${student.id}/certificates`);
      if (res.ok) {
        const data = await res.json();
        setStudentCerts(data.certificates || []);
      } else {
        setStudentCerts([]);
      }
    } catch {
      setStudentCerts([]);
    } finally {
      setLoadingCerts(false);
    }
  };

  const closeCertModal = () => {
    setCertModal({ open: false });
    setStudentCerts([]);
  };

  const downloadCertificate = async (certificateId: string, publicId: string) => {
    if (!certModal.student) return;

    setDownloadingCert(certificateId);
    try {
      const success = await downloadCertificatePdf({
        certificateId,
        studentId: certModal.student.id,
        onProgress: (msg) => console.log('PDF:', msg),
      });

      if (!success) {
        alert(t('institution.students.errors.cannotDownload'));
      }
    } catch (err) {
      console.error('Download error:', err);
      alert(t('institution.students.errors.downloadError'));
    } finally {
      setDownloadingCert(null);
    }
  };

  // Mail Gönder fonksiyonu
  const sendEmailForCertificate = async (certificateId: string) => {
    if (!certModal.student) return;

    // Öğrencinin email'i yoksa uyar
    if (!certModal.student.email) {
      alert(t('institution.certificates.email.noEmail'));
      return;
    }

    setSendingEmailTo(certificateId);

    try {
      const res = await fetch('/api/email/send-certificate-ready', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificateId: certificateId,
          studentId: certModal.student.id
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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold gradient-text">{t('institution.students.title')}</h1>
          <p className="text-gray-600 mt-2">{t('institution.students.subtitle').replace('{count}', students.length.toString())}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.href = '/institution/students/import'}
            className="btn-secondary flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {t('institution.students.bulkAdd')}
          </button>
          <button
            // + icon ekle
            onClick={() => setAddOpen(true)} className="btn-primary cursor-pointer">{t('institution.students.addNew')}</button>
        </div>
      </div>

      {/* Filtreler & Sıralama - Sertifika sayfası ile aynı tasarım */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 gap-3">
          <div className="relative w-60 md:w-72">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              type="text"
              placeholder={t('institution.students.searchPlaceholder')}
              className="input w-full pr-10 p-3 rounded-lg text-sm"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 104.473 8.746l2.64 2.64a.75.75 0 101.06-1.06l-2.64-2.64A5.5 5.5 0 009 3.5zm-4 5.5a4 4 0 118 0 4 4 0 01-8 0z" clipRule="evenodd" /></svg>
            </span>
          </div>
          {/* Selection Mode Toggle + Copy Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (selectionMode) {
                  setSelectionMode(false);
                  setSelectedStudentIds(new Set());
                } else {
                  setSelectionMode(true);
                }
              }}
              className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors flex items-center gap-2 ${selectionMode
                ? 'bg-red-50 border-red-300 text-red-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {selectionMode ? t('common.cancel') : (t('institution.students.selection.selectIds') || 'ID ' + t('common.select'))}
            </button>
            {selectionMode && selectedStudentIds.size > 0 && (
              <button
                onClick={() => {
                  const ids = Array.from(selectedStudentIds).join('\n');
                  navigator.clipboard.writeText(ids).then(() => {
                    alert((t('institution.students.selection.idsCopied') || '{count} öğrenci ID kopyalandı!').replace('{count}', selectedStudentIds.size.toString()));
                  });
                }}
                className="px-3 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {t('common.copy')} ({selectedStudentIds.size})
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{t('common.sortBy')}:</span>
          <div className="relative w-56">
            <select
              value={sort}
              onChange={e => setSort(e.target.value as 'id' | 'date_desc' | 'cert_desc' | 'name_az')}
              className="appearance-none input w-full p-3 rounded-lg pr-10 shadow-sm focus:border-[#0945A5] focus:ring-2 focus:ring-[#0945A5]/30"
            >
              <option value="id">{t('institution.students.sort.id')}</option>
              <option value="date_desc">{t('institution.students.sort.dateDesc')}</option>
              <option value="cert_desc">{t('institution.students.sort.certDesc')}</option>
              <option value="name_az">{t('institution.students.sort.nameAz')}</option>
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-700 table-fixed min-w-[1000px]">
          <thead className="text-[10px] text-gray-500 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-2 py-3 w-[90px] whitespace-nowrap">{t('institution.students.table.studentId')}</th>
              <th scope="col" className="px-2 py-3 w-[100px] whitespace-nowrap">{t('institution.students.table.tc')}</th>
              <th scope="col" className="px-2 py-3 w-[180px]">{t('institution.students.table.fullName')}</th>
              <th scope="col" className="px-2 py-3 w-[160px] whitespace-nowrap">{t('institution.students.table.email')}</th>
              <th scope="col" className="px-2 py-3 w-[110px] whitespace-nowrap">{t('institution.students.table.phone')}</th>
              <th scope="col" className="px-2 py-3 w-[90px] whitespace-nowrap">{t('institution.students.table.birthDate')}</th>
              <th scope="col" className="px-2 py-3 w-[70px] text-center" title={t('institution.students.table.certificates')}>{t('institution.students.modal.certificateCount')}</th>
              <th scope="col" className="px-2 py-3 w-[90px] whitespace-nowrap">{t('institution.students.table.createdAt')}</th>
              <th scope="col" className="px-2 py-3 w-[65px]"><span className="sr-only">{t('common.actions')}</span></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((student) => (
              <tr key={student.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                <td
                  className={`px-3 py-3 font-mono text-[11px] cursor-pointer transition-all ${selectionMode
                    ? selectedStudentIds.has(student.publicId)
                      ? 'text-emerald-700 bg-emerald-50 border-l-4 border-emerald-500'
                      : 'text-gray-500 hover:bg-emerald-50/50 border-l-4 border-transparent hover:border-emerald-200'
                    : 'text-gray-500'
                    }`}
                  onClick={() => {
                    if (selectionMode) {
                      const newSet = new Set(selectedStudentIds);
                      if (newSet.has(student.publicId)) {
                        newSet.delete(student.publicId);
                      } else {
                        newSet.add(student.publicId);
                      }
                      setSelectedStudentIds(newSet);
                    }
                  }}
                >
                  {student.publicId}
                </td>
                <td className="px-3 py-3 font-mono text-[11px] text-gray-500">{student.nationalId}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-gray-800 text-[13px] truncate max-w-[200px]" title={getStudentDisplayName(student)}>
                      {getStudentDisplayName(student)}
                    </span>
                    {hasAlternativeSurname(student) && (
                      <div className="relative group/alt">
                        <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] text-blue-600 bg-blue-50 border border-blue-200 rounded-full cursor-help hover:bg-blue-100 transition-colors">?</span>
                        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-2 -translate-y-full px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover/alt:opacity-100 group-hover/alt:visible transition-all duration-150 whitespace-nowrap z-[100] shadow-xl">
                          <span className="text-gray-400">{t('institution.students.otherLastName')}:</span> {student.otherLastName}
                          <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-3 py-3 text-[12px] text-gray-600 truncate" title={student.email || ''}>{student.email || '-'}</td>
                <td className="px-3 py-3 text-[12px] text-gray-600">{student.phone || '-'}</td>
                <td className="px-3 py-3 text-[11px] text-gray-500 whitespace-nowrap">{new Date(student.birthDate).toLocaleDateString('tr-TR')}</td>
                <td className="px-2 py-3 text-center">
                  <button
                    onClick={() => openCertModal(student)}
                    className="inline-flex items-center justify-center w-9 h-7 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors cursor-pointer"
                  >
                    <span className="text-xs font-semibold text-blue-700">{student.certificateCount || 0}</span>
                  </button>
                </td>
                <td className="px-3 py-3 text-[11px] text-gray-500 whitespace-nowrap">{new Date(student.createdAt).toLocaleDateString('tr-TR')}</td>
                <td className="px-2 py-3">
                  <div className="flex items-center gap-1 justify-center">
                    <button
                      type="button"
                      onClick={() => openEditModal(student)}
                      title={t('common.edit')}
                      className="inline-flex items-center justify-center w-7 h-7 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.25 2.25 0 113.182 3.182L7.125 19.589a4.5 4.5 0 01-1.913 1.13l-2.37.676a.75.75 0 01-.924-.924l.677-2.37a4.5 4.5 0 011.129-1.913L16.862 3.487z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteStudent(student.id)}
                      title={t('common.delete')}
                      className="inline-flex items-center justify-center w-7 h-7 rounded border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                        <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Yeni Öğrenci Ekle Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-xl rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">{t('institution.students.addNew')}</h3>
              <button onClick={() => setAddOpen(false)} className="text-gray-500">✕</button>
            </div>
            <AddStudentForm onCancel={() => setAddOpen(false)} onSubmit={addStudent} />
          </div>
        </div>
      )}

      {/* Öğrenci Düzenle Modal */}
      {editModal.open && editModal.student && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-xl rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">{t('common.edit')}</h3>
              <button onClick={closeEditModal} className="text-gray-500">✕</button>
            </div>
            <EditStudentForm
              initial={editModal.student}
              onCancel={closeEditModal}
              onSubmit={(vals) => updateStudent({ id: editModal.student!.id, ...vals })}
            />
          </div>
        </div>
      )}

      {/* Student Certificates Modal */}
      {certModal.open && certModal.student && (
        <div className="fixed inset-0 z-50 bg-white overflow-auto">
          <div className="min-h-screen">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
              <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{t('institution.students.modal.title')}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-gray-700">{getStudentDisplayName(certModal.student)}</span>
                      <span className="text-gray-400">•</span>
                      <span className="font-mono text-sm text-gray-500">{certModal.student.nationalId}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-500">{studentCerts.length} {t('institution.students.modal.certificateCount')}</span>
                    </div>
                  </div>
                  <button
                    onClick={closeCertModal}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-6">
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left text-gray-700">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="px-6 py-3">{t('institution.students.modal.certificateId')}</th>
                      <th className="px-6 py-3">{t('institution.students.modal.trainingName')}</th>
                      <th className="px-6 py-3">{t('institution.students.modal.date')}</th>
                      <th className="px-6 py-3">{t('institution.students.modal.status')}</th>
                      <th className="px-6 py-3 text-center">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingCerts ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                          <div className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {t('common.loading')}
                          </div>
                        </td>
                      </tr>
                    ) : studentCerts.length > 0 ? (
                      studentCerts.map((cert) => (
                        <tr key={cert.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-6 py-4 font-mono text-xs text-gray-500">{cert.publicId}</td>
                          <td className="px-6 py-4 font-medium text-gray-800">{cert.trainingName}</td>
                          <td className="px-6 py-4 text-gray-600">{new Date(cert.dateIssued).toLocaleDateString('tr-TR')}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${cert.status === 'approved' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' :
                              cert.status === 'pending' ? 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20' :
                                'bg-gray-500/10 text-gray-700 border-gray-500/20'
                              }`}>
                              {cert.status === 'approved' ? t('common.status.active') : cert.status === 'pending' ? t('common.status.pending') : t('common.status.rejected')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => downloadCertificate(cert.id, cert.publicId)}
                                disabled={downloadingCert === cert.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                title={t('common.downloadPdf')}
                              >
                                {downloadingCert === cert.id ? (
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
                              {certModal.student?.email ? (
                                <button
                                  onClick={() => sendEmailForCertificate(cert.id)}
                                  disabled={sendingEmailTo === cert.id}
                                  title={t('institution.certificates.actions.sendEmail')}
                                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {sendingEmailTo === cert.id ? (
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
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                          {t('institution.students.modal.noCertificates')}
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
    </div>
  );
}

function EditStudentForm({ initial, onSubmit, onCancel }: {
  initial: Student;
  onSubmit: (v: { nationalId?: string; firstName?: string; lastName?: string; otherLastName?: string | null; lastNameDisplay?: LastNameDisplay; birthDate?: string; email?: string | null; phone?: string | null }) => void;
  onCancel: () => void;
}) {
  const { t } = useLanguage();
  const [firstName, setFirstName] = useState(initial.firstName || '');
  const [lastName, setLastName] = useState(initial.lastName || '');
  const [otherLastName, setOtherLastName] = useState(initial.otherLastName || '');
  const [showOtherLastName, setShowOtherLastName] = useState(!!initial.otherLastName);

  // Checkbox states for which surnames to display
  const [showPrimary, setShowPrimary] = useState(
    initial.lastNameDisplay === 'primary' || initial.lastNameDisplay === 'both' || !initial.lastNameDisplay
  );
  const [showSecondary, setShowSecondary] = useState(
    initial.lastNameDisplay === 'secondary' || initial.lastNameDisplay === 'both'
  );

  const [email, setEmail] = useState(initial.email || '');
  const [phone, setPhone] = useState(initial.phone || '');
  const [nationalId, setTcNumber] = useState(initial.nationalId || '');
  const [birthDate, setBirthDate] = useState(initial.birthDate ? initial.birthDate.substring(0, 10) : '');

  // Uniqueness validation states
  const [validating, setValidating] = useState(false);
  const [uniqueErrors, setUniqueErrors] = useState<{ tc?: string; email?: string; phone?: string }>({});

  // Calculate lastNameDisplay from checkbox states
  const getLastNameDisplay = (): LastNameDisplay => {
    if (showPrimary && showSecondary) return 'both';
    if (showSecondary) return 'secondary';
    return 'primary';
  };

  // Validate uniqueness when TC, email or phone changes (debounced)
  // Skip validation if value hasn't changed from initial
  useEffect(() => {
    const tc = nationalId.trim();
    const em = email.trim();
    const ph = phone.trim();

    // Only validate if TC is complete (11 digits) AND something changed
    if (tc.length !== 11) {
      setUniqueErrors({});
      return;
    }

    // Check if anything changed from initial values
    const tcChanged = tc !== initial.nationalId;
    const emailChanged = em !== (initial.email || '');
    const phoneChanged = ph !== (initial.phone || '');

    if (!tcChanged && !emailChanged && !phoneChanged) {
      setUniqueErrors({});
      return;
    }

    const timeout = setTimeout(async () => {
      setValidating(true);
      try {
        const res = await fetch('/api/students/validate-tc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nationalIds: tcChanged ? [tc] : [],
            emails: emailChanged && em ? [em] : [],
            phones: phoneChanged && ph ? [ph] : []
          })
        });
        if (res.ok) {
          const data = await res.json();
          const errors: { tc?: string; email?: string; phone?: string } = {};
          if (tcChanged && data.existingTCs?.includes(tc)) {
            errors.tc = t('institution.students.errors.tcExists') || 'Bu TC numarası zaten kayıtlı.';
          }
          if (emailChanged && em && data.existingEmails?.includes(em)) {
            errors.email = t('institution.students.errors.emailExists') || 'Bu e-posta zaten kayıtlı.';
          }
          if (phoneChanged && ph && data.existingPhones?.includes(ph)) {
            errors.phone = t('institution.students.errors.phoneExists') || 'Bu telefon zaten kayıtlı.';
          }
          setUniqueErrors(errors);
        }
      } catch { }
      setValidating(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, [nationalId, email, phone, initial.nationalId, initial.email, initial.phone, t]);

  // Validation: At least one surname must be selected
  const valid = useMemo(() => {
    const hasValidName = firstName.trim().length > 1 && lastName.trim().length > 1;
    const hasValidTc = /^\d{11}$/.test(nationalId);
    const hasValidBirthDate = birthDate.trim().length > 0;
    const hasAtLeastOneSurnameSelected = showPrimary || (showOtherLastName && showSecondary && otherLastName.trim().length > 0);
    // If secondary is shown but no otherLastName entered, it's invalid
    const secondaryValid = !showSecondary || (showOtherLastName && otherLastName.trim().length > 0);
    const hasNoUniqueErrors = Object.keys(uniqueErrors).length === 0;
    const notValidating = !validating; // Don't allow submit while validating
    return hasValidName && hasValidTc && hasValidBirthDate && hasAtLeastOneSurnameSelected && secondaryValid && hasNoUniqueErrors && notValidating;
  }, [firstName, lastName, nationalId, birthDate, showPrimary, showSecondary, showOtherLastName, otherLastName, uniqueErrors, validating]);

  const handleAddOtherLastName = () => {
    setShowOtherLastName(true);
  };

  const handleRemoveOtherLastName = () => {
    setShowOtherLastName(false);
    setOtherLastName('');
    setShowSecondary(false);
    setShowPrimary(true); // Ensure at least primary is selected
  };

  // Ensure at least one checkbox is selected
  const handlePrimaryChange = (checked: boolean) => {
    if (!checked && !showSecondary) return; // Prevent unchecking if it's the only one
    setShowPrimary(checked);
  };

  const handleSecondaryChange = (checked: boolean) => {
    if (!checked && !showPrimary) return; // Prevent unchecking if it's the only one
    setShowSecondary(checked);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onSubmit({
          nationalId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          otherLastName: showOtherLastName ? otherLastName.trim() || null : null,
          lastNameDisplay: showOtherLastName ? getLastNameDisplay() : 'primary',
          birthDate,
          email: email.trim() || null,
          phone: phone.trim() || null,
        });
      }}
      className="space-y-4"
    >
      {/* Name Row - Always side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('institution.students.form.firstName')} *</label>
          <input className="input w-full py-2.5 text-sm" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder={t('institution.students.form.firstName')} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('institution.students.form.lastName')} *</label>
          <div className="flex items-center gap-2">
            <input className="input flex-1 py-2.5 text-sm" value={lastName} onChange={e => setLastName(e.target.value)} placeholder={t('institution.students.form.lastName')} />
            {showOtherLastName && (
              <label className="inline-flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={showPrimary}
                  onChange={e => handlePrimaryChange(e.target.checked)}
                  className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span>{t('institution.students.form.showOnCertificate')}</span>
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Surname Section - Reserved height */}
      <div className="min-h-[72px]">
        {!showOtherLastName ? (
          <button
            type="button"
            onClick={handleAddOtherLastName}
            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors py-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('institution.students.form.addOtherLastName')}
          </button>
        ) : (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-500">{t('institution.students.form.otherLastName')}</label>
              <button
                type="button"
                onClick={handleRemoveOtherLastName}
                className="text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                {t('common.remove')}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                className="input flex-1 py-2.5 text-sm"
                value={otherLastName}
                onChange={e => setOtherLastName(e.target.value)}
                placeholder={t('institution.students.form.otherLastNamePlaceholder')}
              />
              <label className="inline-flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={showSecondary}
                  onChange={e => handleSecondaryChange(e.target.checked)}
                  disabled={!otherLastName.trim()}
                  className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50"
                />
                <span>{t('institution.students.form.showOnCertificate')}</span>
              </label>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">{t('institution.students.form.surnameHint')}</p>
          </div>
        )}
      </div>

      {/* TC and Birth Date - Side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('institution.students.form.nationalId')} *</label>
          <input
            maxLength={11}
            className={`input w-full py-2.5 text-sm font-mono ${uniqueErrors.tc ? 'border-red-400 focus:border-red-500' : ''}`}
            value={nationalId}
            onChange={e => setTcNumber(e.target.value.replace(/\D/g, ''))}
            placeholder={t('institution.students.form.tcPlaceholder')}
          />
          {uniqueErrors.tc && <p className="text-xs text-red-500 mt-1">{uniqueErrors.tc}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('institution.students.form.birthDate')} *</label>
          <input type="date" className="input w-full py-2.5 text-sm" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
        </div>
      </div>

      {/* Email and Phone - Side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('institution.students.form.email')}</label>
          <input
            type="email"
            className={`input w-full py-2.5 text-sm ${uniqueErrors.email ? 'border-red-400 focus:border-red-500' : ''}`}
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={t('institution.students.form.emailPlaceholder')}
          />
          {uniqueErrors.email && <p className="text-xs text-red-500 mt-1">{uniqueErrors.email}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('institution.students.form.phone')}</label>
          <input
            className={`input w-full py-2.5 text-sm ${uniqueErrors.phone ? 'border-red-400 focus:border-red-500' : ''}`}
            value={phone}
            onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
            placeholder={t('institution.students.form.phonePlaceholder')}
          />
          {uniqueErrors.phone && <p className="text-xs text-red-500 mt-1">{uniqueErrors.phone}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="pt-3 flex justify-end gap-3 border-t border-gray-100">
        <button type="button" onClick={onCancel} className="btn-secondary text-sm px-4 py-2">{t('common.cancel')}</button>
        <button disabled={!valid} className={`btn-primary text-sm px-5 py-2 ${!valid ? 'opacity-60 cursor-not-allowed' : ''}`}>{t('common.save') || 'Kaydet'}</button>
      </div>
    </form>
  );
}

function AddStudentForm({ onSubmit, onCancel }: {
  onSubmit: (v: { nationalId: string; firstName: string; lastName: string; otherLastName?: string; lastNameDisplay?: LastNameDisplay; birthDate: string; email?: string; phone?: string }) => void;
  onCancel: () => void
}) {
  const { t } = useLanguage();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [otherLastName, setOtherLastName] = useState('');
  const [showOtherLastName, setShowOtherLastName] = useState(false);
  const [showPrimary, setShowPrimary] = useState(true);
  const [showSecondary, setShowSecondary] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalId, setTcNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');

  // Uniqueness validation states
  const [validating, setValidating] = useState(false);
  const [uniqueErrors, setUniqueErrors] = useState<{ tc?: string; email?: string; phone?: string }>({});

  const getLastNameDisplay = (): LastNameDisplay => {
    if (showPrimary && showSecondary) return 'both';
    if (showSecondary) return 'secondary';
    return 'primary';
  };

  // Validate uniqueness when TC, email or phone changes (debounced)
  useEffect(() => {
    const tc = nationalId.trim();
    const em = email.trim();
    const ph = phone.trim();

    // Only validate if TC is complete (11 digits)
    if (tc.length !== 11) {
      setUniqueErrors({});
      return;
    }

    const timeout = setTimeout(async () => {
      setValidating(true);
      try {
        const res = await fetch('/api/students/validate-tc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nationalIds: [tc],
            emails: em ? [em] : [],
            phones: ph ? [ph] : []
          })
        });
        if (res.ok) {
          const data = await res.json();
          const errors: { tc?: string; email?: string; phone?: string } = {};
          if (data.existingTCs?.includes(tc)) {
            errors.tc = t('institution.students.errors.tcExists') || 'Bu TC numarası zaten kayıtlı.';
          }
          if (em && data.existingEmails?.includes(em)) {
            errors.email = t('institution.students.errors.emailExists') || 'Bu e-posta zaten kayıtlı.';
          }
          if (ph && data.existingPhones?.includes(ph)) {
            errors.phone = t('institution.students.errors.phoneExists') || 'Bu telefon zaten kayıtlı.';
          }
          setUniqueErrors(errors);
        }
      } catch { }
      setValidating(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, [nationalId, email, phone, t]);

  const valid = useMemo(() => {
    const hasValidName = firstName.trim().length > 1 && lastName.trim().length > 1;
    const hasValidTc = /^\d{11}$/.test(nationalId);
    const hasValidBirthDate = birthDate.trim().length > 0;
    const hasAtLeastOneSurnameSelected = showPrimary || (showOtherLastName && showSecondary && otherLastName.trim().length > 0);
    const secondaryValid = !showSecondary || (showOtherLastName && otherLastName.trim().length > 0);
    const hasNoUniqueErrors = Object.keys(uniqueErrors).length === 0;
    const notValidating = !validating; // Don't allow submit while validating
    return hasValidName && hasValidTc && hasValidBirthDate && hasAtLeastOneSurnameSelected && secondaryValid && hasNoUniqueErrors && notValidating;
  }, [firstName, lastName, nationalId, birthDate, showPrimary, showSecondary, showOtherLastName, otherLastName, uniqueErrors, validating]);

  const handleAddOtherLastName = () => {
    setShowOtherLastName(true);
  };

  const handleRemoveOtherLastName = () => {
    setShowOtherLastName(false);
    setOtherLastName('');
    setShowSecondary(false);
    setShowPrimary(true);
  };

  const handlePrimaryChange = (checked: boolean) => {
    if (!checked && !showSecondary) return;
    setShowPrimary(checked);
  };

  const handleSecondaryChange = (checked: boolean) => {
    if (!checked && !showPrimary) return;
    setShowSecondary(checked);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onSubmit({
          nationalId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          otherLastName: showOtherLastName ? otherLastName.trim() || undefined : undefined,
          lastNameDisplay: showOtherLastName ? getLastNameDisplay() : 'primary',
          birthDate,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined
        });
      }}
      className="space-y-4"
    >
      {/* Name Row - Always side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('institution.students.form.firstName')} *</label>
          <input className="input w-full py-2.5 text-sm" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder={t('institution.students.form.firstName')} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('institution.students.form.lastName')} *</label>
          <div className="flex items-center gap-2">
            <input className="input flex-1 py-2.5 text-sm" value={lastName} onChange={e => setLastName(e.target.value)} placeholder={t('institution.students.form.lastName')} />
            {showOtherLastName && (
              <label className="inline-flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={showPrimary}
                  onChange={e => handlePrimaryChange(e.target.checked)}
                  className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span>{t('institution.students.form.showOnCertificate')}</span>
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Surname Section - Reserved height */}
      <div className="min-h-[72px]">
        {!showOtherLastName ? (
          <button
            type="button"
            onClick={handleAddOtherLastName}
            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors py-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('institution.students.form.addOtherLastName')}
          </button>
        ) : (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-500">{t('institution.students.form.otherLastName')}</label>
              <button
                type="button"
                onClick={handleRemoveOtherLastName}
                className="text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                {t('common.remove')}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                className="input flex-1 py-2.5 text-sm"
                value={otherLastName}
                onChange={e => setOtherLastName(e.target.value)}
                placeholder={t('institution.students.form.otherLastNamePlaceholder')}
              />
              <label className="inline-flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={showSecondary}
                  onChange={e => handleSecondaryChange(e.target.checked)}
                  disabled={!otherLastName.trim()}
                  className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50"
                />
                <span>{t('institution.students.form.showOnCertificate')}</span>
              </label>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">{t('institution.students.form.surnameHint')}</p>
          </div>
        )}
      </div>

      {/* TC and Birth Date - Side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('institution.students.form.nationalId')} *</label>
          <input
            maxLength={11}
            className={`input w-full py-2.5 text-sm font-mono ${uniqueErrors.tc ? 'border-red-400 focus:border-red-500' : ''}`}
            value={nationalId}
            onChange={e => setTcNumber(e.target.value.replace(/\D/g, ''))}
            placeholder={t('institution.students.form.tcPlaceholder')}
          />
          {uniqueErrors.tc && <p className="text-xs text-red-500 mt-1">{uniqueErrors.tc}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('institution.students.form.birthDate')} *</label>
          <input type="date" className="input w-full py-2.5 text-sm" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
        </div>
      </div>

      {/* Email and Phone - Side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('institution.students.form.email')}</label>
          <input
            type="email"
            className={`input w-full py-2.5 text-sm ${uniqueErrors.email ? 'border-red-400 focus:border-red-500' : ''}`}
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={t('institution.students.form.emailPlaceholder')}
          />
          {uniqueErrors.email && <p className="text-xs text-red-500 mt-1">{uniqueErrors.email}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('institution.students.form.phone')}</label>
          <input
            className={`input w-full py-2.5 text-sm ${uniqueErrors.phone ? 'border-red-400 focus:border-red-500' : ''}`}
            value={phone}
            onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
            placeholder={t('institution.students.form.phonePlaceholder')}
          />
          {uniqueErrors.phone && <p className="text-xs text-red-500 mt-1">{uniqueErrors.phone}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="pt-3 flex justify-end gap-3 border-t border-gray-100">
        <button type="button" onClick={onCancel} className="btn-secondary text-sm px-4 py-2">{t('common.cancel')}</button>
        <button disabled={!valid} className={`btn-primary text-sm px-5 py-2 ${!valid ? 'opacity-60 cursor-not-allowed' : ''}`}>{t('common.add')}</button>
      </div>
    </form>
  );
}
