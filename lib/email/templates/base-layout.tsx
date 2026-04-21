import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
} from '@react-email/components';
import * as React from 'react';

interface BaseLayoutProps {
    preview: string;
    heading: string;
    children: React.ReactNode;
    language?: 'tr' | 'en';
}

const translations = {
    tr: {
        footer: {
            copyright: '© 2024 Mert CIN. Tüm hakları saklıdır.',
            address: 'Türkiye',
            unsubscribe: 'Bildirim ayarlarınızı değiştirmek için',
            clickHere: 'tıklayın',
        },
    },
    en: {
        footer: {
            copyright: '© 2024 Mert CIN. All rights reserved.',
            address: 'Turkey',
            unsubscribe: 'To change your notification settings',
            clickHere: 'click here',
        },
    },
};

export const BaseLayout = ({
    preview,
    heading,
    children,
    language = 'tr',
}: BaseLayoutProps) => {
    const t = translations[language].footer;

    return (
        <Html>
            <Head />
            <Preview>{preview}</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header with Logo */}
                    <Section style={header}>
                        <Img
                            src="https://mertcin.com/logo.png"
                            width="180"
                            height="40"
                            alt="MERTCINPLATFORM"
                            style={logo}
                        />
                    </Section>

                    {/* Main Content */}
                    <Section style={content}>
                        <Heading style={h1}>{heading}</Heading>
                        {children}
                    </Section>

                    {/* Footer */}
                    <Hr style={hr} />
                    <Section style={footer}>
                        <Text style={footerText}>{t.copyright}</Text>
                        <Text style={footerText}>{t.address}</Text>
                        <Text style={footerLinks}>
                            {t.unsubscribe}{' '}
                            <Link href="https://mertcin.com/settings" style={link}>
                                {t.clickHere}
                            </Link>
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default BaseLayout;

// Shared styles
const main = {
    backgroundColor: '#f7f9fc',
    fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '0',
    maxWidth: '600px',
    borderRadius: '12px',
    overflow: 'hidden' as const,
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
};

const header = {
    backgroundColor: '#0945A5',
    padding: '24px',
    textAlign: 'center' as const,
};

const logo = {
    margin: '0 auto',
};

const content = {
    padding: '32px 24px',
};

const h1 = {
    color: '#1f2937',
    fontSize: '24px',
    fontWeight: '700',
    lineHeight: '1.3',
    margin: '0 0 24px',
    textAlign: 'center' as const,
};

const hr = {
    borderColor: '#e5e7eb',
    margin: '0',
};

const footer = {
    padding: '24px',
    backgroundColor: '#f9fafb',
};

const footerText = {
    color: '#6b7280',
    fontSize: '12px',
    lineHeight: '1.5',
    margin: '4px 0',
    textAlign: 'center' as const,
};

const footerLinks = {
    color: '#6b7280',
    fontSize: '12px',
    lineHeight: '1.5',
    margin: '12px 0 0',
    textAlign: 'center' as const,
};

const link = {
    color: '#0945A5',
    textDecoration: 'underline',
};

// Exported shared styles for use in other templates
export const sharedStyles = {
    paragraph: {
        color: '#374151',
        fontSize: '16px',
        lineHeight: '1.6',
        margin: '16px 0',
    },
    button: {
        backgroundColor: '#0945A5',
        borderRadius: '8px',
        color: '#ffffff',
        display: 'inline-block',
        fontSize: '16px',
        fontWeight: '600',
        padding: '12px 24px',
        textDecoration: 'none',
        textAlign: 'center' as const,
    },
    buttonSecondary: {
        backgroundColor: '#7A56B9',
        borderRadius: '8px',
        color: '#ffffff',
        display: 'inline-block',
        fontSize: '16px',
        fontWeight: '600',
        padding: '12px 24px',
        textDecoration: 'none',
        textAlign: 'center' as const,
    },
    buttonWarning: {
        backgroundColor: '#f59e0b',
        borderRadius: '8px',
        color: '#ffffff',
        display: 'inline-block',
        fontSize: '16px',
        fontWeight: '600',
        padding: '12px 24px',
        textDecoration: 'none',
        textAlign: 'center' as const,
    },
    buttonDanger: {
        backgroundColor: '#dc2626',
        borderRadius: '8px',
        color: '#ffffff',
        display: 'inline-block',
        fontSize: '16px',
        fontWeight: '600',
        padding: '12px 24px',
        textDecoration: 'none',
        textAlign: 'center' as const,
    },
    infoBox: {
        backgroundColor: '#eff6ff',
        borderRadius: '8px',
        padding: '16px',
        margin: '24px 0',
        border: '1px solid #dbeafe',
    },
    warningBox: {
        backgroundColor: '#fffbeb',
        borderRadius: '8px',
        padding: '16px',
        margin: '24px 0',
        border: '1px solid #fef3c7',
    },
    successBox: {
        backgroundColor: '#ecfdf5',
        borderRadius: '8px',
        padding: '16px',
        margin: '24px 0',
        border: '1px solid #d1fae5',
    },
    dangerBox: {
        backgroundColor: '#fef2f2',
        borderRadius: '8px',
        padding: '16px',
        margin: '24px 0',
        border: '1px solid #fee2e2',
    },
    label: {
        color: '#6b7280',
        fontSize: '12px',
        fontWeight: '600',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
        margin: '0 0 4px',
    },
    value: {
        color: '#1f2937',
        fontSize: '16px',
        fontWeight: '600',
        margin: '0',
    },
    divider: {
        borderColor: '#e5e7eb',
        margin: '24px 0',
    },
    center: {
        textAlign: 'center' as const,
    },
};
