import { Text } from '@react-email/components';
import { BaseLayout, sharedStyles } from './base-layout';
import type { WelcomeEmailData } from '../types';
import * as React from 'react';

const translations = {
    tr: {
        heading: 'MERTCINPLATFORM\'e Hoş Geldiniz! 🎊',
        greeting: 'Merhaba,',
        welcomeText: 'MERTCINPLATFORM ailesine katıldığınız için teşekkür ederiz. Hesabınız başarıyla oluşturuldu.',
        orgText: '{orgName} adına işlemlerinizi kolaylıkla yönetebilirsiniz.',
        infoText: 'Sistemimize giriş yaparak sertifika oluşturmaya başlayabilir, akreditasyonlarınızı yönetebilir ve daha fazlasını yapabilirsiniz.',
        preview: 'MERTCINPLATFORM hesabınız oluşturuldu.',
        buttonText: 'Hesabıma Giriş Yap',
    },
    en: {
        heading: 'Welcome to MERTCINPLATFORM! 🎊',
        greeting: 'Hello,',
        welcomeText: 'Thank you for joining MERTCINPLATFORM family. Your account has been successfully created.',
        orgText: 'You can easily manage operations for {orgName}.',
        infoText: 'Log in to our system to start creating certificates, managing accreditations, and more.',
        preview: 'Your MERTCINPLATFORM account has been created.',
        buttonText: 'Log In to Account',
    },
};

export const WelcomeEmail = (data: WelcomeEmailData) => {
    const t = translations[data.language || 'tr'];
    const preview = t.preview;

    return (
        <BaseLayout preview={preview} heading={t.heading} language={data.language}>
            <Text style={sharedStyles.paragraph}>{t.greeting}</Text>

            <Text style={sharedStyles.paragraph}>
                {t.welcomeText}
            </Text>

            {data.organizationName && (
                <Text style={sharedStyles.paragraph}>
                    {t.orgText.replace('{orgName}', data.organizationName)}
                </Text>
            )}

            <Text style={sharedStyles.paragraph}>
                {t.infoText}
            </Text>

            <div style={sharedStyles.center}>
                <a href={data.loginUrl} style={sharedStyles.button}>
                    {t.buttonText}
                </a>
            </div>
        </BaseLayout>
    );
};

export default WelcomeEmail;
