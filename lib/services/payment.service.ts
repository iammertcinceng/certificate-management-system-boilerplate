import { stripe, toStripeAmount } from "@/lib/stripe";
import { CreditService } from "./credit.service";
import Stripe from "stripe";
import logger from "@/lib/logger";

export interface PaymentIntentOptions {
    amountUSD: number;
    credits: number;
    userId: string;
    packageId: string;
    description?: string;
}

/**
 * PaymentService - Stripe ödeme işlemlerini yönetir
 * 
 * GÜNCELLEME: Artık PaymentIntent oluşturulduğunda "pending" transaction kaydedilmiyor.
 * Transaction SADECE ödeme başarılı olduğunda (webhook ile) oluşturulur.
 * Bu sayede kullanıcı modalı kapatırsa hiçbir işlem kaydı görünmez.
 */
export class PaymentService {
    /**
     * Initialize a payment intent
     * NOT: Bu aşamada veritabanına HİÇBİR ŞEY kaydedilmez.
     * Transaction sadece ödeme başarılı olursa webhook'tan oluşturulur.
     */
    static async createPaymentIntent(options: PaymentIntentOptions): Promise<{ clientSecret: string; paymentIntentId: string }> {
        if (!stripe) {
            throw new Error("Stripe is not configured");
        }

        // Sadece Stripe PaymentIntent oluştur - veritabanına kayıt YOK
        const paymentIntent = await stripe.paymentIntents.create({
            amount: toStripeAmount(options.amountUSD),
            currency: 'usd',
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                userId: options.userId,
                packageId: options.packageId,
                certificateCount: options.credits.toString(),
                amountUSD: options.amountUSD.toString(),
            },
            description: options.description || `Credit purchase - ${options.credits} credits`,
        });

        if (!paymentIntent.client_secret) {
            throw new Error("Failed to create client secret");
        }

        // NOT: createPendingTransaction KALDIRILDI
        // Kullanıcı modalı kapatırsa hiçbir işlem görünmeyecek

        return {
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        };
    }

    /**
     * Process webhook events
     */
    static async handleWebhookEvent(payload: string, signature: string, secret: string): Promise<{ received: boolean }> {
        logger.log("🔄 handleWebhookEvent called");

        if (!stripe) {
            logger.error("❌ Stripe is not configured");
            throw new Error("Stripe is not configured");
        }

        let event: Stripe.Event;
        try {
            logger.log("🔐 Verifying webhook signature...");
            event = stripe.webhooks.constructEvent(payload, signature, secret);
            logger.log("✅ Signature verified successfully");
        } catch (err: any) {
            logger.error("❌ Webhook signature verification failed:", err.message);
            throw new Error(`Invalid signature: ${err.message}`);
        }

        logger.log("📨 Event type:", event.type);
        logger.log("📨 Event ID:", event.id);

        switch (event.type) {
            case "payment_intent.succeeded":
                logger.log("💳 Processing payment_intent.succeeded...");
                await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
                break;
            case "payment_intent.payment_failed":
                logger.log(`❌ Payment failed: ${(event.data.object as Stripe.PaymentIntent).id}`);
                break;
            case "payment_intent.canceled":
                logger.log(`⚠️ Payment cancelled: ${(event.data.object as Stripe.PaymentIntent).id}`);
                break;
            default:
                logger.log(`ℹ️ Unhandled event type: ${event.type}`);
        }

        return { received: true };
    }

    /**
     * Handle successful payment - SADECE BURADA transaction oluşturulur
     */
    private static async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
        logger.log("💰 handlePaymentSucceeded called");
        logger.log("💰 PaymentIntent ID:", paymentIntent.id);
        logger.log("💰 PaymentIntent metadata:", JSON.stringify(paymentIntent.metadata));

        const userId = paymentIntent.metadata.userId;
        const credits = parseInt(paymentIntent.metadata.certificateCount || "0", 10);
        const amountUSD = paymentIntent.amount / 100;

        logger.log("💰 Extracted - userId:", userId, "credits:", credits, "amountUSD:", amountUSD);

        if (!userId || credits <= 0) {
            logger.error("❌ Invalid metadata in payment intent", paymentIntent.id);
            return;
        }

        // IDEMPOTENCY CHECK: Bu ödeme zaten işlendi mi?
        logger.log("🔍 Checking for existing transaction...");
        const existingTx = await CreditService.getTransactionByPaymentIntentId(paymentIntent.id);
        if (existingTx) {
            logger.log(`⚠️ Payment already processed (idempotency check): ${paymentIntent.id}`);
            return;
        }
        logger.log("✅ No existing transaction found, proceeding...");

        // Transaction oluştur VE bakiye ekle (tek atomic işlem)
        logger.log("📝 Creating transaction and adding credits...");
        await CreditService.addCreditsFromPayment(userId, credits, {
            stripePaymentIntentId: paymentIntent.id,
            amountUSD: amountUSD,
            description: `Kredi yüklendi: ${credits} kredi ($${amountUSD.toFixed(2)})`,
        });

        logger.log(`✅ Payment succeeded and balance updated for user ${userId}: ${credits} credits`);
    }
}

