import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db/client";
import { balanceTransactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

async function requireAdmin() {
  const session = (await getServerSession(authOptions)) as any;
  const role = session?.user?.role as string | undefined;
  if (role !== "admin") {
    return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true as const };
}

// GET /api/admin/balances/[userId]/transactions - Get transaction history for an institution
export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Get all transactions for this institution
    const transactions = await db
      .select()
      .from(balanceTransactions)
      .where(eq(balanceTransactions.institutionUserId, userId))
      .orderBy(desc(balanceTransactions.createdAt))
      .limit(100); // Last 100 transactions

    return NextResponse.json({ transactions }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/admin/balances/[userId]/transactions error", err);
    return NextResponse.json({
      error: 'u{0130}u{015F}lem su{0131}rasu{0131}nda bir hata oluu{015F}tu.'}, { status: 500 });
  }
}
