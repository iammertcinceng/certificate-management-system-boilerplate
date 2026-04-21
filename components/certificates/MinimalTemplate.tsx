'use client';

import React from 'react';
import { CertificateData } from '@/types/certificate';
import Image from 'next/image';

interface MinimalTemplateProps {
    data: CertificateData;
    scale?: number;
    isPdf?: boolean;
}

/**
 * Minimal Template - Inspired by Coachology style
 * Features: Clean design, gold accent lines, light background, dual signature layout
 */
export const MinimalTemplate: React.FC<MinimalTemplateProps> = ({ data, scale = 1, isPdf = false }) => {
    const {
        certificateCode,
        dateIssued,
        studentName,
        trainingName,
        trainingHours,
        trainingDescription,
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

    // Minimal uses cool tones with gold accents
    const mainColor = primaryColor || '#1E4D6B';
    const lineColor = secondaryColor || '#C4A052';
    const bgColor = '#E8F4F8';

    // Format date helper
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatShortDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    return (
        <div
            className="relative overflow-hidden"
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
                    backgroundColor: bgColor,
                }}
            >
                {/* === DECORATIVE ELEMENTS === */}
                {/* Top Left Circle */}
                <div
                    className="absolute -top-20 -left-20 w-64 h-64 rounded-full opacity-10"
                    style={{ backgroundColor: mainColor }}
                />
                {/* Bottom Right Circle */}
                <div
                    className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-10"
                    style={{ backgroundColor: mainColor }}
                />

                {/* === MAIN CONTENT === */}
                <div className="relative z-10 h-full flex flex-col px-20 py-12">
                    {/* Header Row - Logo and Badge */}
                    <div className="flex items-start justify-between mb-8">
                        {/* Site Logo + Institution */}
                        <div className="flex items-center gap-6">
                            {/* Site Logo */}
                            <div className="flex items-center gap-2">
                                {siteLogo ? (
                                    <Image src={siteLogo} alt={siteName || 'Mert CIN'} width={36} height={36} className="object-contain" unoptimized />
                                ) : (
                                    <Image src="/mertcin-anonym-logo.png" alt="Mert CIN" width={36} height={36} className="object-contain" unoptimized />
                                )}
                                <span className="text-sm font-semibold text-gray-500">{siteName || 'Mert CIN'}</span>
                            </div>

                            {/* Divider */}
                            <div className="h-10 w-px bg-gray-300" />

                            {/* Institution Logo */}
                            <div className="flex items-center gap-3">
                                {institutionLogo && (
                                    <Image
                                        src={institutionLogo}
                                        alt={institutionName}
                                        width={60}
                                        height={60}
                                        className="object-contain h-12"
                                        unoptimized
                                    />
                                )}
                                <span className="text-2xl font-bold" style={{ color: mainColor }}>{institutionName}</span>
                            </div>
                        </div>

                        {/* Partner Badge */}
                        {partners[0]?.logo && (
                            <div className="flex items-center gap-2">
                                <Image
                                    src={partners[0].logo}
                                    alt={partners[0].name}
                                    width={70}
                                    height={70}
                                    className="object-contain h-14"
                                    unoptimized
                                />
                            </div>
                        )}
                    </div>

                    {/* Certification Label */}
                    <p className="text-sm uppercase tracking-widest text-gray-500 mb-2">
                        Hereby Certifies That
                    </p>

                    {/* Student Name */}
                    <h2
                        className="text-5xl font-bold tracking-wide mb-6"
                        style={{ color: mainColor }}
                    >
                        {studentName}
                    </h2>

                    {/* Description */}
                    <div className="max-w-3xl mb-6">
                        <p className="text-sm text-gray-700 leading-relaxed">
                            has completed the {trainingHours && `${trainingHours} hour `}
                            {trainingName} Program, including all requirements, and demonstrated the highest degree of competence and skill.
                            {trainingDescription && ` ${trainingDescription}`}
                        </p>
                    </div>

                    {/* Training Title with Gold Lines */}
                    <div className="flex items-center gap-4 mb-2">
                        <div className="flex-1 h-px" style={{ backgroundColor: lineColor }} />
                    </div>

                    <h3
                        className="text-2xl font-bold uppercase tracking-wide text-center mb-2"
                        style={{ color: mainColor }}
                    >
                        {trainingName}
                    </h3>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 h-px" style={{ backgroundColor: lineColor }} />
                    </div>

                    {/* Subtitle with Date */}
                    <p className="text-sm text-gray-600 text-center mb-8">
                        with all the rights and privileges ensuing there-from. In witness thereof, the following
                        have affixed their signature here to on this, the{' '}
                        {trainingStartDate && trainingEndDate
                            ? `${formatShortDate(trainingStartDate)} - ${formatShortDate(trainingEndDate)}`
                            : formatDate(dateIssued)}
                    </p>

                    {/* === DUAL SIGNATURE SECTION === */}
                    <div className="w-full flex items-end justify-between px-8 mt-auto">
                        {/* Left Signature - Institution */}
                        <div className="flex flex-col items-center w-64">
                            {institutionSignature && (
                                <div className="h-14 flex items-end mb-1">
                                    <Image
                                        src={institutionSignature}
                                        alt="Signature"
                                        width={140}
                                        height={50}
                                        className="object-contain"
                                        unoptimized
                                    />
                                </div>
                            )}
                            <div className="w-full h-px mb-2" style={{ backgroundColor: lineColor }} />
                            {institutionSignatureName ? (
                                <>
                                    <p className="text-sm font-bold" style={{ color: mainColor }}>{institutionSignatureName}</p>
                                    {institutionSignatureTitle && (
                                        <p className="text-xs text-gray-500 text-center">{institutionSignatureTitle}</p>
                                    )}
                                </>
                            ) : (
                                <p className="text-sm font-bold" style={{ color: mainColor }}>{institutionName}</p>
                            )}
                        </div>

                        {/* Center - QR Code */}
                        {qrCode && (
                            <div className="bg-white p-2 rounded-lg shadow-sm border" style={{ borderColor: `${mainColor}20` }}>
                                <Image src={qrCode} alt="QR Code" width={50} height={50} unoptimized />
                            </div>
                        )}

                        {/* Right Signature - Partner (if exists) */}
                        {partners[0] && (
                            <div className="flex flex-col items-center w-64">
                                {partners[0].signature && (
                                    <div className="h-14 flex items-end mb-1">
                                        <Image
                                            src={partners[0].signature}
                                            alt={`${partners[0].name} Signature`}
                                            width={140}
                                            height={50}
                                            className="object-contain"
                                            unoptimized
                                        />
                                    </div>
                                )}
                                <div className="w-full h-px mb-2" style={{ backgroundColor: lineColor }} />
                                {partners[0].signatureName ? (
                                    <>
                                        <p className="text-sm font-bold" style={{ color: mainColor }}>{partners[0].signatureName}</p>
                                        {partners[0].signatureTitle && (
                                            <p className="text-xs text-gray-500 text-center">{partners[0].signatureTitle}</p>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-sm font-bold" style={{ color: mainColor }}>{partners[0].name}</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Certificate Number */}
                    {certificateCode && (
                        <div className="text-center mt-4">
                            <p className="text-xs text-gray-400">Certificate No: {certificateCode}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
