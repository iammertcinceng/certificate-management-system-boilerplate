"use client";

import { useEffect, useState } from 'react';

type Student = {
  id: string;
  publicId: string;
  firstName: string;
  lastName: string;
  otherLastName: string | null;
  lastNameDisplay: string;
  nationalId: string;
  birthDate: string;
  email: string | null;
  phone: string | null;
  institutionUserId: string;
  institutionName: string | null;
  createdAt: string;
};

// Last name display helper
const getDisplayName = (student: Student): string => {
  const { firstName, lastName, otherLastName, lastNameDisplay } = student;
  let displayLastName = lastName;

  if (lastNameDisplay === 'secondary' && otherLastName) {
    displayLastName = otherLastName;
  } else if (lastNameDisplay === 'both' && otherLastName) {
    displayLastName = `${lastName} ${otherLastName}`;
  }

  return `${firstName} ${displayLastName}`;
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'name' | 'date'>('name');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Fetch students with institution info
        const res = await fetch('/api/admin/students', { cache: 'no-store' });
        const data = res.ok ? await res.json() : { students: [] };
        setStudents((data.students || []).map((s: any) => ({
          id: s.id,
          publicId: s.publicId,
          firstName: s.firstName,
          lastName: s.lastName,
          otherLastName: s.otherLastName,
          lastNameDisplay: s.lastNameDisplay || 'primary',
          nationalId: s.nationalId,
          birthDate: s.birthDate,
          email: s.email,
          phone: s.phone,
          institutionUserId: s.institutionUserId,
          institutionName: s.institutionName,
          createdAt: s.createdAt,
        })));
      } catch {
        setStudents([]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const filtered = students.filter(s => {
    if (query.trim()) {
      const q = query.toLowerCase();
      return s.publicId.toLowerCase().includes(q) ||
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.nationalId.includes(q) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q));
    }
    return true;
  }).sort((a, b) => {
    if (sort === 'name') return a.firstName.localeCompare(b.firstName);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Öğrenciler</h1>
        <p className="text-gray-600 mt-2">Sistemdeki tüm öğrencileri görüntüleyin. Toplam {students.length} öğrenci.</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            type="text"
            placeholder="Ad, soyad, TC, e-posta veya telefon ara..."
            className="input w-full pr-10 p-3 rounded-lg"
          />
          <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 104.473 8.746l2.64 2.64a.75.75 0 101.06-1.06l-2.64-2.64A5.5 5.5 0 009 3.5zm-4 5.5a4 4 0 118 0 4 4 0 01-8 0z" clipRule="evenodd" /></svg>
          </span>
        </div>
        <div className="relative w-48">
          <select
            value={sort}
            onChange={e => setSort(e.target.value as any)}
            className="appearance-none input w-full p-3 rounded-lg pr-10"
          >
            <option value="name">İsme Göre</option>
            <option value="date">Tarihe Göre</option>
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-700">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Ad Soyad</th>
                <th className="px-6 py-3">TC Kimlik No</th>
                <th className="px-6 py-3">Doğum Tarihi</th>
                <th className="px-6 py-3">İletişim</th>
                <th className="px-6 py-3 whitespace-nowrap">Kayıt Tarihi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-6 py-6 text-gray-500" colSpan={5}>Yükleniyor...</td></tr>
              ) : filtered.length ? filtered.map(s => (
                <tr key={s.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-800">{getDisplayName(s)}</div>
                    {s.otherLastName && s.lastNameDisplay !== 'primary' && (
                      <div className="text-xs text-gray-500">
                        {s.lastNameDisplay === 'both' ? 'Çift soyisim' : 'İkinci soyisim'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono text-sm">{s.nationalId}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(s.birthDate).toLocaleDateString('tr-TR')}</td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {s.email ? (
                        <div className="flex items-center gap-1 text-sm">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="text-gray-700">{s.email}</span>
                        </div>
                      ) : null}
                      {s.phone ? (
                        <div className="flex items-center gap-1 text-sm">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span className="text-gray-700">{s.phone}</span>
                        </div>
                      ) : null}
                      {!s.email && !s.phone && <span className="text-gray-400">-</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(s.createdAt).toLocaleDateString('tr-TR')}</td>
                </tr>
              )) : (
                <tr><td className="px-6 py-6 text-gray-500" colSpan={5}>Kayıt bulunamadı.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
