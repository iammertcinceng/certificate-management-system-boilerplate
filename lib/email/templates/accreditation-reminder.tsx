import { Text } from '@react-email/components';
import { BaseLayout, sharedStyles } from './base-layout';
import type { AccreditationReminderEmailData } from '../types';
import * as React from 'react';

const translations = {
    tr: {
        heading: '⏰ Akreditasyon Yenileme Hatırlatması',
        greeting: 'Sayın Yetkili,',
        reminderText: '{partnerName} ile olan akreditasyon sürenizin dolmasına <strong>{days} gün</strong> kaldı.',
        urgentText: 'Akreditasyonunuzun kesintiye uğramaması için en kısa sürede yenileme işlemlerini başlatmanızı önemle hatırlatırız.',
        detailsTitle: 'AKREDİTASYON DURUMU',
        partner: 'Partner',
        expiration: 'Bitiş Tarihi',
        daysLeft: 'Kalan Süre',
        daysUnit: 'gün',
        preview: '{partnerName} akreditasyonunuz {days} gün içinde bitiyor.',
        buttonText: 'Hemen Yenile',
    },
    en: {
        heading: '⏰ Accreditation Renewal Reminder',
        greeting: 'Dear Authorized,',
        reminderText: 'Your accreditation with {partnerName} will expire in <strong>{days} days</strong>.',
        urgentText: 'We strongly remind you to start the renewal process as soon as possible to avoid interruption in your accreditation.',
        detailsTitle: 'ACCREDITATION STATUS',
        partner: 'Partner',
        expiration: 'Expiration Date',
        daysLeft: 'Time Remaining',
        daysUnit: 'days',
        preview: 'Your {partnerName} accreditation expires in {days} days.',
        buttonText: 'Renew Now',
    },
};

export const AccreditationReminderEmail = (data: AccreditationReminderEmailData) => {
    const t = translations[data.language || 'tr'];
    const preview = t.preview
        .replace('{partnerName}', data.partnerName)
        .replace('{days}', data.daysRemaining.toString());

    // Urgency based color coding
    const isUrgent = data.daysRemaining <= 14;
    const boxStyle = isUrgent ? sharedStyles.warningBox : sharedStyles.infoBox;
    const daysColor = isUrgent ? '#dc2626' : '#b45309';

    return (
        <BaseLayout preview={preview} heading={t.heading} language={data.language}>
            <Text style={sharedStyles.paragraph}>{t.greeting}</Text>

            <Text style={sharedStyles.paragraph} dangerouslySetInnerHTML={{
                __html: t.reminderText
                    .replace('{partnerName}', data.partnerName)
                    .replace('{days}', data.daysRemaining.toString())
            }} />

            {isUrgent && (
                <Text style={sharedStyles.paragraph}>
                    {t.urgentText}
                </Text>
            )}

            <div style={boxStyle}>
                <Text style={sharedStyles.label}>{t.detailsTitle}</Text>

                <div style={{ marginBottom: '12px' }}>
                    <Text style={sharedStyles.label}>{t.partner}</Text>
                    <Text style={sharedStyles.value}>{data.partnerName}</Text>
                </div>

                <div style={{ marginBottom: '12px' }}>
                    <Text style={sharedStyles.label}>{t.expiration}</Text>
                    <Text style={sharedStyles.value}>{data.expirationDate}</Text>
                </div>

                <div>
                    <Text style={sharedStyles.label}>{t.daysLeft}</Text>
                    <Text style={{ ...sharedStyles.value, color: daysColor, fontSize: '20px' }}>
                        {data.daysRemaining} {t.daysUnit}
                    </Text>
                </div>
            </div>

            <div style={sharedStyles.center}>
                <a href={data.renewUrl} style={isUrgent ? sharedStyles.buttonWarning : sharedStyles.button}>
                    {t.buttonText}
                </a>
            </div>
        </BaseLayout>
    );
};

export default AccreditationReminderEmail;
