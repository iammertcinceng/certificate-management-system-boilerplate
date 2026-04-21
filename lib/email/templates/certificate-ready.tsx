import { Text } from '@react-email/components';
import { BaseLayout, sharedStyles } from './base-layout';
import type { CertificateReadyEmailData } from '../types';
import * as React from 'react';

const translations = {
    tr: {
        heading: 'Sertifikanız Hazır! 📜',
        greeting: 'Merhaba {studentName},',
        readyText: '{institutionName} tarafından verilen sertifikanız hazırlandı.',
        infoText: 'Aşağıdaki butona tıklayarak sertifikanızı görüntüleyebilir, indirebilir ve LinkedIn profilinize ekleyebilirsiniz.',
        verifyInfo: 'Bu doğrulama kodu ile sertifikanızı aşağıdaki linkten doğrulayabilirsiniz.',
        detailsTitle: 'SERTİFİKA DETAYLARI',
        training: 'Eğitim',
        verifyCode: 'Doğrulama Kodu',
        preview: '{trainingName} sertifikanız hazırlandı.',
        buttonText: 'Sertifikayı Görüntüle',
    },
    en: {
        heading: 'Your Certificate is Ready! 📜',
        greeting: 'Hello {studentName},',
        readyText: 'Your certificate from {institutionName} is ready.',
        infoText: 'You can view, download, and add your certificate to your LinkedIn profile by clicking the button below.',
        verifyInfo: 'You can verify your certificate using this verification code at the link below.',
        detailsTitle: 'CERTIFICATE DETAILS',
        training: 'Training',
        verifyCode: 'Verification Code',
        preview: 'Your {trainingName} certificate is ready.',
        buttonText: 'View Certificate',
    },
};

export const CertificateReadyEmail = (data: CertificateReadyEmailData) => {
    const t = translations[data.language || 'tr'];
    const preview = t.preview.replace('{trainingName}', data.trainingName);

    return (
        <BaseLayout preview={preview} heading={t.heading} language={data.language}>
            <Text style={sharedStyles.paragraph}>
                {t.greeting.replace('{studentName}', data.studentName)}
            </Text>

            <Text style={sharedStyles.paragraph}>
                {t.readyText.replace('{institutionName}', data.institutionName)}
            </Text>

            <Text style={sharedStyles.paragraph}>
                {t.infoText}
            </Text>

            <div style={sharedStyles.successBox}>
                <Text style={sharedStyles.label}>{t.detailsTitle}</Text>

                <div style={{ marginBottom: '12px' }}>
                    <Text style={sharedStyles.label}>{t.training}</Text>
                    <Text style={sharedStyles.value}>{data.trainingName}</Text>
                </div>

                {data.verificationCode && (
                    <div style={{ marginBottom: '12px' }}>
                        <Text style={sharedStyles.label}>{t.verifyCode}</Text>
                        <Text style={{ ...sharedStyles.value, fontFamily: 'monospace', letterSpacing: '1px' }}>{data.verificationCode}</Text>
                        <Text style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{t.verifyInfo}</Text>
                        <Text style={{ fontSize: '12px', color: '#0066cc', marginTop: '4px', textDecoration: 'underline' }}>www.mertcin.com/verify</Text>
                    </div>
                )}
            </div>

            <div style={sharedStyles.center}>
                <a href={data.verificationUrl} style={sharedStyles.button}>
                    {t.buttonText}
                </a>
            </div>
        </BaseLayout>
    );
};

export default CertificateReadyEmail;

