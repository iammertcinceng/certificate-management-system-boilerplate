import { Text } from '@react-email/components';
import { BaseLayout, sharedStyles } from './base-layout';
import type { PartnerApprovalRequestEmailData } from '../types';
import * as React from 'react';

const translations = {
    tr: {
        heading: 'Partner Onayı Bekleniyor',
        greeting: 'Sayın Partnerimiz,',
        requestText: '{institutionName}, {certificatePublicId} numaralı sertifika için onayınızı bekliyor.',
        detailsTitle: 'SERTİFİKA DETAYLARI',
        training: 'Eğitim',
        institution: 'Kurum',
        certId: 'Sertifika No',
        preview: '{institutionName} sizden sertifika onayı bekliyor.',
        buttonText: 'Onay Ekranına Git',
    },
    en: {
        heading: 'Partner Approval Required',
        greeting: 'Dear Partner,',
        requestText: '{institutionName} requested your approval for certificate {certificatePublicId}.',
        detailsTitle: 'CERTIFICATE DETAILS',
        training: 'Training',
        institution: 'Institution',
        certId: 'Certificate ID',
        preview: '{institutionName} is waiting for your certificate approval.',
        buttonText: 'Go to Approval Page',
    },
};

export const PartnerApprovalRequestEmail = (data: PartnerApprovalRequestEmailData) => {
    const t = translations[data.language || 'tr'];
    const preview = t.preview.replace('{institutionName}', data.institutionName);

    return (
        <BaseLayout preview={preview} heading={t.heading} language={data.language}>
            <Text style={sharedStyles.paragraph}>{t.greeting}</Text>

            <Text style={sharedStyles.paragraph}>
                {t.requestText
                    .replace('{institutionName}', data.institutionName)
                    .replace('{certificatePublicId}', data.certificatePublicId)}
            </Text>

            <div style={sharedStyles.infoBox}>
                <Text style={sharedStyles.label}>{t.detailsTitle}</Text>

                <div style={{ marginBottom: '12px' }}>
                    <Text style={sharedStyles.label}>{t.institution}</Text>
                    <Text style={sharedStyles.value}>{data.institutionName}</Text>
                </div>

                <div style={{ marginBottom: '12px' }}>
                    <Text style={sharedStyles.label}>{t.training}</Text>
                    <Text style={sharedStyles.value}>{data.trainingName}</Text>
                </div>

                <div>
                    <Text style={sharedStyles.label}>{t.certId}</Text>
                    <Text style={sharedStyles.value}>{data.certificatePublicId}</Text>
                </div>
            </div>

            <div style={sharedStyles.center}>
                <a href={data.approvalUrl} style={sharedStyles.button}>
                    {t.buttonText}
                </a>
            </div>
        </BaseLayout>
    );
};

export default PartnerApprovalRequestEmail;
