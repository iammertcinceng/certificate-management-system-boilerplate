import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db/client";
import { certificates, trainings, users, organizations, balanceTransactions } from "@/db/schema";
import { desc, or, eq } from "drizzle-orm";

async function requireAdmin() {
  const session = (await getServerSession(authOptions)) as any;
  const role = session?.user?.role as string | undefined;
  if (role !== "admin") {
    return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true as const };
}

// GET /api/admin/activities - Get recent system activities
export async function GET(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type'); // 'certificate' | 'training' | 'user' | 'transaction' | 'all'

    const activities: any[] = [];

    // Fetch certificates
    if (!type || type === 'all' || type === 'certificate') {
      const certs = await db
        .select({
          id: certificates.id,
          publicId: certificates.publicId,
          status: certificates.status,
          createdAt: certificates.createdAt,
          institutionName: organizations.name,
        })
        .from(certificates)
        .leftJoin(organizations, eq(certificates.institutionUserId, organizations.userId))
        .orderBy(desc(certificates.createdAt))
        .limit(type === 'certificate' ? limit : 20);

      activities.push(...certs.map(c => ({
        id: c.id,
        type: 'certificate',
        description: `${c.institutionName || 'Kurum'} - Sertifika ${c.publicId} ${
          c.status === 'approved' ? 'onaylandı' : 
          c.status === 'pending' ? 'oluşturuldu' : 'reddedildi'
        }`,
        timestamp: c.createdAt,
        status: c.status,
        relatedId: c.publicId,
      })));
    }

    // Fetch trainings
    if (!type || type === 'all' || type === 'training') {
      const trains = await db
        .select({
          id: trainings.id,
          publicId: trainings.publicId,
          name: trainings.name,
          status: trainings.status,
          createdAt: trainings.createdAt,
          institutionName: organizations.name,
        })
        .from(trainings)
        .leftJoin(organizations, eq(trainings.institutionUserId, organizations.userId))
        .orderBy(desc(trainings.createdAt))
        .limit(type === 'training' ? limit : 20);

      activities.push(...trains.map(t => ({
        id: t.id,
        type: 'training',
        description: `${t.institutionName || 'Kurum'} - Eğitim "${t.name}" ${
          t.status === 'approved' ? 'onaylandı' : 
          t.status === 'pending' ? 'oluşturuldu' : 'reddedildi'
        }`,
        timestamp: t.createdAt,
        status: t.status,
        relatedId: t.publicId,
      })));
    }

    // Fetch users
    if (!type || type === 'all' || type === 'user') {
      const userList = await db
        .select({
          id: users.id,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
          orgName: organizations.name,
        })
        .from(users)
        .leftJoin(organizations, eq(users.id, organizations.userId))
        .orderBy(desc(users.createdAt))
        .limit(type === 'user' ? limit : 20);

      activities.push(...userList.map(u => ({
        id: u.id,
        type: 'user',
        description: `Yeni ${u.role === 'admin' ? 'admin' : u.role === 'institution' ? 'kurum' : 'akreditör'} kaydı - ${u.orgName || u.email}`,
        timestamp: u.createdAt,
        status: 'completed',
        relatedId: u.email,
      })));
    }

    // Fetch balance transactions
    if (!type || type === 'all' || type === 'transaction') {
      const txs = await db
        .select({
          id: balanceTransactions.id,
          type: balanceTransactions.type,
          amount: balanceTransactions.amount,
          description: balanceTransactions.description,
          createdAt: balanceTransactions.createdAt,
          institutionName: organizations.name,
        })
        .from(balanceTransactions)
        .leftJoin(organizations, eq(balanceTransactions.institutionUserId, organizations.userId))
        .orderBy(desc(balanceTransactions.createdAt))
        .limit(type === 'transaction' ? limit : 20);

      activities.push(...txs.map(tx => ({
        id: tx.id,
        type: 'transaction',
        description: `${tx.institutionName || 'Kurum'} - ${tx.description}`,
        timestamp: tx.createdAt,
        status: 'completed',
        relatedId: tx.id,
        amount: tx.amount,
        transactionType: tx.type,
      })));
    }

    // Sort all activities by timestamp
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Limit results
    const limitedActivities = activities.slice(0, limit);

    return NextResponse.json({ activities: limitedActivities }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/admin/activities error", err);
    return NextResponse.json({ 
      error: "İşlem sırasında bir hata oluştu."}, { status: 500 });
  }
}
