'use client';

import React from 'react';
import { CertificateData } from '@/types/certificate';
import Image from 'next/image';

interface ModernTemplateProps {
  data: CertificateData;
  scale?: number;
  isPdf?: boolean;
}

export const ModernTemplate: React.FC<ModernTemplateProps> = ({ data, scale = 1, isPdf = false }) => {
  const {
    certificateCode,
    dateIssued,
    studentName,
    studentTc,
    trainingName,
    trainingHours,
    trainingStartDate,
    trainingEndDate,
    institutionName,
    institutionLogo,
    institutionSignature,
    institutionSignatureName,
    institutionSignatureTitle,
    partners,
    siteLogo,
    siteName,
    primaryColor,
    secondaryColor,
    qrCode,
  } = data;

  // Format date helper
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div
      className="relative bg-white overflow-hidden"
      style={{
        width: `${1122 * scale}px`,
        height: `${794 * scale}px`,
        transformOrigin: 'top left',
      }}
    >
      <div
        style={{
          width: '1122px',
          height: '794px',
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {/* Top/Bottom Gradient Lines */}
        <div
          className="absolute top-0 left-0 w-full h-2"
          style={{
            background: `linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-full h-2"
          style={{
            background: `linear-gradient(90deg, ${secondaryColor} 0%, ${primaryColor} 100%)`,
          }}
        />

        {/* Side Accent */}
        <div
          className="absolute left-0 top-0 w-3 h-full"
          style={{ backgroundColor: primaryColor }}
        />

        {/* Site Logo - Top Left */}
        <div className="absolute top-8 left-8 z-20 flex items-center gap-3">
          <div className="w-14 h-14 flex items-center justify-center rounded-lg border" style={{ borderColor: primaryColor }}>
            {siteLogo ? (
              <Image src={siteLogo} alt={siteName || 'Mert CIN'} width={36} height={36} priority unoptimized />
            ) : (
              <Image src="/mertcin-anonym-logo.png" alt="Mert CIN" width={36} height={36} priority unoptimized />
            )}
          </div>
          <div>
            <div className="text-base font-bold text-gray-800">{siteName || 'Mert CIN'}</div>
            <div className="text-xs text-gray-600">Certification</div>
          </div>
        </div>

        {/* QR Code & Certificate Code - Top Right */}
        <div className="absolute top-12 right-12 z-20 flex flex-col items-end gap-2">
          {qrCode && (
            <div className="bg-white p-2 rounded border" style={{ borderColor: `${primaryColor}40` }}>
              <Image src={qrCode} alt="QR Code" width={70} height={70} unoptimized />
            </div>
          )}
          <div className="text-right">
            <p className="text-xs text-gray-400">Sertifika No</p>
            <p className="text-xs font-mono font-semibold" style={{ color: primaryColor }}>
              {certificateCode}
            </p>
          </div>
        </div>

        {/* Content Container - CENTERED */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-24 py-20">
          {/* Header */}
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">
              Certificate of Achievement
            </p>
            <h1
              className="text-4xl font-light tracking-wide"
              style={{ color: primaryColor }}
            >
              SERTIFIKA
            </h1>
          </div>

          {/* Main Content - CENTERED */}
          <div className="flex-1 flex flex-col items-center justify-center max-w-3xl">
            <p className="text-lg text-gray-500 mb-8 text-center">
              İşbu belge ile
            </p>

            <div className="mb-10">
              <div
                className="inline-block px-10 py-5"
                style={{
                  backgroundColor: `${primaryColor}10`,
                  borderLeft: `4px solid ${primaryColor}`,
                }}
              >
                <h2
                  className="text-5xl font-bold tracking-tight"
                  style={{ color: primaryColor }}
                >
                  {studentName}
                </h2>
              </div>
            </div>

            <p className="text-lg text-gray-700 mb-6 text-center leading-relaxed max-w-2xl">
              {studentTc && (
                <span className="text-sm text-gray-600 block mb-2">(T.C. Kimlik No: {studentTc})</span>
              )}
              kişisinin "<span className="font-semibold" style={{ color: secondaryColor }}>{trainingName}</span>"
              eğitim programını başarıyla tamamladığını ve gerekli yeterliliklere sahip olduğunu
              onaylar.
            </p>

            <div className="flex items-center gap-8 mt-6">
              {trainingHours && (
                <>
                  <div className="text-center">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                      Eğitim Süresi
                    </p>
                    <p className="text-lg font-semibold" style={{ color: primaryColor }}>
                      {trainingHours} Saat
                    </p>
                  </div>
                  <div className="h-8 w-px bg-gray-300" />
                </>
              )}
              <div className="text-center">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  {trainingStartDate && trainingEndDate ? 'Eğitim Tarihi' : 'Tarih'}
                </p>
                <p className="text-lg font-semibold" style={{ color: primaryColor }}>
                  {trainingStartDate && trainingEndDate
                    ? `${formatDate(trainingStartDate)} - ${formatDate(trainingEndDate)}`
                    : formatDate(dateIssued)}
                </p>
              </div>
            </div>
          </div>

          {/* Footer - Organizations with Signatures */}
          <div className="w-full mt-auto border-t pt-6" style={{ borderColor: `${primaryColor}20` }}>
            <div className="flex items-center justify-center gap-10">
              {/* Institution */}
              <div className="flex flex-col items-center">
                {institutionSignature && (
                  <div className="h-10 flex items-end mb-1">
                    <Image src={institutionSignature} alt="Kurum İmzası" width={80} height={32} className="object-contain" unoptimized />
                  </div>
                )}
                <div className="w-24 h-px bg-gray-400 mb-1" />
                <div className="flex items-center gap-3">
                  {institutionLogo && (
                    <div className="w-10 h-10 relative">
                      <Image src={institutionLogo} alt={institutionName} fill className="object-contain" unoptimized />
                    </div>
                  )}
                  <div>
                    {institutionSignatureName ? (
                      <>
                        <p className="text-sm font-semibold text-gray-800">{institutionSignatureName}</p>
                        {institutionSignatureTitle && (
                          <p className="text-xs text-gray-400">{institutionSignatureTitle}</p>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-gray-800">{institutionName}</p>
                        <p className="text-xs text-gray-400">Eğitim Sağlayıcı</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Partners */}
              {partners.map((partner, index) => (
                <React.Fragment key={index}>
                  <div className="h-16 w-px bg-gray-200" />
                  <div className="flex flex-col items-center">
                    {partner.signature && (
                      <div className="h-10 flex items-end mb-1">
                        <Image src={partner.signature} alt={`${partner.name} İmzası`} width={80} height={32} className="object-contain" unoptimized />
                      </div>
                    )}
                    <div className="w-24 h-px bg-gray-400 mb-1" />
                    <div className="flex items-center gap-3">
                      {partner.logo && (
                        <div className="w-10 h-10 relative">
                          <Image src={partner.logo} alt={partner.name} fill className="object-contain" unoptimized />
                        </div>
                      )}
                      <div>
                        {partner.signatureName ? (
                          <>
                            <p className="text-sm font-semibold text-gray-800">{partner.signatureName}</p>
                            {partner.signatureTitle && (
                              <p className="text-xs text-gray-400">{partner.signatureTitle}</p>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-semibold text-gray-800">{partner.name}</p>
                            <p className="text-xs text-gray-400">Partner</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div
          className="absolute top-20 right-20 w-32 h-32 rounded-full opacity-5"
          style={{ backgroundColor: primaryColor }}
        />
        <div
          className="absolute bottom-32 right-32 w-48 h-48 rounded-full opacity-5"
          style={{ backgroundColor: secondaryColor }}
        />
      </div>
    </div>
  );
};
