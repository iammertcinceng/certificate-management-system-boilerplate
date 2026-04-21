import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db/client";
import { balances, organizations, balanceTransactions } from "@/db/schema";
import { eq } from "drizzle-orm";

async function requireAdmin() {
  const session = (await getServerSession(authOptions)) as any;
  const role = session?.user?.role as string | undefined;
  if (role !== "admin") {
    return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true as const };
}

// GET /api/admin/balances
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  try {
    // Get all institutions (role-based filtering would require joining users table)
    const allOrgs = await db.select().from(organizations);

    // Get all balances
    const allBalances = await db.select().from(balances);

    // Get latest transaction for each institution
    const latestTransactions = await db.select({
      institutionUserId: balanceTransactions.institutionUserId,
      latestAt: balanceTransactions.createdAt,
    }).from(balanceTransactions);

    // Create maps for quick lookup
    const balanceMap = new Map(allBalances.map(b => [b.institutionUserId, b]));

    // Get the latest transaction date per user
    const latestTxMap = new Map<string, Date>();
    latestTransactions.forEach(tx => {
      const current = latestTxMap.get(tx.institutionUserId);
      if (!current || new Date(tx.latestAt) > current) {
        latestTxMap.set(tx.institutionUserId, new Date(tx.latestAt));
      }
    });

    // Combine ALL organizations with their balance (0 if none)
    const rows = allOrgs.map(org => {
      const balance = balanceMap.get(org.userId);
      const latestTransaction = latestTxMap.get(org.userId);
      return {
        id: balance?.id || org.userId, // Use org userId if no balance record
        institutionUserId: org.userId,
        institutionName: org.name || 'Bilinmeyen Kurum',
        balance: balance?.balance || '0',
        updatedAt: balance?.updatedAt || org.createdAt,
        latestTransactionAt: latestTransaction || null,
        hasTransactions: !!latestTransaction,
      };
    });

    // Sort: institutions with transactions first (by latest transaction date DESC), then without transactions
    rows.sort((a, b) => {
      if (a.hasTransactions && !b.hasTransactions) return -1;
      if (!a.hasTransactions && b.hasTransactions) return 1;
      if (a.latestTransactionAt && b.latestTransactionAt) {
        return b.latestTransactionAt.getTime() - a.latestTransactionAt.getTime();
      }
      return a.institutionName.localeCompare(b.institutionName);
    });

    return NextResponse.json({ balances: rows }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/admin/balances error", err);
    return NextResponse.json({
      error: "İşlem sırasında bir hata oluştu.",
    }, { status: 500 });
  }
}

// POST /api/admin/balances/topup
export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  try {
    const body = await req.json();
    const { institutionUserId, amount } = body;

    if (!institutionUserId || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // ATOMIC TRANSACTION: Balance update + transaction log in single transaction
    const result = await db.transaction(async (tx) => {
      // Get current balance
      const current = await tx
        .select({ balance: balances.balance })
        .from(balances)
        .where(eq(balances.institutionUserId, institutionUserId))
        .limit(1);

      let balanceRecord;

      if (!current.length) {
        // Create new balance record
        const [inserted] = await tx
          .insert(balances)
          .values({ institutionUserId, balance: amountNum.toString() })
          .returning();

        // Create transaction record
        await tx.insert(balanceTransactions).values({
          institutionUserId,
          type: 'credit',
          amount: amountNum.toString(),
          description: `Admin kredi yükledi: ${amountNum} kredi`,
          metadata: { key: 'admin_balance_initial', params: { amount: amountNum } },
        });

        balanceRecord = inserted;
      } else {
        // Update existing balance
        const newBalance = parseFloat(current[0].balance) + amountNum;
        const [updated] = await tx
          .update(balances)
          .set({ balance: newBalance.toString(), updatedAt: new Date() })
          .where(eq(balances.institutionUserId, institutionUserId))
          .returning();

        // Create transaction record
        await tx.insert(balanceTransactions).values({
          institutionUserId,
          type: 'credit',
          amount: amountNum.toString(),
          description: `Admin kredi yükledi: ${amountNum} kredi`,
          metadata: { key: 'admin_balance_loaded', params: { amount: amountNum } },
        });

        balanceRecord = updated;
      }

      return balanceRecord;
    });

    return NextResponse.json({ balance: result }, { status: 200 });
  } catch (err) {
    console.error("POST /api/admin/balances error", err);
    return NextResponse.json({ error: "İşlem sırasında bir hata oluştu." }, { status: 500 });
  }
}

// PUT /api/admin/balances (direct set balance)
export async function PUT(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  try {
    const body = await req.json();
    const { institutionUserId, balance } = body;

    if (!institutionUserId || balance === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const balanceNum = parseFloat(balance);
    if (isNaN(balanceNum) || balanceNum < 0) {
      return NextResponse.json({ error: "Invalid balance" }, { status: 400 });
    }

    const updated = await db
      .update(balances)
      .set({ balance: balanceNum.toString(), updatedAt: new Date() })
      .where(eq(balances.institutionUserId, institutionUserId))
      .returning();

    if (!updated.length) {
      // Create if not exists
      const inserted = await db
        .insert(balances)
        .values({ institutionUserId, balance: balanceNum.toString() })
        .returning();
      return NextResponse.json({ balance: inserted[0] }, { status: 201 });
    }

    return NextResponse.json({ balance: updated[0] }, { status: 200 });
  } catch (err) {
    console.error("PUT /api/admin/balances error", err);
    return NextResponse.json({ error: "İşlem sırasında bir hata oluştu." }, { status: 500 });
  }
}
