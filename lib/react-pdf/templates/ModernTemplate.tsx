/**
 * Modern Template - @react-pdf/renderer versiyonu
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { CertificateData } from '@/types/certificate';
import { colors, fontSize, certificateDimensions } from '../styles';
import { DEFAULT_FONT_FAMILY, MONO_FONT_FAMILY } from '../fonts';

interface ModernTemplateProps {
    data: CertificateData;
}

export const ModernTemplate: React.FC<ModernTemplateProps> = ({ data }) => {
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

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    return (
        <View style={styles.container}>
            {/* Top Line */}
            <View style={[styles.topLine, { backgroundColor: primaryColor }]} />

            {/* Bottom Line */}
            <View style={[styles.bottomLine, { backgroundColor: primaryColor }]} />

            {/* Left Accent */}
            <View style={[styles.leftAccent, { backgroundColor: primaryColor }]} />

            {/* Site Logo - Top Left */}
            <View style={styles.topLeft}>
                {siteLogo && <Image src={siteLogo} style={styles.siteLogo} />}
                <View>
                    <Text style={styles.siteName}>{siteName || 'Mert CIN'}</Text>
                    <Text style={styles.siteSubtitle}>Certification</Text>
                </View>
            </View>

            {/* QR Code - Top Right */}
            <View style={styles.topRight}>
                {qrCode && (
                    <View style={[styles.qrContainer, { borderColor: primaryColor }]}>
                        <Image src={qrCode} style={styles.qrCode} />
                    </View>
                )}
                <View style={styles.certificateNoContainer}>
                    <Text style={styles.certificateNoLabel}>Sertifika No</Text>
                    <Text style={[styles.certificateNo, { color: primaryColor }]}>{certificateCode}</Text>
                </View>
            </View>

            {/* Main Content */}
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerSubtitle}>Başarı Belgesi</Text>
                    <Text style={[styles.title, { color: primaryColor }]}>SERTİFİKA</Text>
                </View>

                {/* Student Name */}
                <Text style={styles.introText}>İşbu belge ile</Text>

                <View style={[styles.nameContainer, { backgroundColor: `${primaryColor}10`, borderLeftColor: primaryColor }]}>
                    <Text style={[styles.studentName, { color: primaryColor }]}>{studentName}</Text>
                </View>

                {/* Description */}
                <View style={styles.descriptionContainer}>
                    {studentTc && <Text style={styles.nationalId}>(T.C. Kimlik No: {studentTc})</Text>}
                    <Text style={styles.description}>
                        kişisinin "<Text style={[styles.trainingName, { color: secondaryColor }]}>{trainingName}</Text>" eğitim programını başarıyla tamamladığını ve gerekli yeterliliklere sahip olduğunu onaylar.
                    </Text>
                </View>

                {/* Info Row */}
                <View style={styles.infoRow}>
                    {trainingHours && (
                        <>
                            <View style={styles.infoBlock}>
                                <Text style={styles.infoLabel}>Eğitim Süresi</Text>
                                <Text style={[styles.infoValue, { color: primaryColor }]}>{trainingHours} Saat</Text>
                            </View>
                            <View style={styles.infoDivider} />
                        </>
                    )}
                    <View style={styles.infoBlock}>
                        <Text style={styles.infoLabel}>{trainingStartDate && trainingEndDate ? 'Eğitim Tarihi' : 'Tarih'}</Text>
                        <Text style={[styles.infoValue, { color: primaryColor }]}>
                            {trainingStartDate && trainingEndDate
                                ? `${formatDate(trainingStartDate)} - ${formatDate(trainingEndDate)}`
                                : formatDate(dateIssued)}
                        </Text>
                    </View>
                </View>

                {/* Signatures */}
                <View style={[styles.signatureSection, { borderTopColor: `${primaryColor}20` }]}>
                    {/* Institution */}
                    <View style={styles.signatureBlock}>
                        {institutionSignature && <Image src={institutionSignature} style={styles.signature} />}
                        <View style={styles.signatureLine} />
                        <View style={styles.signatureInfo}>
                            {institutionLogo && <Image src={institutionLogo} style={styles.institutionLogo} />}
                            <View>
                                <Text style={styles.signatureName}>{institutionSignatureName || institutionName}</Text>
                                <Text style={styles.signatureTitle}>{institutionSignatureTitle || 'Eğitim Sağlayıcı'}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Partners */}
                    {partners.map((partner, index) => (
                        <React.Fragment key={index}>
                            <View style={styles.divider} />
                            <View style={styles.signatureBlock}>
                                {partner.signature && <Image src={partner.signature} style={styles.signature} />}
                                <View style={styles.signatureLine} />
                                <View style={styles.signatureInfo}>
                                    {partner.logo && <Image src={partner.logo} style={styles.institutionLogo} />}
                                    <View>
                                        <Text style={styles.signatureName}>{partner.signatureName || partner.name}</Text>
                                        <Text style={styles.signatureTitle}>{partner.signatureTitle || 'Partner'}</Text>
                                    </View>
                                </View>
                            </View>
                        </React.Fragment>
                    ))}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: certificateDimensions.width,
        height: certificateDimensions.height,
        backgroundColor: colors.white,
        fontFamily: DEFAULT_FONT_FAMILY,
        position: 'relative',
    },
    topLine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 6,
    },
    bottomLine: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 6,
    },
    leftAccent: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 9,
    },
    topLeft: {
        position: 'absolute',
        top: 24,
        left: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
    },
    siteLogo: {
        width: 42,
        height: 42,
        objectFit: 'contain',
    },
    siteName: {
        fontSize: fontSize.base,
        fontWeight: 700,
        color: colors.gray[800],
    },
    siteSubtitle: {
        fontSize: fontSize.xs,
        color: colors.gray[600],
    },
    topRight: {
        position: 'absolute',
        top: 36,
        right: 36,
        alignItems: 'flex-end',
    },
    qrContainer: {
        padding: 6,
        borderWidth: 1,
        borderRadius: 3,
        marginBottom: 6,
    },
    qrCode: {
        width: 52,
        height: 52,
    },
    certificateNoContainer: {
        alignItems: 'flex-end',
    },
    certificateNoLabel: {
        fontSize: fontSize.xs,
        color: colors.gray[400],
    },
    certificateNo: {
        fontSize: fontSize.xs,
        fontFamily: MONO_FONT_FAMILY,
        fontWeight: 600,
    },
    content: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 72,
        paddingVertical: 60,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    headerSubtitle: {
        fontSize: fontSize.xs,
        color: colors.gray[400],
        textTransform: 'uppercase',
        letterSpacing: 3,
        marginBottom: 6,
    },
    title: {
        fontSize: fontSize['4xl'],
        fontWeight: 400,
        letterSpacing: 2,
    },
    introText: {
        fontSize: fontSize.lg,
        color: colors.gray[500],
        marginBottom: 24,
    },
    nameContainer: {
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderLeftWidth: 3,
        marginBottom: 30,
    },
    studentName: {
        fontSize: fontSize['5xl'],
        fontWeight: 700,
    },
    descriptionContainer: {
        alignItems: 'center',
        maxWidth: 450,
        marginBottom: 18,
    },
    nationalId: {
        fontSize: fontSize.sm,
        color: colors.gray[600],
        marginBottom: 6,
    },
    description: {
        fontSize: fontSize.lg,
        color: colors.gray[700],
        textAlign: 'center',
        lineHeight: 1.5,
    },
    trainingName: {
        fontWeight: 600,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 24,
        marginBottom: 24,
    },
    infoBlock: {
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: fontSize.xs,
        color: colors.gray[400],
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 3,
    },
    infoValue: {
        fontSize: fontSize.lg,
        fontWeight: 600,
    },
    infoDivider: {
        width: 1,
        height: 24,
        backgroundColor: colors.gray[300],
    },
    signatureSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 30,
        paddingTop: 18,
        borderTopWidth: 1,
        marginTop: 'auto',
    },
    signatureBlock: {
        alignItems: 'center',
    },
    signature: {
        height: 30,
        width: 60,
        objectFit: 'contain',
        marginBottom: 3,
    },
    signatureLine: {
        width: 72,
        height: 0.75,
        backgroundColor: colors.gray[400],
        marginBottom: 3,
    },
    signatureInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
    },
    institutionLogo: {
        width: 30,
        height: 30,
        objectFit: 'contain',
    },
    signatureName: {
        fontSize: fontSize.sm,
        fontWeight: 600,
        color: colors.gray[800],
    },
    signatureTitle: {
        fontSize: fontSize.xs,
        color: colors.gray[400],
    },
    divider: {
        width: 1,
        height: 48,
        backgroundColor: colors.gray[200],
    },
});

export default ModernTemplate;
