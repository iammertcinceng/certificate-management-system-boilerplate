import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PaymentService } from "@/lib/services/payment.service";
import { PAYMENT_LIMITS } from "@/lib/stripe";
import { db } from "@/db/client";
import { creditPackages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * POST /api/stripe/create-payment-intent
 * 
 * Stripe Payment Intent oluşturur.
 * Frontend bu endpoint'i çağırarak clientSecret alır ve ödeme formunu gösterir.
 * 
 * SECURITY:
 * - Authentication zorunlu
 * - Rate limiting: 10 requests per minute per user
 * - Package validation: Fiyat ve kredi veritabanından doğrulanır (CSRF koruması)
 * - Amount manipulation önlenir
 * - Stripe secret key sadece server-side kullanılır
 */
export async function POST(req: Request) {
    try {
        // 1. Authentication check
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        if (!userId) {
            return NextResponse.json({ error: "User ID not found" }, { status: 400 });
        }

        // 2. Rate limiting check
        const rateLimit = checkRateLimit(userId, RATE_LIMITS.PAYMENT);
        if (!rateLimit.allowed) {
            console.warn(`Rate limit exceeded for user ${userId}`);
            return NextResponse.json({
                error: "Too many requests. Please try again later.",
                retryAfterMs: rateLimit.retryAfterMs,
            }, {
                status: 429,
                headers: {
                    'Retry-After': String(Math.ceil((rateLimit.retryAfterMs || 60000) / 1000)),
                }
            });
        }

        // 2. Parse request body
        const body = await req.json();
        const { packageId } = body;

        // SECURITY: Package ID is required - we don't trust amount from frontend
        if (!packageId || typeof packageId !== 'string') {
            return NextResponse.json({ error: "Package ID is required" }, { status: 400 });
        }

        // 3. CRITICAL SECURITY: Fetch package from database to get TRUSTED price and credits
        const [pkg] = await db
            .select()
            .from(creditPackages)
            .where(eq(creditPackages.id, packageId))
            .limit(1);

        if (!pkg) {
            return NextResponse.json({ error: "Invalid package" }, { status: 404 });
        }

        const amount = Number(pkg.priceUsd);
        const credits = Number(pkg.credits);

        // 4. Validate amount limits (additional safety check)
        if (amount < PAYMENT_LIMITS.MIN_AMOUNT || amount > PAYMENT_LIMITS.MAX_AMOUNT) {
            return NextResponse.json({
                error: `Payment amount must be between $${PAYMENT_LIMITS.MIN_AMOUNT} and $${PAYMENT_LIMITS.MAX_AMOUNT} USD`
            }, { status: 400 });
        }

        // 5. Create Payment Intent using service with TRUSTED values
        const { clientSecret, paymentIntentId } = await PaymentService.createPaymentIntent({
            amountUSD: amount,
            credits: credits,
            userId: userId,
            packageId: packageId
        });

        console.log(`✅ Payment Intent Created: ${paymentIntentId} | Package: ${packageId} | Amount: $${amount} | Credits: ${credits}`);

        return NextResponse.json({
            clientSecret,
            paymentIntentId,
        }, { status: 200 });

    } catch (err: any) {
        console.error("❌ CREATE PAYMENT INTENT ERROR:", err.message);

        // Don't expose internal error details
        const isConfigError = err.message === "Stripe is not configured";
        return NextResponse.json({
            error: isConfigError ? "Payment system temporarily unavailable" : "Payment initialization failed",
        }, { status: isConfigError ? 503 : 500 });
    }
}
