import { Text } from '@react-email/components';
import { BaseLayout, sharedStyles } from './base-layout';
import type { CertificateRejectedEmailData } from '../types';
import * as React from 'react';

const translations = {
    tr: {
        heading: 'Sertifika Onay Durumu',
        greeting: 'Sayın Yetkili,',
        rejectedText: 'Aşağıda detayları belirtilen sertifika onayı reddedilmiştir. Lütfen gerekli düzenlemeleri yaparak tekrar onaya gönderiniz.',
        reasonTitle: 'RED NEDENİ',
        detailsTitle: 'SERTİFİKA DETAYLARI',
        training: 'Eğitim',
        certId: 'Sertifika No',
        preview: '{certificateId} nolu sertifika reddedildi.',
        buttonText: 'Sisteme Git',
    },
    en: {
        heading: 'Certificate Approval Status',
        greeting: 'Dear Authorized,',
        rejectedText: 'The certificate detailed below has been rejected. Please make the necessary corrections and submit for approval again.',
        reasonTitle: 'REJECTION REASON',
        detailsTitle: 'CERTIFICATE DETAILS',
        training: 'Training',
        certId: 'Certificate ID',
        preview: 'Certificate {certificateId} has been rejected.',
        buttonText: 'Go to Dashboard',
    },
};

export const CertificateRejectedEmail = (data: CertificateRejectedEmailData) => {
    const t = translations[data.language || 'tr'];
    const preview = t.preview.replace('{certificateId}', data.certificatePublicId);

    return (
        <BaseLayout preview={preview} heading={t.heading} language={data.language}>
            <Text style={sharedStyles.paragraph}>{t.greeting}</Text>

            <Text style={sharedStyles.paragraph}>
                {t.rejectedText}
            </Text>

            {data.rejectionReason && (
                <div style={sharedStyles.dangerBox}>
                    <Text style={{ ...sharedStyles.label, color: '#b91c1c' }}>{t.reasonTitle}</Text>
                    <Text style={sharedStyles.value}>{data.rejectionReason}</Text>
                </div>
            )}

            <div style={sharedStyles.infoBox}>
                <Text style={sharedStyles.label}>{t.detailsTitle}</Text>

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
                <a href="https://mertcin.com/institution/certificates/approvals" style={sharedStyles.buttonSecondary}>
                    {t.buttonText}
                </a>
            </div>
        </BaseLayout>
    );
};

export default CertificateRejectedEmail;
