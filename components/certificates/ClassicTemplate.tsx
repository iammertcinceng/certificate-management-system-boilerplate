'use client';

import React from 'react';
import { CertificateData } from '@/types/certificate';
import Image from 'next/image';

interface ClassicTemplateProps {
  data: CertificateData;
  scale?: number;
  isPdf?: boolean;
}

export const ClassicTemplate: React.FC<ClassicTemplateProps> = ({ data, scale = 1, isPdf = false }) => {
  const {
    certificateCode,
    dateIssued,
    studentName,
    studentTc,
    trainingName,
    trainingDescription,
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
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format short date for range
  const formatShortDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
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
        {/* Decorative Border */}
        <div
          className="absolute inset-4 border-8 rounded-sm"
          style={{
            borderColor: primaryColor,
          }}
        >
          <div
            className="absolute inset-2 border-2 rounded-sm"
            style={{
              borderColor: secondaryColor,
            }}
          />
        </div>

        {/* Mert CIN Logo - Top Left */}
        <div className="absolute top-12 left-12 z-20 flex items-center gap-3">
          <div className="w-14 h-14 relative">
            {siteLogo ? (
              <Image
                src={siteLogo}
                alt={siteName || 'Mert CIN Certification'}
                width={56}
                height={56}
                className="object-contain"
                priority
                unoptimized
              />
            ) : (
              <Image
                src="/mertcin-anonym-logo.png"
                alt="Mert CIN Certification"
                width={56}
                height={56}
                className="object-contain"
                priority
              />
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
            <div className="bg-white p-3 rounded border-2" style={{ borderColor: primaryColor }}>
              <Image src={qrCode} alt="QR Code" width={80} height={80} unoptimized />
            </div>
          )}
          <div className="text-right">
            <p className="text-xs text-gray-500">Sertifika No</p>
            <p className="text-sm font-mono font-semibold" style={{ color: primaryColor }}>
              {certificateCode}
            </p>
          </div>
        </div>

        {/* Content Container - CENTERED */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-24 py-20">
          {/* Header */}
          <div className="text-center mb-8">
            <h1
              className="text-5xl font-bold uppercase tracking-wider mb-2"
              style={{ color: primaryColor }}
            >
              Sertifika
            </h1>
            <p className="text-lg text-gray-600">Certificate of Completion</p>
          </div>

          {/* Main Content - CENTERED */}
          <div className="flex flex-col items-center justify-center text-center max-w-4xl mb-10">
            <p className="text-xl text-gray-700 mb-6">İşbu belge ile</p>

            <h2
              className="text-6xl font-bold mb-6 border-b-4 pb-4 px-12"
              style={{
                color: primaryColor,
                borderColor: secondaryColor,
              }}
            >
              {studentName}
            </h2>

            <p className="text-lg text-gray-700 mb-4 leading-relaxed max-w-3xl">
              {studentTc && (
                <span className="text-sm text-gray-600 block mb-2">(T.C. Kimlik No: {studentTc})</span>
              )}
              kişisinin "<span className="font-semibold" style={{ color: secondaryColor }}>{trainingName}</span>"
              eğitim programını başarıyla tamamladığını ve gerekli yeterliliklere sahip olduğunu
              onaylar.
            </p>

            {trainingHours && (
              <p className="text-base text-gray-600 mt-4">
                Eğitim Süresi: <span className="font-semibold">{trainingHours} Saat</span>
              </p>
            )}
          </div>

          {/* Date Section */}
          <div className="text-center mb-6">
            {trainingStartDate && trainingEndDate ? (
              <>
                <p className="text-sm text-gray-500">Eğitim Tarihi</p>
                <p className="text-base font-semibold text-gray-800">
                  {formatShortDate(trainingStartDate)} - {formatShortDate(trainingEndDate)}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500">Veriliş Tarihi</p>
                <p className="text-base font-semibold text-gray-800">
                  {formatDate(dateIssued)}
                </p>
              </>
            )}
          </div>

          {/* Footer - Organizations with Signatures */}
          <div className="w-full mt-auto">
            <div className="flex items-center justify-center gap-8 mb-6">
              {/* Institution */}
              <div className="flex flex-col items-center">
                {institutionSignature && (
                  <div className="h-12 flex items-end mb-1">
                    <Image src={institutionSignature} alt="Kurum İmzası" width={100} height={40} className="object-contain" unoptimized />
                  </div>
                )}
                <div className="w-28 h-px bg-gray-400 mb-1" />
                {institutionLogo && (
                  <div className="w-14 h-14 relative mb-1">
                    <Image src={institutionLogo} alt={institutionName} fill className="object-contain" unoptimized />
                  </div>
                )}
                {institutionSignatureName ? (
                  <>
                    <p className="text-sm font-semibold text-gray-800">{institutionSignatureName}</p>
                    {institutionSignatureTitle && (
                      <p className="text-xs text-gray-500">{institutionSignatureTitle}</p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-gray-800">{institutionName}</p>
                    <p className="text-xs text-gray-500">Eğitim Kurumu</p>
                  </>
                )}
              </div>

              {/* Divider */}
              {partners.length > 0 && (
                <div className="h-24 w-px bg-gray-300" />
              )}

              {/* Partners with signatures */}
              {partners.map((partner, index) => (
                <React.Fragment key={index}>
                  <div className="flex flex-col items-center">
                    {partner.signature && (
                      <div className="h-12 flex items-end mb-1">
                        <Image src={partner.signature} alt={`${partner.name} İmzası`} width={100} height={40} className="object-contain" unoptimized />
                      </div>
                    )}
                    <div className="w-28 h-px bg-gray-400 mb-1" />
                    {partner.logo && (
                      <div className="w-14 h-14 relative mb-1">
                        <Image src={partner.logo} alt={partner.name} fill className="object-contain" unoptimized />
                      </div>
                    )}
                    {partner.signatureName ? (
                      <>
                        <p className="text-sm font-semibold text-gray-800">{partner.signatureName}</p>
                        {partner.signatureTitle && (
                          <p className="text-xs text-gray-500">{partner.signatureTitle}</p>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-gray-800">{partner.name}</p>
                        <p className="text-xs text-gray-500">Partner</p>
                      </>
                    )}
                  </div>
                  {index < partners.length - 1 && (
                    <div className="h-24 w-px bg-gray-300" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Decorative Corner Elements */}
        <div
          className="absolute top-8 left-8 w-16 h-16 border-t-4 border-l-4 rounded-tl-lg"
          style={{ borderColor: secondaryColor }}
        />
        <div
          className="absolute top-8 right-8 w-16 h-16 border-t-4 border-r-4 rounded-tr-lg"
          style={{ borderColor: secondaryColor }}
        />
        <div
          className="absolute bottom-8 left-8 w-16 h-16 border-b-4 border-l-4 rounded-bl-lg"
          style={{ borderColor: secondaryColor }}
        />
        <div
          className="absolute bottom-8 right-8 w-16 h-16 border-b-4 border-r-4 rounded-br-lg"
          style={{ borderColor: secondaryColor }}
        />
      </div>
    </div>
  );
};
