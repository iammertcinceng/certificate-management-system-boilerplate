'use client';

import { useRef } from 'react';
import { toPng } from 'html-to-image';

interface AchievementBadgeProps {
  studentName: string;
  trainingName: string;
  dateIssued: string;
  onDownload?: () => void;
}

const EMPTY_BADGE_IMAGE_URL = "/empty-professional-badge.png";

export function AchievementBadge({
  studentName,
  trainingName,
  dateIssued,
  onDownload
}: AchievementBadgeProps) {
  const badgeRef = useRef<HTMLDivElement>(null);

  const generateBadgeImage = async (): Promise<string | null> => {
    if (!badgeRef.current) return null;

    try {
      const dataUrl = await toPng(badgeRef.current, {
        quality: 1,
        pixelRatio: 3,
        backgroundColor: 'transparent',
      });
      return dataUrl;
    } catch (error) {
      console.error('Rozet görseli oluşturulamadı:', error);
      return null;
    }
  };

  const handleDownload = async () => {
    const dataUrl = await generateBadgeImage();
    if (!dataUrl) return;

    // data URL'yi blob'a çevir ve düzgün MIME type ile indir
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.download = `Mert CIN-badge-${studentName.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: direkt data URL kullan
      const link = document.createElement('a');
      link.download = `Mert CIN-badge-${studentName.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    }

    onDownload?.();
  };

  const getTrainingFontSize = (text: string) => {
    const len = text.length;
    // Referans: 24 karakter = 0.90rem (210px'e tam oturdu)
    // Formül: font_size ≈ 21.6 / karakter_sayısı
    if (len <= 4) return '2.4rem';       // 21.6/4 = 5.4 → capped
    if (len <= 6) return '2.1rem';       // 21.6/6 = 3.6 → capped
    if (len <= 8) return '1.9rem';       // 21.6/8 = 2.7 → capped
    if (len <= 10) return '1.7rem';      // 21.6/10 = 2.16
    if (len <= 12) return '1.5rem';      // 21.6/12 = 1.8
    if (len <= 14) return '1.35rem';     // 21.6/14 = 1.54
    if (len <= 16) return '1.2rem';      // 21.6/16 = 1.35
    if (len <= 18) return '1.1rem';      // 21.6/18 = 1.2
    if (len <= 20) return '1.0rem';      // 21.6/20 = 1.08
    if (len <= 22) return '0.95rem';     // 21.6/22 = 0.98
    if (len <= 24) return '0.90rem';     // REFERANS ✓
    if (len <= 26) return '0.83rem';     // 21.6/26 = 0.83
    if (len <= 28) return '0.77rem';     // 21.6/28 = 0.77
    if (len <= 30) return '0.72rem';     // 21.6/30 = 0.72
    if (len <= 33) return '0.65rem';     // 21.6/33 = 0.65
    if (len <= 36) return '0.60rem';     // 21.6/36 = 0.60
    if (len <= 40) return '0.54rem';     // 21.6/40 = 0.54
    if (len <= 45) return '0.48rem';     // 21.6/45 = 0.48
    return '0.43rem';                    // 45+ karakter
  };

  // Kişi adı için font boyutu (boşluklar dahil)
  // Rozet metin alanı ~ 200px genişliğinde
  const getNameFontSize = (text: string) => {
    const len = text.length; // Boşluklar dahil
    if (len <= 6) return '1.9rem';      // "Ali V."
    if (len <= 8) return '1.7rem';      // "Ali Veli"
    if (len <= 10) return '1.6rem';    // "Mert Çin"
    if (len <= 12) return '1.5rem';     // "Mert Çinceng"
    if (len <= 14) return '1.4rem';     // "Ahmet Mehmet"
    if (len <= 16) return '1.3rem';     // "Ahmet Mehmetoğlu"
    if (len <= 18) return '1.1rem';     // "Mert Çins Abcdefg"
    if (len <= 20) return '1.0rem';     // Uzun isimler
    if (len <= 22) return '0.95rem';
    if (len <= 24) return '0.90rem';
    if (len <= 26) return '0.85rem';
    if (len <= 28) return '0.80rem';
    if (len <= 30) return '0.75rem';
    return '0.70rem';                   // 30+ karakter
  };

  const formattedDate = new Date(dateIssued).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col items-center gap-8 p-6 bg-gray-50">
      {/* Badge Container - Fixed dimensions matching badge image aspect ratio */}
      <div
        ref={badgeRef}
        className="relative w-[400px] h-[400px]"
        style={{
          backgroundImage: `url(${EMPTY_BADGE_IMAGE_URL})`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center'
        }}
      >
        {/* 
          Konumlandırma:
          - Mavi-mor gradient bant (top ~32%): Eğitim adı
          - Orta yeşil-mavi alan (top ~46%): Kişi adı  
          - Alt kısım (top ~78%): Tarih
        */}

        {/* Eğitim Adı - Üst mavi kısım */}
        <div
          className="absolute left-0 right-0 flex items-center justify-center px-12"
          style={{ top: '36%' }}
        >
          <p
            className="font-bold text-white text-center leading-tight uppercase tracking-wide"
            style={{
              fontSize: getTrainingFontSize(trainingName),
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              maxWidth: '210px',
              wordBreak: 'break-word',
            }}
          >
            {trainingName}
          </p>
        </div>

        {/* Kişi Adı - Orta alan */}
        <div
          className="absolute left-0 right-0 flex items-center justify-center px-8"
          style={{ top: '50%' }}
        >
          <h2
            className="font-extrabold text-white text-center leading-tight"
            style={{
              fontSize: getNameFontSize(studentName),
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              maxWidth: '210px',
              wordBreak: 'break-word',
            }}
          >
            {studentName}
          </h2>
        </div>

        {/* Tarih - Alt kısım */}
        <div
          className="absolute left-0 right-0 flex items-center justify-center"
          style={{ top: '78%' }}
        >
          <p
            className="font-semibold text-center"
            style={{
              fontSize: '0.85rem',
              color: '#2d4a5e', // Koyu mavi-gri ton
              backgroundColor: 'gradient',
              textShadow: '0 1px 3px rgba(255,255,255,0.8), 0 -1px 1px rgba(0,0,0,0.2)',
            }}
          >
            {formattedDate}
          </p>
        </div>
      </div>

      {/* İndirme Butonu */}
      <button
        onClick={handleDownload}
        className="px-10 py-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-3 text-lg"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        PNG Olarak İndir
      </button>
    </div>
  );
}