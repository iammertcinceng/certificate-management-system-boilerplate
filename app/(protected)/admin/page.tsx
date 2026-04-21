"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Loader from '@/components/ui/Loader';

type Stats = {
  totalUsers: number;
  totalCertificates: number;
  pendingApprovals: number;
  totalStudents: number;
  lowBalanceInstitutions: number;
};

type RecentActivity = {
  id: string;
  type: 'certificate' | 'training' | 'user' | 'transaction';
  description: string;
  timestamp: string;
  status: string;
  relatedId?: string;
  amount?: string;
  transactionType?: string;
};

export default function AdminPage() {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalCertificates: 0, pendingApprovals: 0, totalStudents: 0, lowBalanceInstitutions: 0 });
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActivitiesModal, setShowActivitiesModal] = useState(false);
  const [activityFilter, setActivityFilter] = useState<'all' | 'certificate' | 'training' | 'user' | 'transaction'>('all');
  const [activityQuery, setActivityQuery] = useState('');

  const loadActivities = async () => {
    try {
      const res = await fetch('/api/admin/activities?limit=10', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      }
    } catch { }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [usersRes, certsRes, studentsRes, balancesRes, configRes] = await Promise.all([
          fetch('/api/admin/users', { cache: 'no-store' }),
          fetch('/api/admin/certificates', { cache: 'no-store' }),
          fetch('/api/admin/students', { cache: 'no-store' }),
          fetch('/api/admin/balances', { cache: 'no-store' }),
          fetch('/api/system-config', { cache: 'no-store' }),
        ]);

        const usersData = usersRes.ok ? await usersRes.json() : { users: [] };
        const certsData = certsRes.ok ? await certsRes.json() : { certificates: [] };
        const studentsData = studentsRes.ok ? await studentsRes.json() : { students: [] };
        const balancesData = balancesRes.ok ? await balancesRes.json() : { balances: [] };
        const configData = configRes.ok ? await configRes.json() : { balanceThreshold: 50 };

        const pendingCerts = (certsData.certificates || []).filter((c: any) => c.status === 'pending').length;
        const threshold = Number(configData.balanceThreshold) || 50;
        const lowBalance = (balancesData.balances || []).filter((b: any) => Number(b.balance || 0) < threshold).length;

        setStats({
          totalUsers: (usersData.users || []).length,
          totalCertificates: (certsData.certificates || []).length,
          pendingApprovals: pendingCerts,
          totalStudents: (studentsData.students || []).length,
          lowBalanceInstitutions: lowBalance,
        });

        await loadActivities();
      } catch { }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Genel Bakış</h1>
        <p className="text-gray-600 mt-2">Sistem istatistikleri ve son işlemler</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/admin/users" className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all hover:border-blue-300">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-blue-600">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
              </svg>
            </div>
          </div>
          <div className="text-sm text-gray-600 mb-1">Toplam Kullanıcı</div>
          <div className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.totalUsers}</div>
        </Link>

        <Link href="/admin/certificates" className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all hover:border-indigo-300">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-indigo-600">
                <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902 1.168.188 2.352.327 3.55.414.28.02.521.18.642.413l1.713 3.293a.75.75 0 001.33 0l1.713-3.293a.783.783 0 01.642-.413 41.102 41.102 0 003.55-.414c1.437-.231 2.43-1.49 2.43-2.902V5.426c0-1.413-.993-2.67-2.43-2.902A41.289 41.289 0 0010 2z" clipRule="evenodd" />
              </svg>
            </div>
            {stats.pendingApprovals > 0 && (
              <span className="px-2 py-1 text-xs font-semibold bg-amber-100 text-amber-700 rounded-full">{stats.pendingApprovals} Bekliyor</span>
            )}
          </div>
          <div className="text-sm text-gray-600 mb-1">Toplam Sertifika</div>
          <div className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.totalCertificates}</div>
        </Link>

        <Link href="/admin/students" className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all hover:border-emerald-300">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-emerald-600">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
              </svg>
            </div>
          </div>
          <div className="text-sm text-gray-600 mb-1">Toplam Öğrenci</div>
          <div className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.totalStudents}</div>
        </Link>

        <Link href="/admin/balances" className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all hover:border-red-300">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-red-600">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" />
              </svg>
            </div>
            {stats.lowBalanceInstitutions > 0 && (
              <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-full">{stats.lowBalanceInstitutions} Düşük</span>
            )}
          </div>
          <div className="text-sm text-gray-600 mb-1">Düşük Bakiye</div>
          <div className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.lowBalanceInstitutions}</div>
        </Link>
      </div>

      {/* TODO: Stats Chart - Admin için grafik eklenecek */}
      {/* Recharts kullanılarak sistem geneli istatistikler gösterilecek */}
      {/* - Günlük sertifika oluşturma trendi */}
      {/* - Kullanıcı kayıt trendi */}
      {/* - Onay oranları */}
      {/* - Bakiye hareketleri */}
      {/* Component: <StatsChart data={chartData} /> */}

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Hızlı Erişim</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link href="/admin/users" className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8 text-blue-600">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Kullanıcılar</span>
          </Link>
          <Link href="/admin/approvals/certificates" className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8 text-indigo-600">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Onaylar</span>
          </Link>
          <Link href="/admin/trainings" className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8 text-emerald-600">
              <path d="M10.75 16.82A7.462 7.462 0 0115 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0018 15.06v-11a.75.75 0 00-.546-.721A9.006 9.006 0 0015 3a8.963 8.963 0 00-4.25 1.065V16.82zM9.25 4.065A8.963 8.963 0 005 3c-.85 0-1.673.118-2.454.339A.75.75 0 002 4.06v11a.75.75 0 00.954.721A7.506 7.506 0 015 15.5c1.579 0 3.042.487 4.25 1.32V4.065z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Eğitimler</span>
          </Link>
          <Link href="/admin/balances" className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8 text-amber-600">
              <path d="M1 4.25a3.733 3.733 0 012.25-.75h13.5c.844 0 1.623.279 2.25.75A2.25 2.25 0 0016.75 2H3.25A2.25 2.25 0 001 4.25zM1 7.25a3.733 3.733 0 012.25-.75h13.5c.844 0 1.623.279 2.25.75A2.25 2.25 0 0016.75 5H3.25A2.25 2.25 0 001 7.25zM7 8a1 1 0 011 1 2 2 0 104 0 1 1 0 112 0 4 4 0 01-8 0 1 1 0 011-1z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Bakiye</span>
          </Link>
          <Link href="/admin/students" className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8 text-purple-600">
              <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Öğrenciler</span>
          </Link>
          <Link href="/admin/settings/site" className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8 text-gray-600">
              <path fillRule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Ayarlar</span>
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Son İşlemler (Detaylı)</h2>
          <button
            onClick={() => setShowActivitiesModal(true)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Tümünü Gör
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Tür</th>
                <th className="px-4 py-3 text-left">Açıklama</th>
                <th className="px-4 py-3 text-left">Zaman</th>
                <th className="px-4 py-3 text-left">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td className="px-4 py-6 text-gray-500 text-center" colSpan={4}><Loader /></td></tr>
              ) : activities.length > 0 ? (
                activities.slice(0, 5).map(act => (
                  <tr key={act.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${act.type === 'certificate' ? 'bg-indigo-100 text-indigo-700' :
                        act.type === 'training' ? 'bg-emerald-100 text-emerald-700' :
                          act.type === 'transaction' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                        {act.type === 'certificate' ? 'Sertifika' :
                          act.type === 'training' ? 'Eğitim' :
                            act.type === 'transaction' ? 'İşlem' : 'Kullanıcı'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-900">{act.description}</td>
                    <td className="px-4 py-3 text-gray-600">{new Date(act.timestamp).toLocaleString('tr-TR')}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${act.status === 'approved' || act.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        act.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {act.status === 'approved' ? 'Onaylandı' :
                          act.status === 'pending' ? 'Beklemede' :
                            act.status === 'rejected' ? 'Reddedildi' :
                              act.status === 'completed' ? 'Tamamlandı' : act.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td className="px-4 py-6 text-gray-500 text-center" colSpan={4}>İşlem bulunamadı</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activities Modal */}
      {showActivitiesModal && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowActivitiesModal(false)}
        >
          <div
            className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Tüm İşlemler</h3>
              <button
                onClick={() => setShowActivitiesModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-4 border-b bg-gray-50">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={activityQuery}
                  onChange={(e) => setActivityQuery(e.target.value)}
                  placeholder="İşlem ara..."
                  className="input flex-1 p-2 rounded-lg"
                />
                <select
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value as any)}
                  className="input p-2 rounded-lg"
                >
                  <option value="all">Tüm Türler</option>
                  <option value="certificate">Sertifika</option>
                  <option value="training">Eğitim</option>
                  <option value="user">Kullanıcı</option>
                  <option value="transaction">İşlem</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left">Tür</th>
                    <th className="px-4 py-3 text-left">Açıklama</th>
                    <th className="px-4 py-3 text-left">Zaman</th>
                    <th className="px-4 py-3 text-left">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {activities
                    .filter(act => {
                      if (activityFilter !== 'all' && act.type !== activityFilter) return false;
                      if (activityQuery.trim()) {
                        const q = activityQuery.toLowerCase();
                        return act.description.toLowerCase().includes(q);
                      }
                      return true;
                    })
                    .map(act => (
                      <tr key={act.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${act.type === 'certificate' ? 'bg-indigo-100 text-indigo-700' :
                            act.type === 'training' ? 'bg-emerald-100 text-emerald-700' :
                              act.type === 'transaction' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                            {act.type === 'certificate' ? 'Sertifika' :
                              act.type === 'training' ? 'Eğitim' :
                                act.type === 'transaction' ? 'İşlem' : 'Kullanıcı'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-900">{act.description}</td>
                        <td className="px-4 py-3 text-gray-600">{new Date(act.timestamp).toLocaleString('tr-TR')}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${act.status === 'approved' || act.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                            act.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                            }`}>
                            {act.status === 'approved' ? 'Onaylandı' :
                              act.status === 'pending' ? 'Beklemede' :
                                act.status === 'rejected' ? 'Reddedildi' :
                                  act.status === 'completed' ? 'Tamamlandı' : act.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
