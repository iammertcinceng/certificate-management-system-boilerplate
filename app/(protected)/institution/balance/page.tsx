"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useLanguage } from '@/contexts/LanguageContext';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import Loading from "@/components/Loading";
import StripeProvider from "@/components/StripeProvider";
import PaymentForm from "@/components/PaymentForm";
import Loader from "@/components/ui/Loader";

type TxType = "credit" | "debit" | "refund";
type StripeStatus = "pending" | "succeeded" | "failed" | "cancelled";

type Transaction = {
  id: string;
  createdAt: string;
  type: TxType;
  amount: number;
  description: string;
  relatedCertificateId?: string | null;
  stripePaymentIntentId?: string | null;
  stripeStatus?: StripeStatus | null;
};

type CreditPackage = {
  id: string;
  credits: number;
  priceUsd: string;
};

type PaymentStep = "select" | "payment" | "processing" | "success" | "error";

export default function BalancePage() {
  const { t } = useLanguage();
  const { supportEmail } = useSystemConfig();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | TxType>("all");
  const [sort, setSort] = useState<"date_desc" | "date_asc" | "amount_desc" | "amount_asc">("date_desc");
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);

  // Payment flow state
  const [paymentStep, setPaymentStep] = useState<PaymentStep>("select");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Data
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTxs, setLoadingTxs] = useState(false);
  const [creditPackages, setCreditPackages] = useState<CreditPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);


  const loadData = useCallback(async () => {
    try {
      const [bRes, txRes] = await Promise.all([
        fetch('/api/balance'),
        fetch('/api/balance/transactions'),
      ]);
      if (bRes.ok) {
        const data = await bRes.json();
        setBalance(Number(data.balance) || 0);
      }
      if (txRes.ok) {
        const data = await txRes.json();
        setTransactions(data.transactions || []);
      }
    } catch { }
  }, []);

  const loadPackages = useCallback(async () => {
    setLoadingPackages(true);
    try {
      const res = await fetch('/api/credit-packages');
      if (res.ok) {
        const data = await res.json();
        setCreditPackages(data.packages || []);
      }
    } catch { }
    setLoadingPackages(false);
  }, []);

  useEffect(() => {
    loadData();
    loadPackages();
  }, [loadData, loadPackages]);

  // Close modal with ESC key
  useEffect(() => {
    if (!showPurchaseModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCloseModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showPurchaseModal]);

  // Handle modal close - reset state
  const handleCloseModal = () => {
    setShowPurchaseModal(false);
    setPaymentStep("select");
    setPaymentError(null);
    setSelectedPackage(null);
    setClientSecret(null);
  };

  // Stripe Payment Intent başlat
  const handleStartPayment = async () => {
    if (!selectedPackage) {
      setPaymentError(t('institution.balance.errors.selectPackage'));
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // SECURITY: Send only packageId - server validates price from database
      const res = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: selectedPackage.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setClientSecret(data.clientSecret);
        setPaymentStep("payment");
      } else {
        const data = await res.json();
        setPaymentError(data.error || t('institution.balance.errors.paymentFailed'));
      }
    } catch (err) {
      console.error("Start payment error:", err);
      setPaymentError(t('institution.balance.errors.genericError'));
    }

    setIsProcessing(false);
  };

  // Ödeme başarılı
  const handlePaymentSuccess = async () => {
    setPaymentStep("success");
    // Verileri yenile ve modalı kapat
    setTimeout(async () => {
      await loadData();
      setTimeout(() => {
        handleCloseModal();
      }, 2000);
    }, 1000);
  };

  // Ödeme iptal
  const handlePaymentCancel = () => {
    setPaymentStep("select");
    setClientSecret(null);
  };

  const filtered = useMemo(() => {
    let data = [...transactions];
    if (query.trim()) {
      const q = query.toLowerCase();
      data = data.filter(t => t.id.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }
    if (typeFilter !== "all") data = data.filter(t => t.type === typeFilter);
    switch (sort) {
      case "date_asc":
        data.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case "amount_desc":
        data.sort((a, b) => Number(b.amount) - Number(a.amount));
        break;
      case "amount_asc":
        data.sort((a, b) => Number(a.amount) - Number(b.amount));
        break;
      default:
        data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return data;
  }, [transactions, query, typeFilter, sort]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t('institution.balance.title')}</h1>
          <p className="text-sm text-gray-500">{t('institution.balance.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowPurchaseModal(true)} className="btn-primary">{t('institution.balance.loadBalance')}</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <SummaryCard
          title={t('institution.balance.summary.currentBalance')}
          value={balance === null ? '—' : `${balance} ${t('institution.balance.summary.credits')}`}
          accent="text-emerald-600 bg-emerald-50 border-emerald-100"
        />
        <SummaryCard
          title={t('institution.balance.summary.totalTransactions', { count: transactions.length })}
          value=""
          accent="text-indigo-600 bg-indigo-50 border-indigo-100"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex flex-1 gap-3">
          <div className="relative w-60 md:w-72">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="text"
              placeholder={t('institution.balance.search')}
              className="input w-full pr-10 p-3 rounded-lg"
            />
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 104.473 8.746l2.64 2.64a.75.75 0 101.06-1.06l-2.64-2.64A5.5 5.5 0 009 3.5zm-4 5.5a4 4 0 118 0 4 4 0 01-8 0z" clipRule="evenodd" /></svg>
            </span>
          </div>
          <div className="relative w-40">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="appearance-none input w-full p-3 rounded-lg pr-10 shadow-sm focus:border-[#0945A5] focus:ring-2 focus:ring-[#0945A5]/30"
            >
              <option value="all">{t('institution.balance.filter.allTypes')}</option>
              <option value="credit">{t('institution.balance.filter.credit')}</option>
              <option value="debit">{t('institution.balance.filter.debit')}</option>
              <option value="refund">{t('institution.balance.filter.refund')}</option>
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{t('institution.balance.sortLabel')}</span>
          <div className="relative w-48">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="appearance-none input w-full p-3 rounded-lg pr-10 shadow-sm focus:border-[#0945A5] focus:ring-2 focus:ring-[#0945A5]/30"
            >
              <option value="date_desc">{t('institution.balance.sort.dateDesc')}</option>
              <option value="date_asc">{t('institution.balance.sort.dateAsc')}</option>
              <option value="amount_desc">{t('institution.balance.sort.amountDesc')}</option>
              <option value="amount_asc">{t('institution.balance.sort.amountAsc')}</option>
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-6 py-3">{t('institution.balance.table.date')}</th>
              <th className="px-6 py-3">{t('institution.balance.table.type')}</th>
              <th className="px-6 py-3">{t('institution.balance.table.description')}</th>
              <th className="px-6 py-3 text-right">{t('institution.balance.table.amount')}</th>
            </tr>
          </thead>
          <tbody>
            {loadingTxs ? (
              <tr>
                <td className="px-6 py-6 text-gray-500 text-center" colSpan={4}>
                  <div className="py-4"><Loader /></div>
                </td>
              </tr>
            ) : filtered.length > 0 ? (
              filtered.map((tx) => (
                <tr key={tx.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(tx.createdAt).toLocaleString('tr-TR')}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getTypePill(tx.type)}`}>
                        {t(`institution.balance.filter.${tx.type}`)}
                      </span>
                      {tx.stripePaymentIntentId && tx.stripeStatus && tx.stripeStatus !== 'succeeded' && (
                        <span className={`px-2 py-0.5 text-xs rounded ${getStripeStatusPill(tx.stripeStatus)}`}>
                          {t(`institution.balance.stripe.${tx.stripeStatus}`)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">{tx.description}</td>
                  <td className={`px-6 py-4 text-right font-medium ${tx.type === 'credit' || tx.type === 'refund' ? "text-emerald-600" : "text-rose-600"}`}>
                    {tx.stripeStatus === 'pending' ? (
                      <span className="text-amber-600">{tx.amount} {t('institution.balance.summary.credits')} ({t('institution.balance.stripe.waiting')})</span>
                    ) : tx.stripeStatus === 'failed' ? (
                      <span className="text-gray-400 line-through">{tx.amount} {t('institution.balance.summary.credits')}</span>
                    ) : (
                      <>
                        {tx.type === 'credit' || tx.type === 'refund' ? '+' : '-'}{tx.amount} {t('institution.balance.summary.credits')}
                      </>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td className="px-6 py-6 text-gray-500 text-center" colSpan={4}>{t('institution.balance.table.noTransactions')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Purchase Modal with Credit Packages */}
      {showPurchaseModal && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-hidden"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-xl w-full shadow-2xl flex flex-col"
            style={{
              maxWidth: paymentStep === "payment" ? '600px' : '700px',
              maxHeight: 'calc(100vh - 3rem)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header - Fixed */}
            <div className="border-b px-6 py-4 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-600 rounded-t-xl flex-shrink-0">
              <h3 className="text-xl font-semibold text-white">{t('institution.balance.modal.title')}</h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content - Scrollable when needed */}
            <div className="px-6 py-5 overflow-y-auto flex-1">
              {paymentStep === "select" && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">{t('institution.balance.modal.selectPackage')}</p>

                  {loadingPackages ? (
                    <div className="py-8"><Loader label={t('common.loading')} /></div>
                  ) : creditPackages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {t('institution.balance.modal.noPackages')}
                    </div>
                  ) : (
                    <>
                      {/* Credit Package Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {creditPackages.map(pkg => (
                          <button
                            key={pkg.id}
                            onClick={() => setSelectedPackage(pkg)}
                            className={`relative p-4 rounded-xl border-2 transition-all text-center ${selectedPackage?.id === pkg.id
                              ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                              : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                              }`}
                          >
                            <div className="text-2xl font-bold text-gray-900">{pkg.credits}</div>
                            <div className="text-xs text-gray-500 mb-2">{t('institution.balance.modal.creditsLabel')}</div>
                            <div className="text-sm font-semibold text-emerald-600">${pkg.priceUsd}</div>
                            <div className="text-[10px] text-gray-400">
                              ${(parseFloat(pkg.priceUsd) / pkg.credits).toFixed(2)}{t('institution.balance.modal.pricePerCredit')}
                            </div>
                            {selectedPackage?.id === pkg.id && (
                              <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>

                      {/* 3000+ Message */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                        <strong>{t('institution.balance.modal.bulkMessage')}</strong>{' '}
                        <a href={`mailto:${supportEmail}`} className="underline hover:text-blue-900">{t('institution.balance.modal.bulkCta')}</a>
                      </div>

                      {/* Selected Package Summary */}
                      {selectedPackage && (
                        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-sm text-emerald-800">{t('institution.balance.modal.selectedPackage')}</span>
                              <span className="ml-2 font-semibold text-emerald-900">{selectedPackage.credits} {t('institution.balance.modal.creditsLabel')}</span>
                            </div>
                            <div className="text-xl font-bold text-emerald-900">${selectedPackage.priceUsd}</div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Error Message */}
                  {paymentError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                      {paymentError}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={handleCloseModal}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      {t('institution.balance.modal.cancel')}
                    </button>
                    <button
                      onClick={handleStartPayment}
                      disabled={isProcessing || !selectedPackage}
                      className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>{t('common.loading')}</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          <span>{t('institution.balance.modal.proceedToPayment')} (${selectedPackage?.priceUsd || 0})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Stripe Payment Form Step */}
              {paymentStep === "payment" && clientSecret && selectedPackage && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={handlePaymentCancel}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="text-sm text-gray-600">{t('institution.balance.modal.backToSelection')}</span>
                  </div>

                  <StripeProvider clientSecret={clientSecret}>
                    <PaymentForm
                      amount={parseFloat(selectedPackage.priceUsd)}
                      certificateCount={selectedPackage.credits}
                      onSuccess={handlePaymentSuccess}
                      onCancel={handlePaymentCancel}
                    />
                  </StripeProvider>
                </div>
              )}

              {paymentStep === "processing" && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4">
                    <svg className="animate-spin h-16 w-16 text-emerald-600" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">{t('institution.balance.payment.processing')}</h4>
                  <p className="text-gray-600">{t('institution.balance.payment.pleaseWait')}</p>
                </div>
              )}

              {paymentStep === "success" && selectedPackage && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">{t('institution.balance.payment.success')}</h4>
                  <p className="text-gray-600">
                    {t('institution.balance.payment.creditsAdded', { credits: selectedPackage.credits })}
                  </p>
                </div>
              )}

              {paymentStep === "error" && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">{t('institution.balance.payment.failed')}</h4>
                  <p className="text-gray-600 mb-4">{paymentError}</p>
                  <button
                    onClick={() => setPaymentStep("select")}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {t('institution.balance.payment.retry')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ title, value, accent }: { title: string; value: string; accent: string }) {
  return (
    <div className={`rounded-xl border bg-white p-4 ${accent}`}>
      <div className="text-sm text-gray-600">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function getTypePill(type: TxType): string {
  switch (type) {
    case 'credit':
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case 'debit':
      return "bg-rose-50 text-rose-700 border-rose-200";
    case 'refund':
      return "bg-blue-50 text-blue-700 border-blue-200";
    default:
      return "bg-gray-50 text-gray-600 border-gray-200";
  }
}

function getStripeStatusPill(status: StripeStatus): string {
  switch (status) {
    case 'pending':
      return "bg-amber-100 text-amber-700";
    case 'failed':
      return "bg-red-100 text-red-700";
    case 'cancelled':
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}
