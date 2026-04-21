/**
 * Minimal Template - @react-pdf/renderer versiyonu
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { CertificateData } from '@/types/certificate';
import { colors, fontSize, certificateDimensions } from '../styles';
import { DEFAULT_FONT_FAMILY, MONO_FONT_FAMILY } from '../fonts';

interface MinimalTemplateProps {
    data: CertificateData;
}

export const MinimalTemplate: React.FC<MinimalTemplateProps> = ({ data }) => {
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

    const mainColor = primaryColor || '#1E4D6B';
    const lineColor = secondaryColor || '#C4A052';
    const bgColor = '#E8F4F8';

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
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
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            {/* Decorative circles */}
            <View style={[styles.circleTopLeft, { backgroundColor: mainColor }]} />
            <View style={[styles.circleBottomRight, { backgroundColor: mainColor }]} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    {siteLogo && <Image src={siteLogo} style={styles.siteLogo} />}
                    <Text style={styles.siteName}>{siteName || 'Mert CIN'}</Text>
                    <View style={styles.headerDivider} />
                    {institutionLogo && <Image src={institutionLogo} style={styles.institutionLogoHeader} />}
                    <Text style={[styles.institutionName, { color: mainColor }]}>{institutionName}</Text>
                </View>
                {partners[0]?.logo && <Image src={partners[0].logo} style={styles.partnerLogo} />}
            </View>

            {/* Main Content */}
            <View style={styles.content}>
                <Text style={styles.certifyLabel}>İşbu Belge İle Onaylanır Ki</Text>

                <Text style={[styles.studentName, { color: mainColor }]}>{studentName}</Text>

                <View style={styles.descriptionBox}>
                    <Text style={styles.descriptionText}>
                        kişisi {trainingHours && `${trainingHours} saatlik `}
                        {trainingName} programını tüm gereksinimleriyle birlikte başarıyla tamamlamış ve en üst düzeyde yetkinlik göstermiştir.
                        {trainingDescription && ` ${trainingDescription}`}
                    </Text>
                </View>

                {/* Training Title with Lines */}
                <View style={[styles.goldenLine, { backgroundColor: lineColor }]} />
                <Text style={[styles.trainingTitle, { color: mainColor }]}>{trainingName}</Text>
                <View style={[styles.goldenLine, { backgroundColor: lineColor }]} />

                <Text style={styles.dateText}>
                    Tüm hak ve imtiyazlarla birlikte. Aşağıda imzası bulunanlar bu belgeyi{' '}
                    {trainingStartDate && trainingEndDate
                        ? `${formatShortDate(trainingStartDate)} - ${formatShortDate(trainingEndDate)}`
                        : formatDate(dateIssued)} tarihinde onaylamıştır.
                </Text>

                {/* Signatures */}
                <View style={styles.signatureSection}>
                    <View style={styles.signatureBlock}>
                        {institutionSignature && <Image src={institutionSignature} style={styles.signature} />}
                        <View style={[styles.signatureLine, { backgroundColor: lineColor }]} />
                        <Text style={[styles.signatureName, { color: mainColor }]}>{institutionSignatureName || institutionName}</Text>
                        {institutionSignatureTitle && <Text style={styles.signatureTitle}>{institutionSignatureTitle}</Text>}
                    </View>

                    {qrCode && (
                        <View style={[styles.qrContainer, { borderColor: `${mainColor}20` }]}>
                            <Image src={qrCode} style={styles.qrCode} />
                        </View>
                    )}

                    {partners[0] && (
                        <View style={styles.signatureBlock}>
                            {partners[0].signature && <Image src={partners[0].signature} style={styles.signature} />}
                            <View style={[styles.signatureLine, { backgroundColor: lineColor }]} />
                            <Text style={[styles.signatureName, { color: mainColor }]}>{partners[0].signatureName || partners[0].name}</Text>
                            {partners[0].signatureTitle && <Text style={styles.signatureTitle}>{partners[0].signatureTitle}</Text>}
                        </View>
                    )}
                </View>

                {certificateCode && (
                    <Text style={styles.certNo}>Sertifika No: {certificateCode}</Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: certificateDimensions.width,
        height: certificateDimensions.height,
        fontFamily: DEFAULT_FONT_FAMILY,
        position: 'relative',
    },
    circleTopLeft: {
        position: 'absolute',
        top: -60,
        left: -60,
        width: 192,
        height: 192,
        borderRadius: 96,
        opacity: 0.1,
    },
    circleBottomRight: {
        position: 'absolute',
        bottom: -96,
        right: -96,
        width: 288,
        height: 288,
        borderRadius: 144,
        opacity: 0.1,
    },
    header: {
        position: 'absolute',
        top: 36,
        left: 60,
        right: 60,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 18,
    },
    siteLogo: {
        width: 27,
        height: 27,
        objectFit: 'contain',
    },
    siteName: {
        fontSize: fontSize.sm,
        fontWeight: 600,
        color: colors.gray[500],
    },
    headerDivider: {
        width: 1,
        height: 30,
        backgroundColor: colors.gray[300],
    },
    institutionLogoHeader: {
        width: 45,
        height: 45,
        objectFit: 'contain',
    },
    institutionName: {
        fontSize: fontSize['2xl'],
        fontWeight: 700,
    },
    partnerLogo: {
        width: 52,
        height: 52,
        objectFit: 'contain',
    },
    content: {
        position: 'absolute',
        top: 100,
        left: 60,
        right: 60,
        bottom: 36,
        flexDirection: 'column',
        alignItems: 'center',
    },
    certifyLabel: {
        fontSize: fontSize.sm,
        textTransform: 'uppercase',
        letterSpacing: 3,
        color: colors.gray[500],
        marginBottom: 6,
    },
    studentName: {
        fontSize: fontSize['5xl'],
        fontWeight: 700,
        letterSpacing: 1,
        marginBottom: 18,
    },
    descriptionBox: {
        maxWidth: 450,
        marginBottom: 18,
    },
    descriptionText: {
        fontSize: fontSize.sm,
        color: colors.gray[700],
        textAlign: 'center',
        lineHeight: 1.5,
    },
    goldenLine: {
        width: '100%',
        height: 0.75,
        marginVertical: 6,
    },
    trainingTitle: {
        fontSize: fontSize['2xl'],
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 1,
        textAlign: 'center',
        marginVertical: 6,
    },
    dateText: {
        fontSize: fontSize.sm,
        color: colors.gray[600],
        textAlign: 'center',
        marginTop: 12,
        marginBottom: 24,
        maxWidth: 400,
    },
    signatureSection: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 24,
        marginTop: 'auto',
    },
    signatureBlock: {
        alignItems: 'center',
        width: 192,
    },
    signature: {
        height: 42,
        width: 105,
        objectFit: 'contain',
        marginBottom: 3,
    },
    signatureLine: {
        width: '100%',
        height: 0.75,
        marginBottom: 6,
    },
    signatureName: {
        fontSize: fontSize.sm,
        fontWeight: 700,
    },
    signatureTitle: {
        fontSize: fontSize.xs,
        color: colors.gray[500],
        textAlign: 'center',
    },
    qrContainer: {
        backgroundColor: colors.white,
        padding: 6,
        borderRadius: 6,
        borderWidth: 1,
    },
    qrCode: {
        width: 37,
        height: 37,
    },
    certNo: {
        fontSize: fontSize.xs,
        color: colors.gray[400],
        marginTop: 12,
    },
});

export default MinimalTemplate;
