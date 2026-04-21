import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db/client";
import { creditPackages } from "@/db/schema";
import { asc } from "drizzle-orm";

// GET /api/credit-packages - List active packages (for institutions)
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only return active packages, sorted by credits
        const packages = await db
            .select({
                id: creditPackages.id,
                credits: creditPackages.credits,
                priceUsd: creditPackages.priceUsd,
            })
            .from(creditPackages)
            .orderBy(asc(creditPackages.sortOrder), asc(creditPackages.credits));

        return NextResponse.json({ packages }, { status: 200 });
    } catch (err: any) {
        console.error("GET /api/credit-packages error", err);
        return NextResponse.json({ error: "İşlem sırasında bir hata oluştu." }, { status: 500 });
    }
}
