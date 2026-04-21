"use client";

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { CertificateRenderer } from '@/components/certificates/CertificateRenderer';
import type { CertificateData, CertificateTemplateType } from '@/types/certificate';
import { useLanguage } from '@/contexts/LanguageContext';

type Settings = {
  name: string;
  email: string;
  phone: string;
  address: string;
  primaryColor: string; // hex
  secondaryColor: string; // hex
  defaultTemplate: string; // certificate template key
};

const DEFAULTS: Settings = {
  name: 'Institution Corp',
  email: 'contact@institutioncorp.com',
  phone: '+90 212 555 00 00',
  address: 'Büyükdere Cad. No:1, Şişli / İstanbul',
  primaryColor: '#0945A5',
  secondaryColor: '#7c3aed',
  defaultTemplate: 'classic',
};

// Ana renkler öncelikli sıralama: Sarı, Kırmızı, Mavi, Yeşil, Mor, Turuncu, Kahverengi, Pembe, Siyah
const BASE_COLORS: { name: string; hex: string }[] = [
  { name: 'Sarı', hex: '#f59e0b' },
  { name: 'Kırmızı', hex: '#ef4444' },
  { name: 'Mavi', hex: '#3b82f6' },
  { name: 'Yeşil', hex: '#10b981' },
  { name: 'Mor', hex: '#8b5cf6' },
  { name: 'Turuncu', hex: '#f97316' },
  { name: 'Kahverengi', hex: '#8B5E3C' },
  { name: 'Pembe', hex: '#ec4899' },
  { name: 'Siyah', hex: '#111827' },
];

// Generate color tones for each base color
const generateColorTones = (baseHex: string): string[] => {
  // Convert hex to HSL for easier manipulation
  const hexToHsl = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return [h * 360, s * 100, l * 100];
  };

  // Convert HSL back to hex
  const hslToHex = (h: number, s: number, l: number) => {
    h /= 360; s /= 100; l /= 100;
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    const toHex = (c: number) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const [h, s, l] = hexToHsl(baseHex);
  const tones = [];

  // Generate 5 tones: lighter to darker
  for (let i = 0; i < 5; i++) {
    const newL = Math.max(10, Math.min(90, l + (2 - i) * 15));
    tones.push(hslToHex(h, s, newL));
  }

  return tones;
};

// All available certificate templates with system key names
const TEMPLATES = [
  { key: 'classic', name: 'Klasik (classic)', description: 'Geleneksel ve resmi görünüm' },
  { key: 'modern', name: 'Modern (modern)', description: 'Minimal ve çağdaş tasarım' },
  { key: 'creative', name: 'Yaratıcı (creative)', description: 'Renkli ve dinamik tasarım' },
  { key: 'elegant', name: 'Elegant (elegant)', description: 'Zarif dalga desenleri' },
  { key: 'professional', name: 'Profesyonel (professional)', description: 'Çizgili çerçeve, kurumsal' },
  { key: 'executive', name: 'Yönetici (executive)', description: 'Altın dekoratif çerçeve' },
  { key: 'minimal', name: 'Minimal (minimal)', description: 'Temiz tasarım, çift imza alanı' },
] as const;

const makePreviewData = (templateKey: CertificateTemplateType, primary: string, secondary: string): CertificateData => ({
  certificateNumber: 'CRT-XXXX',
  publicId: 'PREVIEW',
  dateIssued: new Date().toISOString(),
  studentName: 'Ad Soyad',
  studentTc: '00000000000',
  trainingName: 'Eğitim Başlığı',
  trainingDescription: 'Kısa açıklama',
  trainingHours: 40,
  trainingLevel: undefined,
  trainingLanguage: undefined,
  institutionName: 'Kurum',
  institutionLogo: undefined,
  partners: [],
  siteName: 'Mert CIN Certificates',
  primaryColor: primary,
  secondaryColor: secondary,
  templateKey,
});

