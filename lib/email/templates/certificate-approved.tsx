import { Text } from '@react-email/components';
import { BaseLayout, sharedStyles } from './base-layout';
import type { CertificateApprovedEmailData } from '../types';
import * as React from 'react';

const translations = {
    tr: {
        heading: 'Sertifikanız Onaylandı! 🎉',
        greeting: 'Merhaba,',
        approvedText: 'Tebrikler! Sertifikanız başarıyla onaylandı ve kullanıma hazır.',
        detailsTitle: 'SERTİFİKA DETAYLARI',
        training: 'Eğitim',
        issueDate: 'Veriliş Tarihi',
        certId: 'Sertifika No',
        buttonText: 'Sertifikayı Görüntüle',
        preview: '{trainingName} sertifikanız onaylandı.',
        shareText: 'Sertifikanızı LinkedIn\'de paylaşarak başarınızı ağınızla kutlamayı unutmayın!',
    },
    en: {
        heading: 'Your Certificate is Approved! 🎉',
        greeting: 'Hello,',
        approvedText: 'Congratulations! Your certificate has been successfully approved and is ready to use.',
        detailsTitle: 'CERTIFICATE DETAILS',
        training: 'Training',
        issueDate: 'Issue Date',
        certId: 'Certificate ID',
        buttonText: 'View Certificate',
        preview: 'Your {trainingName} certificate has been approved.',
        shareText: 'Don\'t forget to share your certificate on LinkedIn to celebrate your achievement with your network!',
    },
};

export const CertificateApprovedEmail = (data: CertificateApprovedEmailData) => {
    const t = translations[data.language || 'tr'];
    const preview = t.preview.replace('{trainingName}', data.trainingName);

    return (
        <BaseLayout preview={preview} heading={t.heading} language={data.language}>
            <Text style={sharedStyles.paragraph}>{t.greeting}</Text>

            <Text style={sharedStyles.paragraph}>
                {t.approvedText}
            </Text>

            <div style={sharedStyles.successBox}>
                <Text style={sharedStyles.label}>{t.detailsTitle}</Text>

                <div style={{ marginBottom: '12px' }}>
                    <Text style={sharedStyles.label}>{t.training}</Text>
                    <Text style={sharedStyles.value}>{data.trainingName}</Text>
                </div>

                <div style={{ marginBottom: '12px' }}>
                    <Text style={sharedStyles.label}>{t.issueDate}</Text>
                    <Text style={sharedStyles.value}>{data.issueDate}</Text>
                </div>

                <div>
                    <Text style={sharedStyles.label}>{t.certId}</Text>
                    <Text style={sharedStyles.value}>{data.certificatePublicId}</Text>
                </div>
            </div>

            <div style={sharedStyles.center}>
                <a href={data.verificationUrl} style={sharedStyles.button}>
                    {t.buttonText}
                </a>
            </div>

            <Text style={sharedStyles.paragraph}>
                {t.shareText}
            </Text>
        </BaseLayout>
    );
};

export default CertificateApprovedEmail;
