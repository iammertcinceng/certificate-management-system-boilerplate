"use client";

import { useEffect, useState } from 'react';
import Loading from '@/components/Loading';

type CreditPackage = {
    id: string;
    credits: number;
    priceUsd: string;
    sortOrder: number;
};

interface CreditPackagesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreditPackagesModal({ isOpen, onClose }: CreditPackagesModalProps) {
    const [packages, setPackages] = useState<CreditPackage[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editCredits, setEditCredits] = useState('');
    const [editPrice, setEditPrice] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [newCredits, setNewCredits] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadPackages();
        }
    }, [isOpen]);

    // ESC to close
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    const loadPackages = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/credit-packages');
            if (res.ok) {
                const data = await res.json();
                setPackages(data.packages || []);
            }
        } catch { }
        setLoading(false);
    };

    const handleEdit = (pkg: CreditPackage) => {
        setEditingId(pkg.id);
        setEditCredits(String(pkg.credits));
        setEditPrice(pkg.priceUsd);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditCredits('');
        setEditPrice('');
    };

    const handleSaveEdit = async (id: string) => {
        if (!editCredits || !editPrice) return;
        setSaving(true);
        try {
            const res = await fetch('/api/admin/credit-packages', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, credits: parseInt(editCredits), priceUsd: editPrice }),
            });
            if (res.ok) {
                await loadPackages();
                handleCancelEdit();
            }
        } catch { }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu kredi paketini silmek istediğinizden emin misiniz?')) return;
        try {
            const res = await fetch(`/api/admin/credit-packages?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                await loadPackages();
            }
        } catch { }
    };

    const handleAdd = async () => {
        if (!newCredits || !newPrice) return;
        setSaving(true);
        try {
            const res = await fetch('/api/admin/credit-packages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    credits: parseInt(newCredits),
                    priceUsd: newPrice,
                    sortOrder: packages.length + 1,
                }),
            });
            if (res.ok) {
                await loadPackages();
                setNewCredits('');
                setNewPrice('');
                setShowAddForm(false);
            }
        } catch { }
        setSaving(false);
    };

    const handleSeed = async () => {
        if (!confirm('Varsayılan kredi paketlerini yüklemek istiyor musunuz? Mevcut paketler korunacaktır.')) return;
        setSaving(true);
        try {
            const res = await fetch('/api/admin/credit-packages/seed', { method: 'POST' });
            if (res.ok) {
                await loadPackages();
                alert('Kredi paketleri başarıyla yüklendi.');
            }
        } catch { }
        setSaving(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-emerald-600 to-teal-600">
                    <div className="flex items-center gap-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-lg font-semibold text-white">Kredi Paketleri</span>
                    </div>
                    <button className="text-white/80 hover:text-white" onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
                    {loading ? (
                        <div className="py-8"><Loading label="Yükleniyor..." /></div>
                    ) : packages.length === 0 ? (
                        <div className="text-center py-8">
                            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <p className="text-gray-500 mb-4">Henüz kredi paketi tanımlanmamış.</p>
                            <button onClick={handleSeed} className="btn-primary" disabled={saving}>
                                {saving ? 'Yükleniyor...' : 'Varsayılan Paketleri Yükle'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Table */}
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-500 border-b">
                                        <th className="pb-3 font-medium">Kredi</th>
                                        <th className="pb-3 font-medium">Fiyat (USD)</th>
                                        <th className="pb-3 font-medium">Birim Fiyat</th>
                                        <th className="pb-3 font-medium text-right">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {packages.map(pkg => (
                                        <tr key={pkg.id} className="hover:bg-gray-50 h-14">
                                            {editingId === pkg.id ? (
                                                <>
                                                    <td className="py-2">
                                                        <input
                                                            type="number"
                                                            value={editCredits}
                                                            onChange={e => setEditCredits(e.target.value)}
                                                            className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm"
                                                        />
                                                    </td>
                                                    <td className="py-2">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={editPrice}
                                                            onChange={e => setEditPrice(e.target.value)}
                                                            className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm"
                                                        />
                                                    </td>
                                                    <td className="py-2 text-gray-400">-</td>
                                                    <td className="py-2 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button
                                                                onClick={() => handleSaveEdit(pkg.id)}
                                                                disabled={saving}
                                                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                                                title="Kaydet"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={handleCancelEdit}
                                                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                                                                title="İptal"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="py-2 font-semibold text-gray-900">{pkg.credits} kredi</td>
                                                    <td className="py-2 text-gray-700">${pkg.priceUsd}</td>
                                                    <td className="py-2 text-gray-500">
                                                        ${(parseFloat(pkg.priceUsd) / pkg.credits).toFixed(2)}/kredi
                                                    </td>
                                                    <td className="py-2 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button
                                                                onClick={() => handleEdit(pkg)}
                                                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                                                title="Düzenle"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(pkg.id)}
                                                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                                                title="Sil"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Add new package */}
                            {showAddForm ? (
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <h4 className="text-sm font-medium text-gray-700 mb-3">Yeni Paket Ekle</h4>
                                    <div className="flex items-end gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Kredi</label>
                                            <input
                                                type="number"
                                                value={newCredits}
                                                onChange={e => setNewCredits(e.target.value)}
                                                placeholder="100"
                                                className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Fiyat ($)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={newPrice}
                                                onChange={e => setNewPrice(e.target.value)}
                                                placeholder="50.00"
                                                className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm"
                                            />
                                        </div>
                                        <button onClick={handleAdd} className="btn-primary text-sm" disabled={saving}>
                                            Ekle
                                        </button>
                                        <button onClick={() => { setShowAddForm(false); setNewCredits(''); setNewPrice(''); }} className="btn-secondary text-sm">
                                            İptal
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => setShowAddForm(true)} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                                    + Yeni Paket Ekle
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
