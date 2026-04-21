"use client";

import { useRouter } from 'next/navigation';
import { useDraft } from '../state';
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Loader from '@/components/ui/Loader';

type Student = { id: string; firstName: string; lastName: string; email: string | null };

export default function StudentsStep() {
  const router = useRouter();
  const { draft, setDraft } = useDraft();
  const [query, setQuery] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/students');
        if (res.ok) {
          const data = await res.json();
          const items: Student[] = (data.students || []).map((s: any) => ({ id: s.id, firstName: s.firstName, lastName: s.lastName, email: s.email || null }));
          if (mounted) setStudents(items);
        }
      } catch { }
      finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  const toggleStudent = (id: string) => {
    setDraft(d => {
      const set = new Set(d.selectedStudentIds);
      if (set.has(id)) set.delete(id); else set.add(id);
      return { ...d, selectedStudentIds: Array.from(set) };
    });
  };

  const onCsvUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const lines = text.split(/\r?\n/).filter(Boolean);
      const rows = lines.slice(1).map(line => {
        const [id, name, email] = line.split(',');
        return { id: id?.trim(), name: name?.trim(), email: email?.trim() };
      });
      setDraft(d => ({ ...d, csvPreview: rows }));
    };
    reader.readAsText(file);
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return students.filter(s => `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q));
  }, [students, query]);

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

      <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('institution.certificates.create.students.title')}</h2>
      <p className="text-gray-600 mt-1">{t('institution.certificates.create.students.subtitle')}</p>

      <div className="mt-6">

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('institution.certificates.create.students.listTitle')}</h3>
          <div className="mb-4">
            <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder={t('institution.certificates.create.students.searchPlaceholder')} className="input w-full" />
          </div>
          {loading ? (
            <Loader />
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filtered.map((student: Student) => (
                <div key={student.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <input type="checkbox" checked={draft.selectedStudentIds.includes(student.id)} onChange={() => toggleStudent(student.id)} className="mr-3" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{student.firstName} {student.lastName}</div>
                    <div className="text-sm text-gray-500">{student.email || '-'}</div>
                  </div>
                </div>
              ))}
              {!filtered.length && (
                <div className="text-sm text-gray-500">{t('institution.certificates.create.students.notFound')}</div>
              )}
            </div>
          )}
        </div>

      </div>

      <div className="mt-6 flex justify-between">
        <button onClick={() => router.push('/institution/certificates/create/partners')} className="btn-secondary">{t('common.back')}</button>
        <button onClick={() => router.push('/institution/certificates/create/review')} className="btn-primary">{t('common.next')}</button>
      </div>
    </div>
  );
}
