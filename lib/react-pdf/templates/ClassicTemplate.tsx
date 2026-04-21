/**
 * Classic Template - @react-pdf/renderer versiyonu
 * 
 * Orijinal ClassicTemplate.tsx'in birebir PDF versiyonu.
 * Geleneksel ve resmi görünüm, kurumsal kullanım için ideal.
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { CertificateData } from '@/types/certificate';
import { colors, fontSize, spacing, certificateDimensions, commonStyles, createDynamicStyles } from '../styles';
import { DEFAULT_FONT_FAMILY, MONO_FONT_FAMILY } from '../fonts';

interface ClassicTemplateProps {
    data: CertificateData;
}

export const ClassicTemplate: React.FC<ClassicTemplateProps> = ({ data }) => {
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

    // Dinamik renkler
    const dynamicStyles = createDynamicStyles(primaryColor, secondaryColor);

    // Tarih formatlama
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
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
        <View style={styles.container}>
            {/* Dekoratif Çerçeve - Dış */}
            <View style={[styles.outerBorder, { borderColor: primaryColor }]}>
                {/* Dekoratif Çerçeve - İç */}
                <View style={[styles.innerBorder, { borderColor: secondaryColor }]} />
            </View>

            {/* Sol Üst - Site Logo ve İsim */}
            <View style={styles.topLeft}>
                {siteLogo && (
                    <Image src={siteLogo} style={styles.siteLogo} />
                )}
                <View style={styles.siteInfo}>
                    <Text style={styles.siteName}>{siteName || 'Mert CIN'}</Text>
                    <Text style={styles.siteSubtitle}>Certification</Text>
                </View>
            </View>

            {/* Sağ Üst - QR Code ve Sertifika No */}
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

            {/* Ana İçerik - Ortada */}
            <View style={styles.content}>
                {/* Başlık */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: primaryColor }]}>SERTİFİKA</Text>
                    <Text style={styles.subtitle}>Certificate of Completion</Text>
                </View>

                {/* Ana Metin */}
                <View style={styles.mainContent}>
                    <Text style={styles.introText}>İşbu belge ile</Text>

                    <Text style={[styles.studentName, { color: primaryColor, borderBottomColor: secondaryColor }]}>
                        {studentName}
                    </Text>

                    <View style={styles.descriptionContainer}>
                        {studentTc && (
                            <Text style={styles.nationalId}>(T.C. Kimlik No: {studentTc})</Text>
                        )}
                        <Text style={styles.description}>
                            kişisinin "<Text style={[styles.trainingName, { color: secondaryColor }]}>{trainingName}</Text>" eğitim programını başarıyla tamamladığını ve gerekli yeterliliklere sahip olduğunu onaylar.
                        </Text>
                    </View>

                    {trainingHours && (
                        <Text style={styles.hoursText}>
                            Eğitim Süresi: <Text style={styles.hoursBold}>{trainingHours} Saat</Text>
                        </Text>
                    )}
                </View>

                {/* Tarih */}
                <View style={styles.dateSection}>
                    {trainingStartDate && trainingEndDate ? (
                        <>
                            <Text style={styles.dateLabel}>Eğitim Tarihi</Text>
                            <Text style={styles.dateValue}>
                                {formatShortDate(trainingStartDate)} - {formatShortDate(trainingEndDate)}
                            </Text>
                        </>
                    ) : (
                        <>
                            <Text style={styles.dateLabel}>Veriliş Tarihi</Text>
                            <Text style={styles.dateValue}>{formatDate(dateIssued)}</Text>
                        </>
                    )}
                </View>

                {/* İmza Bölümü */}
                <View style={styles.signatureSection}>
                    {/* Kurum */}
                    <View style={styles.signatureBlock}>
                        {institutionSignature && (
                            <Image src={institutionSignature} style={styles.signature} />
                        )}
                        <View style={styles.signatureLine} />
                        {institutionLogo && (
                            <Image src={institutionLogo} style={styles.institutionLogo} />
                        )}
                        {institutionSignatureName ? (
                            <>
                                <Text style={styles.signatureName}>{institutionSignatureName}</Text>
                                {institutionSignatureTitle && (
                                    <Text style={styles.signatureTitle}>{institutionSignatureTitle}</Text>
                                )}
                            </>
                        ) : (
                            <>
                                <Text style={styles.signatureName}>{institutionName}</Text>
                                <Text style={styles.signatureTitle}>Eğitim Kurumu</Text>
                            </>
                        )}
                    </View>

                    {/* Partner'lar */}
                    {partners.map((partner, index) => (
                        <React.Fragment key={index}>
                            {(index === 0 || partners.length > 0) && (
                                <View style={styles.divider} />
                            )}
                            <View style={styles.signatureBlock}>
                                {partner.signature && (
                                    <Image src={partner.signature} style={styles.signature} />
                                )}
                                <View style={styles.signatureLine} />
                                {partner.logo && (
                                    <Image src={partner.logo} style={styles.institutionLogo} />
                                )}
                                {partner.signatureName ? (
                                    <>
                                        <Text style={styles.signatureName}>{partner.signatureName}</Text>
                                        {partner.signatureTitle && (
                                            <Text style={styles.signatureTitle}>{partner.signatureTitle}</Text>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <Text style={styles.signatureName}>{partner.name}</Text>
                                        <Text style={styles.signatureTitle}>Partner</Text>
                                    </>
                                )}
                            </View>
                        </React.Fragment>
                    ))}
                </View>
            </View>

            {/* Köşe Dekorasyonları */}
            <View style={[styles.cornerTL, { borderColor: secondaryColor }]} />
            <View style={[styles.cornerTR, { borderColor: secondaryColor }]} />
            <View style={[styles.cornerBL, { borderColor: secondaryColor }]} />
            <View style={[styles.cornerBR, { borderColor: secondaryColor }]} />
        </View>
    );
};

