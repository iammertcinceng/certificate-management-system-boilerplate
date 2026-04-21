import { Text } from '@react-email/components';
import { BaseLayout, sharedStyles } from './base-layout';
import type { PartnerRequestEmailData } from '../types';
import * as React from 'react';

const translations = {
    tr: {
        heading: 'Yeni Partner Talebi',
        greeting: 'Sayın Yetkili,',
        requestText: '{requesterName} ({requesterOrganization}), kurumunuzla partnerlik kurmak istiyor.',
        infoText: 'Partnerlik talebini kabul ederek sertifika süreçlerinde işbirliği yapmaya başlayabilirsiniz.',
        detailsTitle: 'TALEP DETAYLARI',
        requester: 'Talep Eden',
        organization: 'Kurum',
        preview: '{organization} partnerlik talebi gönderdi.',
        buttonText: 'Talebi İncele',
    },
    en: {
        heading: 'New Partner Request',
        greeting: 'Dear Authorized,',
        requestText: '{requesterName} ({requesterOrganization}) wants to partner with your institution.',
        infoText: 'By accepting the partnership request, you can start collaborating on certificate processes.',
        detailsTitle: 'REQUEST DETAILS',
        requester: 'Requester',
        organization: 'Institution',
        preview: '{organization} sent a partnership request.',
        buttonText: 'Review Request',
    },
};

export const PartnerRequestEmail = (data: PartnerRequestEmailData) => {
    const t = translations[data.language || 'tr'];
    const preview = t.preview.replace('{organization}', data.requesterOrganization);

    return (
        <BaseLayout preview={preview} heading={t.heading} language={data.language}>
            <Text style={sharedStyles.paragraph}>{t.greeting}</Text>

            <Text style={sharedStyles.paragraph}>
                {t.requestText
                    .replace('{requesterName}', data.requesterName)
                    .replace('{requesterOrganization}', data.requesterOrganization)}
            </Text>

            <Text style={sharedStyles.paragraph}>
                {t.infoText}
            </Text>

            <div style={sharedStyles.infoBox}>
                <Text style={sharedStyles.label}>{t.detailsTitle}</Text>

                <div style={{ marginBottom: '12px' }}>
                    <Text style={sharedStyles.label}>{t.organization}</Text>
                    <Text style={sharedStyles.value}>{data.requesterOrganization}</Text>
                </div>

                <div>
                    <Text style={sharedStyles.label}>{t.requester}</Text>
                    <Text style={sharedStyles.value}>{data.requesterName}</Text>
                </div>
            </div>

            <div style={sharedStyles.center}>
                <a href={data.acceptUrl} style={sharedStyles.button}>
                    {t.buttonText}
                </a>
            </div>
        </BaseLayout>
    );
};

export default PartnerRequestEmail;
