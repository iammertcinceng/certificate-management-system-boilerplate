import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { stripe } from "@/lib/stripe";
import { CreditService } from "@/lib/services/credit.service";
import logger from "@/lib/logger";

/**
 * POST /api/stripe/confirm-payment
 * 
 * Client-side payment confirmation fallback
 * Bu endpoint, webhook çalışmadığında (örn: lokal geliştirme) kullanılır.
 * 
 * SECURITY:
 * - Kullanıcı oturumu doğrulanır
 * - PaymentIntent Stripe'tan doğrulanır
 * - İdempotency: Aynı ödeme tekrar işlenmez
 */
export async function POST(req: Request) {
    logger.log("========================================");
    logger.log("🔄 CONFIRM-PAYMENT ENDPOINT CALLED");
    logger.log("Timestamp:", new Date().toISOString());

    try {
        // 1. Auth check
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            logger.error("❌ Unauthorized - no session");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = (session.user as any).id;
        logger.log("👤 User ID:", userId);

        // 2. Get paymentIntentId from body
        const body = await req.json();
        const { paymentIntentId } = body;

        if (!paymentIntentId) {
            logger.error("❌ Missing paymentIntentId");
            return NextResponse.json({ error: "paymentIntentId required" }, { status: 400 });
        }
        logger.log("💳 PaymentIntent ID:", paymentIntentId);

        // 3. Verify with Stripe
        if (!stripe) {
            logger.error("❌ Stripe not configured");
            return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
        }

        logger.log("🔍 Fetching PaymentIntent from Stripe...");
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        logger.log("📨 PaymentIntent status:", paymentIntent.status);
        logger.log("📨 PaymentIntent metadata:", JSON.stringify(paymentIntent.metadata));

        // 4. Verify payment succeeded
        if (paymentIntent.status !== "succeeded") {
            logger.error("❌ Payment not succeeded, status:", paymentIntent.status);
            return NextResponse.json({
                error: "Payment not completed",
                status: paymentIntent.status
            }, { status: 400 });
        }

        // 5. Verify user matches
        if (paymentIntent.metadata.userId !== userId) {
            logger.error("❌ User mismatch - metadata:", paymentIntent.metadata.userId, "session:", userId);
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // 6. Extract credit info
        const credits = parseInt(paymentIntent.metadata.certificateCount || "0", 10);
        const amountUSD = paymentIntent.amount / 100;
        logger.log("💰 Credits:", credits, "Amount USD:", amountUSD);

        if (credits <= 0) {
            logger.error("❌ Invalid credits:", credits);
            return NextResponse.json({ error: "Invalid credit amount" }, { status: 400 });
        }

        // 7. IDEMPOTENCY CHECK
        logger.log("🔍 Checking for existing transaction...");
        const existingTx = await CreditService.getTransactionByPaymentIntentId(paymentIntentId);
        if (existingTx) {
            logger.log("⚠️ Payment already processed (idempotency):", paymentIntentId);
            return NextResponse.json({
                success: true,
                message: "Payment already processed",
                credits: credits
            }, { status: 200 });
        }

        // 8. Add credits
        logger.log("📝 Creating transaction and adding credits...");
        await CreditService.addCreditsFromPayment(userId, credits, {
            stripePaymentIntentId: paymentIntentId,
            amountUSD: amountUSD,
            description: `Kredi yüklendi: ${credits} kredi ($${amountUSD.toFixed(2)})`,
        });

        logger.log(`✅ Credits added successfully: ${credits} credits for user ${userId}`);
        logger.log("========================================");

        return NextResponse.json({
            success: true,
            credits: credits,
            message: "Credits added successfully"
        }, { status: 200 });

    } catch (err: any) {
        logger.error("❌ Confirm payment error:", err.message);
        logger.log("========================================");

        return NextResponse.json({
            error: err.message || "Failed to confirm payment"
        }, { status: 500 });
    }
}

