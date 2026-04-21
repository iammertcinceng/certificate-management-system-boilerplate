"use client";

import { ReactNode } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, Appearance } from "@stripe/stripe-js";

/**
 * Stripe publishable key - Client-side kullanım için güvenli
 * Bu key public'tir ve frontend'de kullanılabilir
 */
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// Stripe'ı lazy load et (sadece gerektiğinde yüklensin)
const stripePromise = stripePublishableKey
    ? loadStripe(stripePublishableKey)
    : null;

/**
 * Stripe Elements görünüm ayarları
 * Proje renkleriyle uyumlu tema
 */
const appearance: Appearance = {
    theme: 'stripe',
    variables: {
        colorPrimary: '#0945A5',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#dc2626',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        borderRadius: '8px',
        spacingUnit: '4px',
    },
    rules: {
        '.Input': {
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        },
        '.Input:focus': {
            border: '1px solid #0945A5',
            boxShadow: '0 0 0 2px rgba(9, 69, 165, 0.2)',
        },
        '.Label': {
            fontWeight: '500',
            marginBottom: '6px',
        },
    },
};

interface StripeProviderProps {
    children: ReactNode;
    clientSecret: string;
}

/**
 * StripeProvider Component
 * 
 * Stripe Elements'ı wrap eder ve clientSecret ile yapılandırır.
 * Payment form'larını bu provider içinde render edin.
 * 
 * @example
 * <StripeProvider clientSecret={clientSecret}>
 *   <PaymentForm onSuccess={() => {}} />
 * </StripeProvider>
 */
export default function StripeProvider({ children, clientSecret }: StripeProviderProps) {
    // Stripe yapılandırılmamışsa uyarı göster
    if (!stripePromise) {
        return (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                <strong>⚠️ Ödeme sistemi yapılandırılmamış.</strong>
                <p className="mt-1">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable'ı tanımlanmalı.</p>
            </div>
        );
    }

    const options = {
        clientSecret,
        appearance,
    };

    return (
        <Elements stripe={stripePromise} options={options}>
            {children}
        </Elements>
    );
}
