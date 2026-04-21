import { Text } from '@react-email/components';
import { BaseLayout, sharedStyles } from './base-layout';
import type { LowBalanceEmailData } from '../types';
import * as React from 'react';

const translations = {
    tr: {
        heading: '⚠️ Düşük Bakiye Uyarısı',
        greeting: 'Merhaba,',
        warningText: 'Hesap bakiyeniz belirlenen eşiğin altına düşmüştür. Sertifika oluşturma işlemlerinizin kesintiye uğramaması için bakiye yüklemenizi öneririz.',
        detailsTitle: 'BAKİYE DURUMU',
        currentBalance: 'Mevcut Bakiye',
        threshold: 'Uyarı Eşiği',
        preview: 'Bakiyeniz {balance} krediye düştü.',
        buttonText: 'Bakiye Yükle',
    },
    en: {
        heading: '⚠️ Low Balance Warning',
        greeting: 'Hello,',
        warningText: 'Your account balance has dropped below the threshold. We recommend topping up your balance to avoid interruption in certificate creation.',
        detailsTitle: 'BALANCE STATUS',
        currentBalance: 'Current Balance',
        threshold: 'Warning Threshold',
        preview: 'Your balance dropped to {balance} credits.',
        buttonText: 'Top Up Balance',
    },
};

export const LowBalanceWarningEmail = (data: LowBalanceEmailData) => {
    const t = translations[data.language || 'tr'];
    const preview = t.preview.replace('{balance}', data.currentBalance.toString());

    return (
        <BaseLayout preview={preview} heading={t.heading} language={data.language}>
            <Text style={sharedStyles.paragraph}>{t.greeting}</Text>

            <Text style={sharedStyles.paragraph}>
                {t.warningText}
            </Text>

            <div style={sharedStyles.warningBox}>
                <Text style={{ ...sharedStyles.label, color: '#92400e' }}>{t.detailsTitle}</Text>

                <div style={{ marginBottom: '12px' }}>
                    <Text style={sharedStyles.label}>{t.currentBalance}</Text>
                    <Text style={{ ...sharedStyles.value, color: '#b45309', fontSize: '24px' }}>{data.currentBalance}</Text>
                </div>

                <div>
                    <Text style={sharedStyles.label}>{t.threshold}</Text>
                    <Text style={sharedStyles.value}>{data.threshold}</Text>
                </div>
            </div>

            <div style={sharedStyles.center}>
                <a href={data.topUpUrl} style={sharedStyles.buttonWarning}>
                    {t.buttonText}
                </a>
            </div>
        </BaseLayout>
    );
};

export default LowBalanceWarningEmail;
