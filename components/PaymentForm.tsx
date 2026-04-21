"use client";

import { useState } from "react";
import {
    PaymentElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import { useLanguage } from "@/contexts/LanguageContext";

interface PaymentFormProps {
    amount: number;
    certificateCount: number;
    onSuccess: () => void;
    onCancel: () => void;
}

/**
 * PaymentForm Component
 * 
 * Stripe PaymentElement ile güvenli kart girişi sağlar.
 * Kart bilgileri ASLA sunucuya iletilmez, direkt Stripe'a gider.
 * 
 * SECURITY:
 * - Kart verileri bu component'te işlenmez
 * - Stripe.js kart verilerini tokenize eder
 * - Sunucuya sadece PaymentIntent ID gider
 */
export default function PaymentForm({
    amount,
    certificateCount,
    onSuccess,
    onCancel,
}: PaymentFormProps) {
    const { t } = useLanguage();
    const stripe = useStripe();
    const elements = useElements();

    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            // Stripe.js henüz yüklenmedi
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            // Ödemeyi onayla
            const { error: submitError, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    // Ödeme sonrası yönlendirme yapmıyoruz, SPA içinde kalıyoruz
                    return_url: `${window.location.origin}/institution/balance`,
                },
                redirect: 'if_required', // 3D Secure gerekirse yönlendir, değilse SPA'da kal
            });

            if (submitError) {
                // Kullanıcıya gösterilecek hata mesajı
                if (submitError.type === 'card_error' || submitError.type === 'validation_error') {
                    setError(submitError.message || t('payment.error.cardError'));
                } else {
                    setError(t('payment.error.unexpected'));
                }
                setIsProcessing(false);
                return;
            }

            // Ödeme başarılı - fallback olarak confirm-payment endpoint'ini çağır
            // Bu sayede webhook çalışmasa bile kredi eklenir
            if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'processing') {
                console.log("💳 Payment succeeded, confirming with server...");

                try {
                    const confirmRes = await fetch('/api/stripe/confirm-payment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ paymentIntentId: paymentIntent.id })
                    });

                    if (confirmRes.ok) {
                        const data = await confirmRes.json();
                        console.log("✅ Payment confirmed:", data);
                    } else {
                        const errorData = await confirmRes.json();
                        console.warn("⚠️ Confirm payment response:", errorData);
                        // Webhook ile işlenmiş olabilir, hata gösterme
                    }
                } catch (confirmErr) {
                    console.warn("⚠️ Confirm payment fallback error:", confirmErr);
                    // Webhook ile işlenmiş olabilir, hata gösterme
                }

                onSuccess();
            }
        } catch (err: any) {
            console.error("Payment error:", err);
            setError(t('payment.error.unexpected'));
        }

        setIsProcessing(false);
    };

    // USD formatı
    const formatUSD = (value: number) => {
        try {
            return new Intl.NumberFormat('tr-TR', {
                style: 'currency',
                currency: 'USD',
            }).format(value);
        } catch {
            return `$${value.toLocaleString('tr-TR')}`;
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Ödeme Özeti - Kompakt */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <span className="text-sm text-blue-700">{t('payment.summary.certificates')}</span>
                    <span className="font-semibold text-blue-900">{certificateCount} {t('payment.summary.pieces')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-blue-700">{t('payment.summary.total')}</span>
                    <span className="text-lg font-bold text-blue-900">{formatUSD(amount)}</span>
                </div>
            </div>

            {/* Stripe Payment Element */}
            <div className="bg-white rounded-lg border border-gray-200">
                <PaymentElement
                    options={{
                        layout: 'tabs',
                        fields: {
                            billingDetails: 'auto', // Fatura için gerekirse gösterilir
                        },
                        wallets: {
                            applePay: 'auto',
                            googlePay: 'auto',
                        },
                        paymentMethodOrder: ['card'], // Sadece kart önce göster
                    }}
                />
            </div>

            {/* Hata Mesajı */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-start gap-2">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            {/* Güvenlik Notu */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>{t('payment.security.note')}</span>
            </div>

            {/* Butonlar */}
            <div className="flex items-center justify-end gap-3 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isProcessing}
                    className="px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                    {t('payment.buttons.cancel')}
                </button>
                <button
                    type="submit"
                    disabled={!stripe || isProcessing}
                    className="px-6 py-2.5 bg-[#0945A5] text-white rounded-lg hover:bg-[#073580] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isProcessing ? (
                        <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span>{t('payment.buttons.processing')}</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            <span>{t('payment.buttons.pay')} {formatUSD(amount)}</span>
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
