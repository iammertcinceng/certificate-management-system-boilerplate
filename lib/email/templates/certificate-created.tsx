import { Text } from '@react-email/components';
import { BaseLayout, sharedStyles } from './base-layout';
import type { CertificateCreatedEmailData } from '../types';
import * as React from 'react';

const translations = {
    tr: {
        heading: 'Yeni Sertifika Oluşturuldu',
        greeting: 'Merhaba,',
        createdText: 'Sistemde yeni bir sertifika oluşturuldu ve onayınızı bekliyor.',
        bulkText: 'Toplu oluşturma işlemi başarıyla tamamlandı.',
        detailsTitle: 'İŞLEM DETAYLARI',
        training: 'Eğitim',
        studentCount: 'Öğrenci Sayısı',
        certId: 'Sertifika No',
        preview: '{trainingName} eğitimi için yeni sertifika oluşturuldu.',
        buttonText: 'Onay Ekranına Git',
    },
    en: {
        heading: 'New Certificate Created',
        greeting: 'Hello,',
        createdText: 'A new certificate has been created in the system and is waiting for your approval.',
        bulkText: 'Bulk creation process completed successfully.',
        detailsTitle: 'DETAILS',
        training: 'Training',
        studentCount: 'Student Count',
        certId: 'Certificate ID',
        preview: 'New certificate created for {trainingName}.',
        buttonText: 'Go to Approval Page',
    },
};

export const CertificateCreatedEmail = (data: CertificateCreatedEmailData) => {
    const t = translations[data.language || 'tr'];
    const preview = t.preview.replace('{trainingName}', data.trainingName);

    return (
        <BaseLayout preview={preview} heading={t.heading} language={data.language}>
            <Text style={sharedStyles.paragraph}>{t.greeting}</Text>

            <Text style={sharedStyles.paragraph}>
                {data.studentCount > 1 ? t.bulkText : t.createdText}
            </Text>

            <div style={sharedStyles.infoBox}>
                <Text style={sharedStyles.label}>{t.detailsTitle}</Text>

                <div style={{ marginBottom: '12px' }}>
                    <Text style={sharedStyles.label}>{t.training}</Text>
                    <Text style={sharedStyles.value}>{data.trainingName}</Text>
                </div>

                {data.studentCount > 1 ? (
                    <div>
                        <Text style={sharedStyles.label}>{t.studentCount}</Text>
                        <Text style={sharedStyles.value}>{data.studentCount}</Text>
                    </div>
                ) : (
                    <div>
                        <Text style={sharedStyles.label}>{t.certId}</Text>
                        <Text style={sharedStyles.value}>{data.certificatePublicId}</Text>
                    </div>
                )}
            </div>

            <div style={sharedStyles.center}>
                <a href={data.approvalUrl} style={sharedStyles.button}>
                    {t.buttonText}
                </a>
            </div>
        </BaseLayout>
    );
};

export default CertificateCreatedEmail;
