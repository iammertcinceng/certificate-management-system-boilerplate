import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import 'server-only';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/db/client';
import { balances, certificates, students as studentsTable, collaborations, siteSettings, balanceTransactions, trainings } from '@/db/schema';
import { and, eq, desc } from 'drizzle-orm';
import { Activities } from '@/components/institution/Activities';
import StatsChart from '@/components/dashboard/StatsChart';

const StatCard = ({ title, value, change }: { title: string, value: string, change?: string }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <div className="text-sm text-gray-500 mb-1">{title}</div>
    <div className="text-3xl font-bold text-gray-800">{value}</div>
    {change && <div className="text-xs text-[#046358] mt-1">{change}</div>}
  </div>
);

const ActivityItem = ({ icon, text, time }: { icon: string, text: string, time: string }) => (
  <div className="flex items-start space-x-3 py-3">
    <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center">
      <span className="text-lg">{icon}</span>
    </div>
    <div>
      <p className="text-sm text-gray-700">{text}</p>
      <p className="text-xs text-gray-500 mt-0.5">{time}</p>
    </div>
  </div>
);

export default async function InstitutionDashboard() {
  const t = await getTranslations('institution');
  const tActivities = await getTranslations();

  // Build recent activities for this institution (server-side)
  const activities: { icon: string; text: string; time: string; ts: Date }[] = [];

  // Dinamik veriler: balance, counts (DB üzerinden, oturum bazlı)
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;

  let balance = 0;
  let certificateCount = 0;
  let studentCount = 0;
  let partnerCount = 0;
  let lowCreditThreshold = 50; // Fallback - DB'den creditThreshold alınır (satır 73)
  let pendingApprovals = 0;
  let chartData: { date: string; certificates: number; students: number }[] = [];

  if (userId) {
    const [bal, certsCount, studentsCount, partnersCount, pendingCerts] = await Promise.all([
      db.select().from(balances).where(eq(balances.institutionUserId, userId)).limit(1),
      db.select({ id: certificates.id }).from(certificates).where(eq(certificates.institutionUserId, userId)),
      db.select({ id: studentsTable.id }).from(studentsTable).where(eq(studentsTable.institutionUserId, userId)),
      db.select({ id: collaborations.id }).from(collaborations).where(eq(collaborations.institutionUserId, userId)),
      db.select({ id: certificates.id }).from(certificates).where(
        and(
          eq(certificates.institutionUserId, userId),
          eq(certificates.institutionApproved, false),
          eq(certificates.status, 'pending')
        )
      ),
    ]);
    balance = bal.length ? Number(bal[0].balance) : 0;
    certificateCount = certsCount.length;
    studentCount = studentsCount.length;
    partnerCount = partnersCount.length;
    pendingApprovals = pendingCerts.length;
    // Settings: guard with try/catch so it works even if table/migration not present yet
    try {
      const conf = await db.select().from(siteSettings).limit(1);
      if (conf.length && conf[0].creditThreshold) lowCreditThreshold = Number(conf[0].creditThreshold);
    } catch { }

    // Recent certificates
    const recentCerts = await db
      .select({ id: certificates.id, publicId: certificates.publicId, createdAt: certificates.createdAt, status: certificates.status })
      .from(certificates)
      .where(eq(certificates.institutionUserId, userId))
      .orderBy(desc(certificates.createdAt))
      .limit(5);
    activities.push(
      ...recentCerts.map(c => ({
        icon: c.status === 'approved' ? '✅' : c.status === 'pending' ? '📝' : '🗂️',
        text: tActivities('institution.home.activities.certificateStatus', { id: c.publicId, status: c.status === 'approved' ? tActivities('common.status.approved') : c.status === 'pending' ? tActivities('institution.home.activities.created') : tActivities('institution.home.activities.updated') }),
        time: new Date(c.createdAt as any).toLocaleString('tr-TR'),
        ts: new Date(c.createdAt as any),
      }))
    );

    // Recent students
    const recentStudents = await db
      .select({ firstName: studentsTable.firstName, lastName: studentsTable.lastName, createdAt: studentsTable.createdAt })
      .from(studentsTable)
      .where(eq(studentsTable.institutionUserId, userId))
      .orderBy(desc(studentsTable.createdAt))
      .limit(5);
    activities.push(
      ...recentStudents.map(s => ({
        icon: '👤',
        text: tActivities('institution.home.activities.studentAdded', { name: `${s.firstName} ${s.lastName}` }),
        time: new Date(s.createdAt as any).toLocaleString('tr-TR'),
        ts: new Date(s.createdAt as any),
      }))
    );

    // Recent trainings
    const recentTrainings = await db
      .select({ name: trainings.name, createdAt: trainings.createdAt })
      .from(trainings)
      .where(eq(trainings.institutionUserId, userId))
      .orderBy(desc(trainings.createdAt))
      .limit(5);
    activities.push(
      ...recentTrainings.map(tr => ({
        icon: '📚',
        text: tActivities('institution.home.activities.trainingCreated', { name: tr.name }),
        time: new Date(tr.createdAt as any).toLocaleString('tr-TR'),
        ts: new Date(tr.createdAt as any),
      }))
    );

    // Recent balance transactions (if table exists)
    try {
      const recentTx = await db
        .select({
          amount: balanceTransactions.amount,
          description: balanceTransactions.description,
          metadata: balanceTransactions.metadata,
          createdAt: balanceTransactions.createdAt
        })
        .from(balanceTransactions)
        .where(eq(balanceTransactions.institutionUserId, userId))
        .orderBy(desc(balanceTransactions.createdAt))
        .limit(5);
      activities.push(
        ...recentTx.map(tx => {
          // Use metadata if available, otherwise fallback to description
          let text = tx.description;
          if (tx.metadata && tx.metadata.key) {
            const translationKey = `common.transactions.${tx.metadata.key}`;
            text = tActivities(translationKey, tx.metadata.params || {});
          }
          return {
            icon: Number(tx.amount) >= 0 ? '💳' : '💸',
            text,
            time: new Date(tx.createdAt as any).toLocaleString('tr-TR'),
            ts: new Date(tx.createdAt as any),
          };
        })
      );
    } catch { }

    // Generate chart data for last 30 days
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date;
    });

    // Get all certificates and students with dates
    const allCerts = await db
      .select({ createdAt: certificates.createdAt })
      .from(certificates)
      .where(eq(certificates.institutionUserId, userId));

    const allStudents = await db
      .select({ createdAt: studentsTable.createdAt })
      .from(studentsTable)
      .where(eq(studentsTable.institutionUserId, userId));

    // Count by date
    chartData = last30Days.map(date => {
      const dateStr = date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
      const certCount = allCerts.filter(c => {
        const cDate = new Date(c.createdAt as any);
        return cDate.toDateString() === date.toDateString();
      }).length;
      const studentCount = allStudents.filter(s => {
        const sDate = new Date(s.createdAt as any);
        return sDate.toDateString() === date.toDateString();
      }).length;
      return { date: dateStr, certificates: certCount, students: studentCount };
    });
  }

  const hasLowBalance = balance < lowCreditThreshold;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold gradient-text">{t('dashboard')}</h1>
        <p className="text-gray-600 mt-2">{t('home.subtitle')}</p>
      </div>

      {/* Low balance alert */}
      {hasLowBalance && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 text-yellow-800 p-4 flex items-start space-x-3">
          <span>⚠️</span>
          <div>
            <p className="font-medium">{t('home.lowBalance.title')}</p>
            <p className="text-sm">
              {t('home.lowBalance.desc', { balance: `${balance} ${tActivities('common.credits')}` })}
            </p>
            <div className="mt-3 flex gap-3">
              <Link href="/institution/balance" className="btn-primary btn-sm">{t('home.lowBalance.load')}</Link>
              {/* <Link href="/institution/balance" className="btn-secondary btn-sm">Bakiye Yönetimi</Link> */}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard title={t('home.stats.totalCertificates')} value={`${certificateCount}`} />
            <StatCard title={t('home.stats.totalStudents')} value={`${studentCount}`} />
            <StatCard title={t('home.stats.partners')} value={`${partnerCount}`} />
            <StatCard title={t('home.stats.balance')} value={`${balance} ${tActivities('common.credits')}`} change={t('home.stats.threshold', { threshold: `${lowCreditThreshold} ${tActivities('common.credits')}` })} />
          </div>

          {/* Charts */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">{t('home.charts.title')}</h2>
                <p className="text-xs text-gray-500 mt-1">{t('home.charts.subtitle')}</p>
              </div>
              <div className="text-sm text-gray-500">{t('home.charts.last30Days')}</div>
            </div>
            <div className="h-64">
              <StatsChart data={chartData} />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">{t('home.quickActions.title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/institution/certificates/create" className="btn-primary text-center">{t('home.quickActions.createCertificate')}</Link>
              <Link href="/institution/students" className="btn-secondary text-center">{t('home.quickActions.addStudent')}</Link>
              <Link href="/institution/balance" className="btn-secondary text-center">{t('home.quickActions.balance')}</Link>
            </div>
            {/* Öneri: Favori işlemler, sık kullanılan eğitim şablonları, son taslaklar */}
          </div>
        </div>

        {/* Right Column (Activity Log) */}
        <div className="space-y-8">
          {/* Notifications/Alerts Box */}
          <div className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
            <h2 className="text-md font-semibold text-gray-800 p-2">{t('home.notifications.title')}</h2>
            <div className="space-y-3">
              {pendingApprovals > 0 && (
                <Link
                  href="/institution/certificates/approvals"
                  className="block p-4 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-amber-900">{t('home.notifications.pendingCerts')}</span>
                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-amber-600 rounded-full">
                          {pendingApprovals}
                        </span>
                      </div>
                      <p className="text-xs text-amber-700 mt-1">
                        {t('home.notifications.pendingDesc', { count: pendingApprovals })}
                      </p>
                    </div>
                  </div>
                </Link>
              )}
              {pendingApprovals === 0 && (
                <div className="text-center py-6 text-gray-400 text-sm">
                  {t('home.notifications.noNew')}
                </div>
              )}
            </div>
          </div>

          <Activities items={activities.map(a => ({ icon: a.icon, text: a.text, time: a.time, ts: a.ts.toISOString() }))} />

          {/* Balance mini widget */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">{t('home.balanceWidget.current')}</div>
                <div className="text-2xl font-bold text-gray-800">{balance}</div>
              </div>
              <Link href="/institution/balance" className="btn-primary btn-sm">{t('home.balanceWidget.load')}</Link>
            </div>
            {/* Öneri: Otomatik yükleme tanımı, düşük bakiye bildirimleri, mail ile */}
          </div>
        </div>
      </div>
    </div>
  );
}
