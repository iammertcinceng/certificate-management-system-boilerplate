"use client";

import { useEffect, useState } from 'react';

export default function SiteSettingsPage() {
  const [siteName, setSiteName] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/system-config', { cache: 'no-store' });
        const data = res.ok ? await res.json() : {};
        setSiteName(data.siteName || 'Mert CIN Certificates');
        setSiteUrl(data.siteUrl || '');
        setSupportEmail(data.supportEmail || 'mertcin0@outlook.com');
        setSeoTitle(data.seoTitle || '');
        setSeoDescription(data.seoDescription || '');
        setSeoKeywords(data.seoKeywords || '');
      } catch { }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    try {
      const res = await fetch('/api/system-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteName,
          siteUrl,
          supportEmail,
          seoTitle,
          seoDescription,
          seoKeywords,
        }),
      });
      if (res.ok) {
        alert('Ayarlar kaydedildi.');
      }
    } catch { }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Site Ayarları</h1>
        <p className="text-gray-600 mt-2">Genel site bilgileri ve SEO ayarları.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Genel Bilgiler</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site Adı</label>
              <input
                type="text"
                value={siteName}
                onChange={e => setSiteName(e.target.value)}
                className="input w-full"
                placeholder="Mert CIN Certificates"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site URL</label>
              <input
                type="text"
                value={siteUrl}
                onChange={e => setSiteUrl(e.target.value)}
                className="input w-full"
                placeholder="https://example.com"
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">İletişim</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destek E-postası</label>
              <input
                type="email"
                value={supportEmail}
                onChange={e => setSupportEmail(e.target.value)}
                className="input w-full"
                placeholder="mertcin0@outlook.com"
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">SEO Ayarları</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SEO Başlık</label>
              <input
                type="text"
                value={seoTitle}
                onChange={e => setSeoTitle(e.target.value)}
                className="input w-full"
                placeholder="Güvenilir Sertifika Yönetimi"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SEO Açıklama</label>
              <textarea
                value={seoDescription}
                onChange={e => setSeoDescription(e.target.value)}
                className="input w-full"
                rows={3}
                placeholder="Site açıklaması..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SEO Anahtar Kelimeler (virgülle ayrılmış)</label>
              <input
                type="text"
                value={seoKeywords}
                onChange={e => setSeoKeywords(e.target.value)}
                className="input w-full"
                placeholder="sertifika, eğitim, doğrulama"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button onClick={handleSave} className="btn-primary">Kaydet</button>
        </div>
      </div>
    </div>
  );
}

