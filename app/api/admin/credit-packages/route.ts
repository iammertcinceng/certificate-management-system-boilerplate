import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db/client";
import { creditPackages } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

async function requireAdmin() {
    const session = (await getServerSession(authOptions)) as any;
    const role = session?.user?.role as string | undefined;
    if (role !== "admin") {
        return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }
    return { ok: true as const };
}

// GET /api/admin/credit-packages - List all packages
export async function GET() {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.res;

    try {
        const packages = await db
            .select()
            .from(creditPackages)
            .orderBy(asc(creditPackages.sortOrder), asc(creditPackages.credits));

        return NextResponse.json({ packages }, { status: 200 });
    } catch (err: any) {
        console.error("GET /api/admin/credit-packages error", err);
        return NextResponse.json({ error: "İşlem sırasında bir hata oluştu." }, { status: 500 });
    }
}

// POST /api/admin/credit-packages - Create new package
export async function POST(req: Request) {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.res;

    try {
        const body = await req.json();
        const { credits, priceUsd, sortOrder = 0 } = body;

        if (!credits || !priceUsd) {
            return NextResponse.json({ error: "credits and priceUsd are required" }, { status: 400 });
        }

        const [newPackage] = await db
            .insert(creditPackages)
            .values({
                credits: parseInt(credits),
                priceUsd: priceUsd.toString(),
                sortOrder: parseInt(sortOrder),
            })
            .returning();

        return NextResponse.json({ package: newPackage }, { status: 201 });
    } catch (err: any) {
        console.error("POST /api/admin/credit-packages error", err);
        return NextResponse.json({ error: "İşlem sırasında bir hata oluştu." }, { status: 500 });
    }
}

// PUT /api/admin/credit-packages - Update package
export async function PUT(req: Request) {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.res;

    try {
        const body = await req.json();
        const { id, credits, priceUsd, sortOrder } = body;

        if (!id) {
            return NextResponse.json({ error: "id is required" }, { status: 400 });
        }

        const updateData: any = { updatedAt: new Date() };
        if (credits !== undefined) updateData.credits = parseInt(credits);
        if (priceUsd !== undefined) updateData.priceUsd = priceUsd.toString();
        if (sortOrder !== undefined) updateData.sortOrder = parseInt(sortOrder);

        const [updated] = await db
            .update(creditPackages)
            .set(updateData)
            .where(eq(creditPackages.id, id))
            .returning();

        if (!updated) {
            return NextResponse.json({ error: "Package not found" }, { status: 404 });
        }

        return NextResponse.json({ package: updated }, { status: 200 });
    } catch (err: any) {
        console.error("PUT /api/admin/credit-packages error", err);
        return NextResponse.json({ error: "İşlem sırasında bir hata oluştu." }, { status: 500 });
    }
}

// DELETE /api/admin/credit-packages?id=xxx - Delete package
export async function DELETE(req: Request) {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.res;

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "id is required" }, { status: 400 });
        }

        await db.delete(creditPackages).where(eq(creditPackages.id, id));

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (err: any) {
        console.error("DELETE /api/admin/credit-packages error", err);
        return NextResponse.json({ error: "İşlem sırasında bir hata oluştu." }, { status: 500 });
    }
}
