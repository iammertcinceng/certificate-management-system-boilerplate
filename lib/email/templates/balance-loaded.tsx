import { Text } from '@react-email/components';
import { BaseLayout, sharedStyles } from './base-layout';
import type { BalanceLoadedEmailData } from '../types';
import * as React from 'react';

const translations = {
    tr: {
        heading: 'Bakiye Yükleme Başarılı',
        greeting: 'Merhaba,',
        successText: 'Hesabınıza bakiye yükleme işlemi başarıyla tamamlanmıştır.',
        detailsTitle: 'İŞLEM DETAYLARI',
        amount: 'Yüklenen Miktar',
        newBalance: 'Yeni Bakiye',
        preview: 'Hesabınıza {amount} kredi yüklendi.',
        buttonText: 'Hesabıma Git',
    },
    en: {
        heading: 'Balance Loaded Successfully',
        greeting: 'Hello,',
        successText: 'Balance top-up to your account has been completed successfully.',
        detailsTitle: 'TRANSACTION DETAILS',
        amount: 'Loaded Amount',
        newBalance: 'New Balance',
        preview: '{amount} credits have been added to your account.',
        buttonText: 'Go to Dashboard',
    },
};

export const BalanceLoadedEmail = (data: BalanceLoadedEmailData) => {
    const t = translations[data.language || 'tr'];
    const preview = t.preview.replace('{amount}', data.amount.toString());

    return (
        <BaseLayout preview={preview} heading={t.heading} language={data.language}>
            <Text style={sharedStyles.paragraph}>{t.greeting}</Text>

            <Text style={sharedStyles.paragraph}>
                {t.successText}
            </Text>

            <div style={sharedStyles.successBox}>
                <Text style={{ ...sharedStyles.label, color: '#065f46' }}>{t.detailsTitle}</Text>

                <div style={{ marginBottom: '12px' }}>
                    <Text style={sharedStyles.label}>{t.amount}</Text>
                    <Text style={{ ...sharedStyles.value, color: '#047857', fontSize: '20px' }}>+{data.amount}</Text>
                </div>

                <div>
                    <Text style={sharedStyles.label}>{t.newBalance}</Text>
                    <Text style={sharedStyles.value}>{data.newBalance}</Text>
                </div>
            </div>

            <div style={sharedStyles.center}>
                <a href="https://mertcin.com/institution/credits" style={sharedStyles.button}>
                    {t.buttonText}
                </a>
            </div>
        </BaseLayout>
    );
};

export default BalanceLoadedEmail;
