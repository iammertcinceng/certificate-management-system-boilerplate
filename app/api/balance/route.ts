import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/db/client";
import { balances } from "@/db/schema";
import { eq } from "drizzle-orm";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET /api/balance - Fetch current user's credit balance
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

    const row = await db.select().from(balances).where(eq(balances.institutionUserId, userId)).limit(1);
    const balance = row.length ? Number(row[0].balance) : 0;

    return NextResponse.json({ balance }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/balance error", err);
    return NextResponse.json({ error: "İşlem sırasında bir hata oluştu."}, { status: 500 });
  }
}