// Stiller
const styles = StyleSheet.create({
    container: {
        width: certificateDimensions.width,
        height: certificateDimensions.height,
        backgroundColor: colors.white,
        fontFamily: DEFAULT_FONT_FAMILY,
        position: 'relative',
    },

    // Çerçeveler
    outerBorder: {
        position: 'absolute',
        top: 12,
        left: 12,
        right: 12,
        bottom: 12,
        borderWidth: 6,
        borderRadius: 2,
    },
    innerBorder: {
        position: 'absolute',
        top: 6,
        left: 6,
        right: 6,
        bottom: 6,
        borderWidth: 1.5,
        borderRadius: 2,
    },

    // Sol üst - Site bilgisi
    topLeft: {
        position: 'absolute',
        top: 36,
        left: 36,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
    },
    siteLogo: {
        width: 42,
        height: 42,
        objectFit: 'contain',
    },
    siteInfo: {
        flexDirection: 'column',
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

    // Sağ üst - QR ve sertifika no
    topRight: {
        position: 'absolute',
        top: 36,
        right: 36,
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 6,
    },
    qrContainer: {
        backgroundColor: colors.white,
        padding: 9,
        borderWidth: 1.5,
        borderRadius: 3,
    },
    qrCode: {
        width: 60,
        height: 60,
    },
    certificateNoContainer: {
        alignItems: 'flex-end',
    },
    certificateNoLabel: {
        fontSize: fontSize.xs,
        color: colors.gray[500],
    },
    certificateNo: {
        fontSize: fontSize.sm,
        fontFamily: MONO_FONT_FAMILY,
        fontWeight: 600,
    },

    // Ana içerik
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

    // Başlık
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: fontSize['5xl'],
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 3,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: fontSize.lg,
        color: colors.gray[600],
    },

    // Ana metin
    mainContent: {
        alignItems: 'center',
        maxWidth: 600,
        marginBottom: 30,
    },
    introText: {
        fontSize: fontSize.xl,
        color: colors.gray[700],
        marginBottom: 18,
    },
    studentName: {
        fontSize: fontSize['6xl'],
        fontWeight: 700,
        marginBottom: 18,
        paddingBottom: 12,
        paddingHorizontal: 36,
        borderBottomWidth: 3,
    },
    descriptionContainer: {
        alignItems: 'center',
        maxWidth: 500,
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
        lineHeight: 1.6,
    },
    trainingName: {
        fontWeight: 600,
    },
    hoursText: {
        fontSize: fontSize.base,
        color: colors.gray[600],
        marginTop: 12,
    },
    hoursBold: {
        fontWeight: 600,
    },

    // Tarih
    dateSection: {
        alignItems: 'center',
        marginBottom: 18,
    },
    dateLabel: {
        fontSize: fontSize.sm,
        color: colors.gray[500],
    },
    dateValue: {
        fontSize: fontSize.base,
        fontWeight: 600,
        color: colors.gray[800],
    },

    // İmza bölümü
    signatureSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        marginTop: 'auto',
    },
    signatureBlock: {
        flexDirection: 'column',
        alignItems: 'center',
    },
    signature: {
        height: 30,
        width: 75,
        objectFit: 'contain',
        marginBottom: 3,
    },
    signatureLine: {
        width: 84,
        height: 0.75,
        backgroundColor: colors.gray[400],
        marginBottom: 3,
    },
    institutionLogo: {
        width: 42,
        height: 42,
        objectFit: 'contain',
        marginBottom: 3,
    },
    signatureName: {
        fontSize: fontSize.sm,
        fontWeight: 600,
        color: colors.gray[800],
    },
    signatureTitle: {
        fontSize: fontSize.xs,
        color: colors.gray[500],
    },
    divider: {
        width: 0.75,
        height: 72,
        backgroundColor: colors.gray[300],
    },

    // Köşe süsleri
    cornerTL: {
        position: 'absolute',
        top: 24,
        left: 24,
        width: 48,
        height: 48,
        borderTopWidth: 3,
        borderLeftWidth: 3,
        borderTopLeftRadius: 6,
    },
    cornerTR: {
        position: 'absolute',
        top: 24,
        right: 24,
        width: 48,
        height: 48,
        borderTopWidth: 3,
        borderRightWidth: 3,
        borderTopRightRadius: 6,
    },
    cornerBL: {
        position: 'absolute',
        bottom: 24,
        left: 24,
        width: 48,
        height: 48,
        borderBottomWidth: 3,
        borderLeftWidth: 3,
        borderBottomLeftRadius: 6,
    },
    cornerBR: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 48,
        height: 48,
        borderBottomWidth: 3,
        borderRightWidth: 3,
        borderBottomRightRadius: 6,
    },
});

export default ClassicTemplate;
