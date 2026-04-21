import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db/client";
import { balances, balanceTransactions } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/balance/purchase - Purchase credits (test mode - no payment)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 400 });
    }

    const body = await req.json();
    const { amount } = body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Get current balance
    const balanceRow = await db.select().from(balances).where(eq(balances.institutionUserId, userId)).limit(1);

    let currentBalance = 0;
    if (balanceRow.length > 0) {
      currentBalance = Number(balanceRow[0].balance);
    }

    const newBalance = currentBalance + amount;

    // Update or insert balance
    if (balanceRow.length > 0) {
      await db.update(balances)
        .set({
          balance: newBalance.toString(),
          updatedAt: new Date()
        })
        .where(eq(balances.institutionUserId, userId));
    } else {
      await db.insert(balances).values({
        institutionUserId: userId,
        balance: newBalance.toString(),
        updatedAt: new Date()
      });
    }

    // Create transaction record
    await db.insert(balanceTransactions).values({
      institutionUserId: userId,
      type: 'credit',
      amount: amount.toString(),
      description: `balance_loaded:${amount}`, // fallback
      metadata: { key: 'balance_loaded', params: { amount } },
      createdAt: new Date()
    });

    return NextResponse.json({
      success: true,
      newBalance,
      message: "Bakiye başarıyla yüklendi"
    }, { status: 200 });
  } catch (err: any) {
    console.error("POST /api/balance/purchase error", err);
    return NextResponse.json({
      error: "İşlem sırasında bir hata oluştu."}, { status: 500 });
  }
}