export default function SettingsPage() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [customPrimaryHex, setCustomPrimaryHex] = useState('');
  const [customSecondaryHex, setCustomSecondaryHex] = useState('');
  const [showPrimaryPicker, setShowPrimaryPicker] = useState(false);
  const [showSecondaryPicker, setShowSecondaryPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/organization');
        if (res.ok) {
          const data = await res.json();
          const org = data.organization || {};
          setSettings(s => ({
            ...s,
            name: org.name || s.name,
            email: org.infoEmail || s.email,
            phone: org.phone || s.phone,
            address: org.address || s.address,
            primaryColor: org.primaryColor || s.primaryColor,
            secondaryColor: org.secondaryColor || s.secondaryColor,
            defaultTemplate: org.defaultTemplate || s.defaultTemplate,
            logo: org.logo || null,
          }));
        } else {
          const raw = localStorage.getItem('institution.settings');
          if (raw) {
            const parsed = JSON.parse(raw) as Partial<Settings>;
            setSettings({ ...DEFAULTS, ...parsed });
          }
        }
      } catch {
        try {
          const raw = localStorage.getItem('institution.settings');
          if (raw) {
            const parsed = JSON.parse(raw) as Partial<Settings>;
            setSettings({ ...DEFAULTS, ...parsed });
          }
        } catch { }
      }
    })();
  }, []);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/organization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: settings.name,
          infoEmail: settings.email,
          phone: settings.phone,
          address: settings.address,
          primaryColor: settings.primaryColor,
          secondaryColor: settings.secondaryColor,
          defaultTemplate: settings.defaultTemplate,
        }),
      });
      if (res.ok) {
        localStorage.setItem('institution.settings', JSON.stringify(settings));
        localStorage.setItem('institution_primary_color', settings.primaryColor);
        localStorage.setItem('institution_secondary_color', settings.secondaryColor);
        localStorage.setItem('institution_default_template', settings.defaultTemplate);
        alert(t('institution.settings.messages.saveSuccess'));
      } else {
        alert(t('institution.settings.messages.saveError'));
      }
    } catch {
      alert(t('institution.settings.messages.saveErrorUnknown'));
    } finally {
      setSaving(false);
    }
  };

  const reset = () => setSettings(DEFAULTS);

  const renderColorSection = (
    title: string,
    colorType: 'primary' | 'secondary',
    selectedColor: string,
    customHex: string,
    setCustomHex: (v: string) => void,
    showPicker: boolean,
    setShowPicker: (v: boolean) => void
  ) => (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">{title}</label>

      {/* 32'li Palet (8 baz x 4 ton) */}
      <div className="grid grid-cols-8 gap-2">
        {BASE_COLORS.flatMap((base) => generateColorTones(base.hex).slice(0, 4).map((hex, idx) => ({ key: `${base.name}-${idx}`, hex }))).map((c) => (
          <button
            key={c.key}
            onClick={() => setSettings(s => ({ ...s, [colorType === 'primary' ? 'primaryColor' : 'secondaryColor']: c.hex }))}
            className={`w-8 h-8 rounded-md border transition-all ${selectedColor === c.hex ? 'ring-2 ring-blue-500 border-gray-900' : 'border-gray-300 hover:scale-110'}`}
            style={{ backgroundColor: c.hex }}
            title={c.hex}
          />
        ))}
      </div>

      {/* Custom Color Input */}
      <div className="border-t pt-3">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="btn-secondary text-sm"
          >
            {showPicker ? 'Gizle' : 'Özel Renk Kodu'}
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg border-2 border-gray-300"
              style={{ backgroundColor: selectedColor }}
            />
            <code className="px-2 py-1 rounded bg-gray-50 border text-xs text-gray-600 font-mono">
              {selectedColor.toUpperCase()}
            </code>
          </div>
        </div>

        {showPicker && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={customHex}
                onChange={(e) => setCustomHex(e.target.value)}
                placeholder="#FF5733"
                className="input text-sm font-mono flex-1"
                maxLength={7}
              />
              <button
                onClick={() => {
                  const hex = customHex.startsWith('#') ? customHex : `#${customHex}`;
                  if (/^#[0-9A-F]{6}$/i.test(hex)) {
                    setSettings(s => ({ ...s, [colorType === 'primary' ? 'primaryColor' : 'secondaryColor']: hex }));
                    setCustomHex('');
                  }
                }}
                className="btn-primary px-3 text-sm"
                disabled={!customHex.trim()}
              >
                Uygula
              </button>
            </div>
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => setSettings(s => ({ ...s, [colorType === 'primary' ? 'primaryColor' : 'secondaryColor']: e.target.value }))}
              className="w-full h-10 rounded border border-gray-300 cursor-pointer"
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold gradient-text">{t('institution.settings.title')}</h1>
        <p className="text-gray-600 mb-4">{t('institution.settings.subtitle')}</p>
      </div>

      {/* Color selection */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800">{t('institution.settings.certificateColors')}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Primary Color */}
          <div className="bg-white border rounded-lg p-4">
            {renderColorSection(
              t('institution.settings.primaryColor'),
              'primary',
              settings.primaryColor,
              customPrimaryHex,
              setCustomPrimaryHex,
              showPrimaryPicker,
              setShowPrimaryPicker
            )}
          </div>

          {/* Secondary Color */}
          <div className="bg-white border rounded-lg p-4">
            {renderColorSection(
              t('institution.settings.secondaryColor'),
              'secondary',
              settings.secondaryColor,
              customSecondaryHex,
              setCustomSecondaryHex,
              showSecondaryPicker,
              setShowSecondaryPicker
            )}
          </div>
        </div>

        <p className="text-xs text-gray-500">
          Ana renk başlıklar ve kenarlıklarda, ikincil renk vurgular ve alt başlıklarda kullanılır.
        </p>
      </div>

      {/* Certificate template selection */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-gray-800">{t('institution.settings.defaultTemplate')}</h2>
        <p className="text-sm text-gray-500">{t('institution.settings.templateNote')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {TEMPLATES.map(tmpl => (
            <button
              key={tmpl.key}
              onClick={() => setSettings(s => ({ ...s, defaultTemplate: tmpl.key }))}
              className={`text-left rounded-xl border transition-all bg-white hover:shadow-md ${settings.defaultTemplate === tmpl.key ? 'border-blue-600 ring-2 ring-blue-600/30' : 'border-gray-200'}`}
            >
              <div className="p-3 border-b border-gray-100">
                <div className="font-medium text-sm">{tmpl.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{tmpl.description}</div>
              </div>
              <div className="p-2">
                <div className="rounded-lg flex items-center justify-center overflow-hidden bg-gray-50" style={{ width: '100%', height: 140 }}>
                  <div style={{ transform: 'scale(0.15)', transformOrigin: 'center' }}>
                    <CertificateRenderer data={makePreviewData(tmpl.key as CertificateTemplateType, settings.primaryColor, settings.secondaryColor)} scale={1} />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={reset} className="btn-secondary">Varsayılanlar</button>
        <button onClick={save} className={`btn-primary ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}>{saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</button>
      </div>
    </div>
  );
}
