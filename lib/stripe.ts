/**
 * Stripe Server-Side Client
 * 
 * SECURITY: Bu dosya sadece server-side (API routes) içinde kullanılmalıdır.
 * ASLA client-side component'lerde import etmeyin!
 * 
 * STRIPE_SECRET_KEY environment variable'ı .env dosyasında tanımlanmalıdır.
 */

import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

// Only create Stripe instance if key is available
export const stripe = stripeSecretKey
    ? new Stripe(stripeSecretKey, {
        typescript: true,
    })
    : null;

// Helper to check if Stripe is configured
export const isStripeConfigured = (): boolean => {
    return !!stripeSecretKey && stripe !== null;
};

/**
 * Stripe Webhook Secret
 * Webhook signature verification için gerekli
 */
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * Minimum ve maksimum ödeme limitleri (USD cinsinden)
 */
export const PAYMENT_LIMITS = {
    MIN_AMOUNT: 1, // Minimum $1 USD
    MAX_AMOUNT: 10000, // Maksimum $10,000 USD
} as const;

/**
 * Amount'u Stripe formatına çevir (cent cinsinden)
 * Stripe, USD için en küçük birim olan cent kullanır
 */
export function toStripeAmount(amountUSD: number): number {
    return Math.round(amountUSD * 100);
}

/**
 * Stripe formatından USD'ye çevir
 */
export function fromStripeAmount(amountCents: number): number {
    return amountCents / 100;
}
