import { Text } from '@react-email/components';
import { BaseLayout, sharedStyles } from './base-layout';
import type { PasswordResetEmailData } from '../types';
import * as React from 'react';

const translations = {
    tr: {
        heading: 'Şifre Sıfırlama Talebi',
        greeting: 'Merhaba,',
        infoText: 'Hesabınız için şifre sıfırlama talebinde bulundunuz. Aşağıdaki butona tıklayarak yeni şifrenizi oluşturabilirsiniz.',
        warningText: 'Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz. Şifreniz güvende kalacaktır.',
        expiresIn: 'Bu link {time} süreyle geçerlidir.',
        preview: 'Şifre sıfırlama talebiniz alındı.',
        buttonText: 'Şifremi Sıfırla',
    },
    en: {
        heading: 'Password Reset Request',
        greeting: 'Hello,',
        infoText: 'You have requested to reset your password. You can create a new password by clicking the button below.',
        warningText: 'If you did not make this request, you can ignore this email. Your password will remain safe.',
        expiresIn: 'This link is valid for {time}.',
        preview: 'Your password reset request has been received.',
        buttonText: 'Reset Password',
    },
};

export const PasswordResetEmail = (data: PasswordResetEmailData) => {
    const t = translations[data.language || 'tr'];
    const preview = t.preview;

    return (
        <BaseLayout preview={preview} heading={t.heading} language={data.language}>
            <Text style={sharedStyles.paragraph}>{t.greeting}</Text>

            <Text style={sharedStyles.paragraph}>
                {t.infoText}
            </Text>

            <div style={sharedStyles.center}>
                <a href={data.resetUrl} style={sharedStyles.button}>
                    {t.buttonText}
                </a>
            </div>

            <Text style={{ ...sharedStyles.paragraph, fontSize: '14px', color: '#6b7280' }}>
                {t.expiresIn.replace('{time}', data.expiresIn)}
            </Text>

            <div style={sharedStyles.warningBox}>
                <Text style={{ ...sharedStyles.paragraph, margin: 0, fontSize: '14px' }}>
                    {t.warningText}
                </Text>
            </div>
        </BaseLayout>
    );
};

export default PasswordResetEmail;
