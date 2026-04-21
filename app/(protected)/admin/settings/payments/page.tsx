"use client";

import Loader from '@/components/ui/Loader';
import { useEffect, useState } from 'react';

export default function PaymentSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Stripe settings
  const [stripePublishableKey, setStripePublishableKey] = useState('');
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState('');
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/system-config');
      if (res.ok) {
        const data = await res.json();
        setStripePublishableKey(data.stripePublishableKey || '');
        setStripeSecretKey(data.stripeSecretKey ? '••••••••••••••••' : '');
        setStripeWebhookSecret(data.stripeWebhookSecret ? '••••••••••••••••' : '');
        setPaymentsEnabled(data.paymentsEnabled || false);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {
        paymentsEnabled,
      };

      // Only send keys if they are not masked
      if (stripePublishableKey && !stripePublishableKey.includes('••••')) {
        payload.stripePublishableKey = stripePublishableKey;
      }
      if (stripeSecretKey && !stripeSecretKey.includes('••••')) {
        payload.stripeSecretKey = stripeSecretKey;
      }
      if (stripeWebhookSecret && !stripeWebhookSecret.includes('••••')) {
        payload.stripeWebhookSecret = stripeWebhookSecret;
      }

      const res = await fetch('/api/system-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert('Stripe ayarları başarıyla kaydedildi!');
        loadSettings(); // Reload to get masked values
      } else {
        alert('Ayarlar kaydedilemedi.');
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('Bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Loader />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ödeme Ayarları</h1>
        <p className="text-gray-600 mt-2">Stripe ödeme entegrasyonunu yapılandırın.</p>
      </div>

      {/* Payments Toggle */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Ödeme Sistemi</h3>
            <p className="text-sm text-gray-600 mt-1">
              Aktif edildiğinde kurumlar sertifika oluşturmak için ödeme yapmak zorunda olacak.
            </p>
          </div>
          <button
            onClick={() => setPaymentsEnabled(!paymentsEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${paymentsEnabled ? 'bg-green-600' : 'bg-gray-300'
              }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${paymentsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
          </button>
        </div>
        {paymentsEnabled && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              ✓ Ödeme sistemi aktif. Kurumlar kredi satın almak için Stripe ile ödeme yapabilir.
            </p>
          </div>
        )}
        {!paymentsEnabled && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              Ödeme sistemi devre dışı. Kurumlar kredi satın alamaz, bakiye manuel olarak eklenir.
            </p>
          </div>
        )}
      </div>

      {/* Stripe Configuration */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="6" fill="#635BFF" />
            <path d="M14.8 13.2c0-.8.7-1.2 1.8-1.2 1.6 0 3.6.5 5.2 1.4V9.2c-1.7-.7-3.5-1-5.2-1-4.3 0-7.1 2.2-7.1 6 0 5.8 8 4.9 8 7.4 0 1-.8 1.3-2 1.3-1.7 0-4-.7-5.7-1.7v4.3c1.9.8 3.9 1.2 5.7 1.2 4.4 0 7.4-2.2 7.4-6 0-6.3-8-5.2-8-7.5z" fill="white" />
          </svg>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Stripe Yapılandırması</h3>
            <p className="text-sm text-gray-600">
              Stripe hesabınızdan aldığınız API anahtarlarını girin.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Publishable Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Publishable Key (pk_...)
            </label>
            <input
              type="text"
              value={stripePublishableKey}
              disabled={true}
              onChange={(e) => setStripePublishableKey(e.target.value)}
              className="input w-full p-3 rounded-lg font-mono text-sm"
              placeholder="pk_live_... veya pk_test_..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Bu anahtar client tarafında kullanılır ve güvenli bir şekilde paylaşılabilir.
            </p>
          </div>

          {/* Secret Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Secret Key (sk_...)
            </label>
            <input
              type="password"
              value={stripeSecretKey}
              disabled={true}
              onChange={(e) => setStripeSecretKey(e.target.value)}
              className="input w-full p-3 rounded-lg font-mono text-sm"
              placeholder="sk_live_... veya sk_test_..."
            />
            <p className="text-xs text-gray-500 mt-1">
              ⚠️ Bu anahtar gizli tutulmalıdır. Sadece server tarafında kullanılır.
            </p>
          </div>

          {/* Webhook Secret */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook Secret (whsec_...)
            </label>
            <div className="relative group">
              <input
                type="password"
                value={stripeWebhookSecret}
                disabled={true}
                className="input w-full p-3 rounded-lg font-mono text-sm bg-gray-100 cursor-not-allowed"
                placeholder="whsec_..."
              />
              <div className="absolute inset-y-0 right-3 flex items-center">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="absolute -top-8 right-0 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                Bu alan .env üzerinden yönetilir
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Bu değer sunucu tarafında .env dosyasından okunur ve buradan değiştirilemez.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium">Stripe Entegrasyonu Hakkında</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Test modunda <code className="bg-blue-100 px-1 rounded">pk_test_</code> ve <code className="bg-blue-100 px-1 rounded">sk_test_</code> anahtarlarını kullanın</li>
              <li>Canlıya geçmeden önce <code className="bg-blue-100 px-1 rounded">pk_live_</code> ve <code className="bg-blue-100 px-1 rounded">sk_live_</code> anahtarlarına geçin</li>
              <li>Webhook URL: <code className="bg-blue-100 px-1 rounded">{typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/stripe</code></li>
              <li>Webhook events: <code className="bg-blue-100 px-1 rounded">checkout.session.completed</code>, <code className="bg-blue-100 px-1 rounded">payment_intent.succeeded</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
