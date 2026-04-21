import { Text } from '@react-email/components';
import { BaseLayout, sharedStyles } from './base-layout';
import type { CreditDeductedEmailData } from '../types';
import * as React from 'react';

const translations = {
    tr: {
        heading: 'Kredi Kullanım Bildirimi',
        greeting: 'Sayın Yetkili,',
        infoText: 'Hesabınızdan sertifika işlemi için kredi düşülmüştür.',
        detailsTitle: 'İŞLEM DETAYLARI',
        certId: 'İlgili Sertifika',
        used: 'Kullanılan Kredi',
        remaining: 'Kalan Bakiye',
        preview: '{credits} kredi hesabınızdan düşüldü.',
        buttonText: 'Detayları Görüntüle',
    },
    en: {
        heading: 'Credit Usage Notification',
        greeting: 'Dear Authorized,',
        infoText: 'Credits have been deducted from your account for a certificate transaction.',
        detailsTitle: 'TRANSACTION DETAILS',
        certId: 'Related Certificate',
        used: 'Credits Used',
        remaining: 'Remaining Balance',
        preview: '{credits} credits deducted from your account.',
        buttonText: 'View Details',
    },
};

export const CreditDeductedEmail = (data: CreditDeductedEmailData) => {
    const t = translations[data.language || 'tr'];
    const preview = t.preview.replace('{credits}', data.creditsUsed.toString());

    return (
        <BaseLayout preview={preview} heading={t.heading} language={data.language}>
            <Text style={sharedStyles.paragraph}>{t.greeting}</Text>

            <Text style={sharedStyles.paragraph}>
                {t.infoText}
            </Text>

            <div style={sharedStyles.infoBox}>
                <Text style={sharedStyles.label}>{t.detailsTitle}</Text>

                <div style={{ marginBottom: '12px' }}>
                    <Text style={sharedStyles.label}>{t.certId}</Text>
                    <Text style={sharedStyles.value}>{data.certificatePublicId}</Text>
                </div>

                <div style={{ marginBottom: '12px' }}>
                    <Text style={sharedStyles.label}>{t.used}</Text>
                    <Text style={{ ...sharedStyles.value, color: '#dc2626' }}>-{data.creditsUsed}</Text>
                </div>

                <div>
                    <Text style={sharedStyles.label}>{t.remaining}</Text>
                    <Text style={sharedStyles.value}>{data.remainingCredits}</Text>
                </div>
            </div>

            <div style={sharedStyles.center}>
                <a href="https://mertcin.com/institution/credits" style={sharedStyles.buttonSecondary}>
                    {t.buttonText}
                </a>
            </div>
        </BaseLayout>
    );
};

export default CreditDeductedEmail;
