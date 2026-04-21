import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db/client";
import { users, organizations, students, trainings, certificates, balances, balanceTransactions, institutionPartners } from "@/db/schema";
import { eq } from "drizzle-orm";

async function requireAdmin() {
    const session = (await getServerSession(authOptions)) as any;
    const role = session?.user?.role as string | undefined;
    if (role !== "admin") {
        return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }
    return { ok: true as const, userId: session.user.id };
}

// GET - Get user details
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.res;

    try {
        const { id: userId } = await params;

        const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

        if (!user.length) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ user: user[0] }, { status: 200 });
    } catch (err) {
        console.error("GET /api/admin/users/[id] error", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// PUT - Update user (role change)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.res;

    try {
        const { id: userId } = await params;
        const body = await req.json();
        const { role } = body;

        // Validate role
        const validRoles = ["admin", "institution", "acreditor"];
        if (role && !validRoles.includes(role)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        // Check if user exists
        const existing = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!existing.length) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Prevent changing admin role
        if (existing[0].role === "admin") {
            return NextResponse.json({ error: "Cannot change admin role" }, { status: 403 });
        }

        // Update user
        const updated = await db
            .update(users)
            .set({ role })
            .where(eq(users.id, userId))
            .returning();

        return NextResponse.json({ user: updated[0] }, { status: 200 });
    } catch (err) {
        console.error("PUT /api/admin/users/[id] error", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// DELETE - Delete user and related data
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.res;

    try {
        const { id: userId } = await params;

        // Check if user exists
        const existing = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!existing.length) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Prevent deleting admin
        if (existing[0].role === "admin") {
            return NextResponse.json({ error: "Cannot delete admin users" }, { status: 403 });
        }

        // Delete related data in order (cascade manually)
        // 1. Balance transactions
        await db.delete(balanceTransactions).where(eq(balanceTransactions.institutionUserId, userId));

        // 2. Balance
        await db.delete(balances).where(eq(balances.institutionUserId, userId));

        // 3. Institution partnerships
        await db.delete(institutionPartners).where(eq(institutionPartners.institutionUserId, userId));

        // 4. Students
        await db.delete(students).where(eq(students.institutionUserId, userId));

        // 5. Trainings
        await db.delete(trainings).where(eq(trainings.institutionUserId, userId));

        // 6. Certificates (consider keeping for verification, but for now delete)
        await db.delete(certificates).where(eq(certificates.institutionUserId, userId));

        // 7. Organization
        await db.delete(organizations).where(eq(organizations.userId, userId));

        // 8. Finally, delete the user
        await db.delete(users).where(eq(users.id, userId));

        return NextResponse.json({ success: true, message: "User and related data deleted" }, { status: 200 });
    } catch (err) {
        console.error("DELETE /api/admin/users/[id] error", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
