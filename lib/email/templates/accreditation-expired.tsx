import { Text } from '@react-email/components';
import { BaseLayout, sharedStyles } from './base-layout';
import type { AccreditationExpiredEmailData } from '../types';
import * as React from 'react';

const translations = {
    tr: {
        heading: '🚨 Akreditasyon Süreniz Doldu!',
        greeting: 'Sayın Yetkili,',
        expiredText: '{partnerName} ile olan akreditasyon süreniz <strong>{date}</strong> tarihinde dolmuştur.',
        warningText: 'Şu an üzerinden {days} gün geçti. Akreditasyonunuzu yenilememeniz durumunda sertifika oluşturma yetkiniz askıya alınabilir.',
        criticalText: 'Lütfen EN KISA SÜREDE yenileme işlemlerini tamamlayınız.',
        detailsTitle: 'AKREDİTASYON DURUMU',
        partner: 'Partner',
        expiredOn: 'Bitiş Tarihi',
        overdue: 'Geçen Süre',
        overdueText: '{days} gün geçti',
        preview: '{partnerName} akreditasyon süreniz doldu!',
        buttonText: 'Hemen Yenile',
    },
    en: {
        heading: '🚨 Your Accreditation Has Expired!',
        greeting: 'Dear Authorized,',
        expiredText: 'Your accreditation with {partnerName} expired on <strong>{date}</strong>.',
        warningText: 'It has been {days} days since expiration. Failure to renew may result in suspension of your certificate issuance privileges.',
        criticalText: 'Please complete the renewal process IMMEDIATELY.',
        detailsTitle: 'ACCREDITATION STATUS',
        partner: 'Partner',
        expiredOn: 'Expired On',
        overdue: 'Overdue By',
        overdueText: '{days} days overdue',
        preview: 'Your {partnerName} accreditation has expired!',
        buttonText: 'Renew Now',
    },
};

export const AccreditationExpiredEmail = (data: AccreditationExpiredEmailData) => {
    const t = translations[data.language || 'tr'];
    const preview = t.preview.replace('{partnerName}', data.partnerName);

    // Urgency based color coding
    const isCritical = data.daysSinceExpiry >= 60;
    const boxStyle = sharedStyles.dangerBox;
    const overdueColor = '#dc2626';

    return (
        <BaseLayout preview={preview} heading={t.heading} language={data.language}>
            <Text style={sharedStyles.paragraph}>{t.greeting}</Text>

            <Text style={sharedStyles.paragraph} dangerouslySetInnerHTML={{
                __html: t.expiredText
                    .replace('{partnerName}', data.partnerName)
                    .replace('{date}', data.expirationDate)
            }} />

            <Text style={sharedStyles.paragraph}>
                {t.warningText.replace('{days}', data.daysSinceExpiry.toString())}
            </Text>

            <Text style={{ ...sharedStyles.paragraph, fontWeight: 'bold', color: '#dc2626' }}>
                {t.criticalText}
            </Text>

            <div style={boxStyle}>
                <Text style={{ ...sharedStyles.label, color: '#b91c1c' }}>{t.detailsTitle}</Text>

                <div style={{ marginBottom: '12px' }}>
                    <Text style={sharedStyles.label}>{t.partner}</Text>
                    <Text style={sharedStyles.value}>{data.partnerName}</Text>
                </div>

                <div style={{ marginBottom: '12px' }}>
                    <Text style={sharedStyles.label}>{t.expiredOn}</Text>
                    <Text style={sharedStyles.value}>{data.expirationDate}</Text>
                </div>

                <div>
                    <Text style={sharedStyles.label}>{t.overdue}</Text>
                    <Text style={{ ...sharedStyles.value, color: overdueColor, fontSize: '20px' }}>
                        {t.overdueText.replace('{days}', data.daysSinceExpiry.toString())}
                    </Text>
                </div>
            </div>

            <div style={sharedStyles.center}>
                <a href={data.renewUrl} style={sharedStyles.buttonDanger}>
                    {t.buttonText}
                </a>
            </div>
        </BaseLayout>
    );
};

export default AccreditationExpiredEmail;
