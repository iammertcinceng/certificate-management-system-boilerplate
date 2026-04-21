import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";
import { PaymentService } from "@/lib/services/payment.service";
import logger from "@/lib/logger";

/**
 * POST /api/stripe/webhook
 * 
 * Stripe Webhook Handler - KRİTİK GÜVENLİK ENDPOINT'İ
 * 
 * Bu endpoint Stripe tarafından çağrılır ve ödeme durumu değişikliklerini bildirir.
 * Bakiye güncellemesi SADECE bu endpoint üzerinden yapılır.
 * 
 * SECURITY:
 * - Stripe signature verification ZORUNLU
 * - Idempotency: Aynı event tekrar işlenmez
 * - Raw body kullanımı (Next.js otomatik parse'ı devre dışı)
 */

export async function POST(req: Request) {
    logger.log("========================================");
    logger.log("🔔 STRIPE WEBHOOK CALLED");
    logger.log("Timestamp:", new Date().toISOString());

    try {
        // 1. Get raw body for signature verification
        const body = await req.text();
        logger.log("📦 Body length:", body.length);

        // 2. Get Stripe signature header
        const headersList = await headers();
        const signature = headersList.get("stripe-signature");
        logger.log("🔐 Signature present:", !!signature);

        if (!signature) {
            logger.error("❌ Webhook Error: Missing stripe-signature header");
            return NextResponse.json({ error: "Missing signature" }, { status: 400 });
        }

        // 3. Validate webhook secret is configured
        logger.log("🔑 STRIPE_WEBHOOK_SECRET configured:", !!STRIPE_WEBHOOK_SECRET);

        if (!STRIPE_WEBHOOK_SECRET || STRIPE_WEBHOOK_SECRET.length < 10) {
            logger.error("❌ CRITICAL: STRIPE_WEBHOOK_SECRET is not configured or invalid");
            return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
        }

        // 4. Process using PaymentService
        logger.log("🔄 Processing webhook event...");
        const result = await PaymentService.handleWebhookEvent(
            body,
            signature,
            STRIPE_WEBHOOK_SECRET
        );

        logger.log("✅ Webhook processed successfully:", result);
        logger.log("========================================");
        return NextResponse.json(result, { status: 200 });

    } catch (err: any) {
        logger.error("❌ Webhook handler error:", err.message);
        logger.log("========================================");

        const status = err.message.includes("Invalid signature") ? 400 : 500;
        return NextResponse.json(
            { error: err.message || "Webhook handler failed" },
            { status }
        );
    }
}

