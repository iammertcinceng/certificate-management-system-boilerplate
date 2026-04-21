"use client";

import { useEffect, useState } from 'react';
import Loading from '@/components/Loading';
import CreditPackagesModal from '@/components/admin/CreditPackagesModal';

type Balance = {
  id: string;
  institutionUserId: string;
  institutionName: string;
  balance: string; // Now represents credits, not TL
  updatedAt: string;
};

type Transaction = {
  id: string;
  type: 'credit' | 'debit' | 'refund';
  amount: number; // Credits
  description: string;
  createdAt: string;
  relatedCertificateId?: string;
};

export default function BalancesPage() {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [threshold, setThreshold] = useState('10'); // Credit threshold
  const [creditPerStudent, setCreditPerStudent] = useState('1'); // Credit per student
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<Balance | null>(null);
  const [topupAmount, setTopupAmount] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'credit' | 'debit' | 'refund'>('all');
  const [showPackagesModal, setShowPackagesModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [balRes, configRes] = await Promise.all([
          fetch('/api/admin/balances', { cache: 'no-store' }),
          fetch('/api/system-config', { cache: 'no-store' }),
        ]);
        const balData = balRes.ok ? await balRes.json() : { balances: [] };
        const configData = configRes.ok ? await configRes.json() : { creditThreshold: 10, creditPerStudent: 1 };

        setBalances((balData.balances || []).map((b: any) => ({
          id: b.id,
          institutionUserId: b.institutionUserId,
          institutionName: b.institutionName || 'Bilinmeyen Kurum',
          balance: b.balance,
          updatedAt: b.updatedAt,
        })));
        setThreshold(String(configData.creditThreshold || 10));
        setCreditPerStudent(String(configData.creditPerStudent || 1));
      } catch {
        setBalances([]);
      }
      setLoading(false);
    };
    load();
  }, []);

  // ESC to close modal
  useEffect(() => {
    if (!showDetailModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDetailModal(false);
        setSelectedBalance(null);
        setTopupAmount('');
        setTransactions([]);
        setTransactionFilter('all');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showDetailModal]);

  const loadTransactions = async (userId: string) => {
    setLoadingTransactions(true);
    try {
      const res = await fetch(`/api/admin/balances/${userId}/transactions`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      } else {
        setTransactions([]);
      }
    } catch {
      setTransactions([]);
    }
    setLoadingTransactions(false);
  };

  const handleTopup = async () => {
    if (!selectedBalance || !topupAmount) return;
    try {
      const res = await fetch('/api/admin/balances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ institutionUserId: selectedBalance.institutionUserId, amount: topupAmount }),
      });
      if (res.ok) {
        const data = await res.json();
        setBalances(prev => prev.map(b =>
          b.institutionUserId === selectedBalance.institutionUserId
            ? { ...b, balance: data.balance.balance, updatedAt: data.balance.updatedAt }
            : b
        ));
        if (selectedBalance) {
          setSelectedBalance({ ...selectedBalance, balance: data.balance.balance, updatedAt: data.balance.updatedAt });
        }
        setTopupAmount('');
        loadTransactions(selectedBalance.institutionUserId);
        alert('Kredi başarıyla eklendi.');
      }
    } catch { }
  };

  const handleSaveSettings = async () => {
    try {
      const res = await fetch('/api/system-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creditThreshold: parseInt(threshold),
          creditPerStudent: parseInt(creditPerStudent),
        }),
      });
      if (res.ok) {
        alert('Ayarlar kaydedildi.');
      }
    } catch { }
  };

  const filtered = balances.filter(b => {
    if (query.trim()) {
      const q = query.toLowerCase();
      return b.institutionName.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kredi Yönetimi</h1>
          <p className="text-gray-600 mt-2">Kurum kredilerini yönetin ve inceleyin.</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Credit Packages Button */}
          <button
            onClick={() => setShowPackagesModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Kredi Paketleri
          </button>

          {/* Settings */}
          <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white px-4 py-2 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Kredi Eşiği:</span>
              <input
                type="number"
                value={threshold}
                onChange={e => setThreshold(e.target.value)}
                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="10"
              />
              <span className="text-sm text-gray-500">kredi</span>
            </div>
            <div className="border-l border-gray-300 h-6"></div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Öğrenci Başına:</span>
              <input
                type="number"
                min="0"
                step="0.1"
                value={creditPerStudent}
                onChange={e => setCreditPerStudent(e.target.value)}
                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1"
              />
              <span className="text-sm text-gray-500">kredi</span>
            </div>
            <button onClick={handleSaveSettings} className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors">
              Kaydet
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            type="text"
            placeholder="Kurum ara..."
            className="input w-full pr-10 p-3 rounded-lg"
          />
          <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 104.473 8.746l2.64 2.64a.75.75 0 101.06-1.06l-2.64-2.64A5.5 5.5 0 009 3.5zm-4 5.5a4 4 0 118 0 4 4 0 01-8 0z" clipRule="evenodd" /></svg>
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3">Kurum</th>
              <th className="px-6 py-3">Kredi</th>
              <th className="px-6 py-3 whitespace-nowrap">Son Güncelleme</th>
              <th className="px-6 py-3 text-center">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-6 py-6 text-gray-500" colSpan={4}>
                  <div className="py-4"><Loading label="Yükleniyor..." /></div>
                </td>
              </tr>
            ) : filtered.length ? filtered.map(b => (
              <tr key={b.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">{b.institutionName}</td>
                <td className="px-6 py-4">
                  <span className={`font-semibold ${parseFloat(b.balance) < parseFloat(threshold) ? 'text-red-600' : 'text-emerald-600'}`}>
                    {b.balance} kredi
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(b.updatedAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => {
                      setSelectedBalance(b);
                      setShowDetailModal(true);
                      loadTransactions(b.institutionUserId);
                    }}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                    title="İncele"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                      <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </td>
              </tr>
            )) : (
              <tr><td className="px-6 py-6 text-gray-500" colSpan={4}>Kayıt bulunamadı.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showDetailModal && selectedBalance && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => { setShowDetailModal(false); setSelectedBalance(null); setTopupAmount(''); setTransactions([]); setTransactionFilter('all'); }}
        >
          <div
            className="w-full max-w-2xl rounded-xl bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600">
              <div className="text-lg font-semibold text-white">Kredi Detayları</div>
              <button className="text-white/80 hover:text-white" onClick={() => { setShowDetailModal(false); setSelectedBalance(null); setTopupAmount(''); setTransactions([]); setTransactionFilter('all'); }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="px-6 py-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Manuel Kredi Yükle */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Manuel Kredi Yükle
                </h3>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Miktar (kredi)</label>
                    <input
                      type="number"
                      value={topupAmount}
                      onChange={e => setTopupAmount(e.target.value)}
                      placeholder="100"
                      className="input w-full"
                    />
                  </div>
                  <button onClick={handleTopup} className="btn-primary whitespace-nowrap">
                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Kredi Ekle
                  </button>
                </div>
              </div>

              {/* Kurum Bilgileri */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-gray-50">
                  <div className="text-sm text-gray-600 mb-1">Kurum</div>
                  <div className="text-lg font-semibold text-gray-900">{selectedBalance.institutionName}</div>
                </div>
                <div className="p-4 rounded-lg bg-gray-50">
                  <div className="text-sm text-gray-600 mb-1">Mevcut Kredi</div>
                  <div className={`text-2xl font-bold ${parseFloat(selectedBalance.balance) < parseFloat(threshold) ? 'text-red-600' : 'text-emerald-600'}`}>
                    {selectedBalance.balance} kredi
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-gray-50">
                <div className="text-sm text-gray-600 mb-1">Son Güncelleme</div>
                <div className="text-base text-gray-900">{new Date(selectedBalance.updatedAt).toLocaleString('tr-TR')}</div>
              </div>

              {/* İşlem Geçmişi */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    İşlem Geçmişi
                  </h3>
                  <div className="flex gap-2">
                    {(['all', 'credit', 'debit', 'refund'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setTransactionFilter(type)}
                        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${transactionFilter === type
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                      >
                        {type === 'all' ? 'Tümü' : type === 'credit' ? 'Yükleme' : type === 'debit' ? 'Harcama' : 'İade'}
                      </button>
                    ))}
                  </div>
                </div>

                {loadingTransactions ? (
                  <div className="text-center py-8 text-gray-500">
                    <Loading label="Yükleniyor..." />
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm">Henüz işlem kaydı bulunmuyor</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {transactions
                      .filter(t => transactionFilter === 'all' || t.type === transactionFilter)
                      .map(transaction => (
                        <div key={transaction.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${transaction.type === 'credit' ? 'bg-green-100 text-green-600' :
                            transaction.type === 'debit' ? 'bg-red-100 text-red-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                            {transaction.type === 'credit' ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            ) : transaction.type === 'debit' ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                            <div className="text-xs text-gray-500">{new Date(transaction.createdAt).toLocaleString('tr-TR')}</div>
                          </div>
                          <div className={`text-base font-semibold ${transaction.type === 'credit' || transaction.type === 'refund' ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {transaction.type === 'credit' || transaction.type === 'refund' ? '+' : '-'}
                            {transaction.amount} kredi
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credit Packages Modal */}
      <CreditPackagesModal
        isOpen={showPackagesModal}
        onClose={() => setShowPackagesModal(false)}
      />
    </div>
  );
}
