import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db/client";
import { balanceTransactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/balance/transactions - Get current user's transaction history
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 400 });
    }

    // Get all transactions for this user
    const transactions = await db
      .select()
      .from(balanceTransactions)
      .where(eq(balanceTransactions.institutionUserId, userId))
      .orderBy(desc(balanceTransactions.createdAt))
      .limit(100); // Last 100 transactions

    return NextResponse.json({ transactions }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/balance/transactions error", err);
    return NextResponse.json({ 
      error: "İşlem sırasında bir hata oluştu."}, { status: 500 });
  }
}
