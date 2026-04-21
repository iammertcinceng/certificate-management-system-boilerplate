"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Loading from '@/components/Loading';
import Loader from '@/components/ui/Loader';

type ApprovalItem = {
  id: string;
  trainingName: string;
  institution: string;
  date: string;
  uiaRequired: boolean;
  uiaResponsible: boolean;
};

type CollabItem = {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
};

export default function PartnerDashboard() {
  const { t } = useLanguage();
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [collabs, setCollabs] = useState<CollabItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [appRes, colRes] = await Promise.all([
          fetch('/api/approvals', { cache: 'no-store' }),
          fetch('/api/collaborations?side=partner', { cache: 'no-store' }),
        ]);
        const appData = appRes.ok ? await appRes.json() : { items: [] };
        const colData = colRes.ok ? await colRes.json() : { collaborations: [] };
        setApprovals(appData.items || []);
        setCollabs((colData.collaborations || []).map((r: any) => ({ id: r.collaboration.id, status: r.collaboration.status })));
      } catch {
        setApprovals([]);
        setCollabs([]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const pendingResponsibleCount = useMemo(() => approvals.filter(a => a.uiaRequired && a.uiaResponsible).length, [approvals]);
  const totalCollabsApproved = useMemo(() => collabs.filter(c => c.status === 'approved').length, [collabs]);
  const recentApprovals = useMemo(() => {
    const sorted = [...approvals].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sorted.slice(0, 5);
  }, [approvals]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">{t('acreditor.dashboard.title')}</h1>
          <p className="text-dark-300 mt-2">{t('acreditor.dashboard.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="text-sm text-gray-500 mb-1">{t('acreditor.dashboard.stats.pendingUiaApprovals')}</div>
          <div className="text-3xl font-bold text-gray-900">{pendingResponsibleCount}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="text-sm text-gray-500 mb-1">{t('acreditor.dashboard.stats.activeCollaborations')}</div>
          <div className="text-3xl font-bold text-gray-900">{totalCollabsApproved}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="text-sm text-gray-500 mb-1">{t('acreditor.dashboard.stats.totalCertificates')}</div>
          <div className="text-3xl font-bold text-gray-900">{approvals.length}</div>
        </div>
      </div>

      {/* TODO: Stats Chart - Partner için grafik eklenecek */}
      {/* Recharts kullanılarak partner aktiviteleri gösterilecek */}
      {/* - Günlük onay sayıları */}
      {/* - UIA kod girişi trendi */}
      {/* - İşbirliği durumları */}
      {/* - Onaylanan/Reddedilen sertifika oranları */}
      {/* Component: <StatsChart data={chartData} /> */}

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('acreditor.dashboard.recentApprovals.title')}</h2>
          <Link href="/acreditor/approvals" className="text-sm text-primary-600 hover:underline">{t('acreditor.dashboard.recentApprovals.viewAll')}</Link>
        </div>
        {loading ? (
          <Loader />
        ) : recentApprovals.length ? (
          <ul className="divide-y">
            {recentApprovals.map(a => (
              <li key={a.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{a.trainingName}</div>
                  <div className="text-sm text-gray-500">{a.institution} • {new Date(a.date).toLocaleDateString()}</div>
                </div>
                {a.uiaResponsible ? (
                  <span className="text-xs px-2 py-0.5 rounded-full border bg-indigo-50 text-indigo-700">{t('acreditor.dashboard.recentApprovals.uiaResponsible')}</span>
                ) : a.uiaRequired ? (
                  <span className="text-xs px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700">{t('acreditor.dashboard.recentApprovals.uiaExists')}</span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full border text-gray-500">{t('acreditor.dashboard.recentApprovals.noUia')}</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-gray-500">{t('acreditor.dashboard.recentApprovals.noRecords')}</div>
        )}
      </div>
    </div>
  );
}
