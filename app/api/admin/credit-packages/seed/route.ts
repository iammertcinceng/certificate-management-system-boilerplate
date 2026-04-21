import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db/client";
import { creditPackages } from "@/db/schema";

async function requireAdmin() {
    const session = (await getServerSession(authOptions)) as any;
    const role = session?.user?.role as string | undefined;
    if (role !== "admin") {
        return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }
    return { ok: true as const };
}

// POST /api/admin/credit-packages/seed - Seed initial credit packages
export async function POST() {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.res;

    try {
        // Default credit packages based on the USD pricing table
        const defaultPackages = [
            { credits: 10, priceUsd: "6.00", sortOrder: 1 },
            { credits: 25, priceUsd: "17.00", sortOrder: 2 },
            { credits: 50, priceUsd: "31.00", sortOrder: 3 },
            { credits: 100, priceUsd: "52.00", sortOrder: 4 },
            { credits: 250, priceUsd: "120.00", sortOrder: 5 },
            { credits: 500, priceUsd: "200.00", sortOrder: 6 },
            { credits: 1000, priceUsd: "350.00", sortOrder: 7 },
            { credits: 3000, priceUsd: "600.00", sortOrder: 8 },
        ];

        // Check if packages already exist
        const existing = await db.select().from(creditPackages);
        if (existing.length > 0) {
            return NextResponse.json({
                message: "Credit packages already exist",
                count: existing.length
            }, { status: 200 });
        }

        // Insert default packages
        const inserted = await db
            .insert(creditPackages)
            .values(defaultPackages.map(pkg => ({
                credits: pkg.credits,
                priceUsd: pkg.priceUsd,
                sortOrder: pkg.sortOrder,
            })))
            .returning();

        return NextResponse.json({
            message: "Credit packages seeded successfully",
            count: inserted.length,
            packages: inserted
        }, { status: 201 });
    } catch (err: any) {
        console.error("POST /api/admin/credit-packages/seed error", err);
        return NextResponse.json({ error: "İşlem sırasında bir hata oluştu."}, { status: 500 });
    }
}
