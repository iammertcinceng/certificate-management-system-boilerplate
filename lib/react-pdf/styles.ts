/**
 * Ortak Stiller - @react-pdf/renderer için
 * 
 * Tailwind CSS'den dönüştürülmüş stil sabitleri.
 * Tüm şablonlarda tutarlılık sağlamak için kullanılır.
 */

import { StyleSheet } from '@react-pdf/renderer';
import { DEFAULT_FONT_FAMILY, MONO_FONT_FAMILY } from './fonts';

// Renk sabitleri
export const colors = {
    white: '#FFFFFF',
    black: '#000000',
    gray: {
        50: '#F9FAFB',
        100: '#F3F4F6',
        200: '#E5E7EB',
        300: '#D1D5DB',
        400: '#9CA3AF',
        500: '#6B7280',
        600: '#4B5563',
        700: '#374151',
        800: '#1F2937',
        900: '#111827',
    },
};

// Font boyutları (px to pt conversion: 1px ≈ 0.75pt)
export const fontSize = {
    xs: 9,      // 12px
    sm: 10.5,   // 14px
    base: 12,   // 16px
    lg: 13.5,   // 18px
    xl: 15,     // 20px
    '2xl': 18,  // 24px
    '3xl': 22.5, // 30px
    '4xl': 27,  // 36px
    '5xl': 36,  // 48px
    '6xl': 45,  // 60px
};

// Spacing (px to pt)
export const spacing = {
    0: 0,
    1: 3,    // 4px
    2: 6,    // 8px
    3: 9,    // 12px
    4: 12,   // 16px
    5: 15,   // 20px
    6: 18,   // 24px
    8: 24,   // 32px
    10: 30,  // 40px
    12: 36,  // 48px
    16: 48,  // 64px
    20: 60,  // 80px
    24: 72,  // 96px
};

// Sertifika boyutları (A4 landscape - 1122x794 px → pt)
export const certificateDimensions = {
    width: 841.5,  // 1122px * 0.75
    height: 595.5, // 794px * 0.75
};

// Ortak stiller
export const commonStyles = StyleSheet.create({
    // Sayfa
    page: {
        width: certificateDimensions.width,
        height: certificateDimensions.height,
        backgroundColor: colors.white,
        fontFamily: DEFAULT_FONT_FAMILY,
        position: 'relative',
    },

    // Metin stilleri
    textXs: { fontSize: fontSize.xs },
    textSm: { fontSize: fontSize.sm },
    textBase: { fontSize: fontSize.base },
    textLg: { fontSize: fontSize.lg },
    textXl: { fontSize: fontSize.xl },
    text2xl: { fontSize: fontSize['2xl'] },
    text3xl: { fontSize: fontSize['3xl'] },
    text4xl: { fontSize: fontSize['4xl'] },
    text5xl: { fontSize: fontSize['5xl'] },
    text6xl: { fontSize: fontSize['6xl'] },

    // Font ağırlıkları
    fontNormal: { fontWeight: 400 },
    fontMedium: { fontWeight: 500 },
    fontSemibold: { fontWeight: 600 },
    fontBold: { fontWeight: 700 },

    // Metin hizalama
    textCenter: { textAlign: 'center' },
    textRight: { textAlign: 'right' },
    textLeft: { textAlign: 'left' },

    // Uppercase
    uppercase: { textTransform: 'uppercase' },

    // Mono font
    fontMono: { fontFamily: MONO_FONT_FAMILY },

    // Flexbox
    flex: { display: 'flex' },
    flexRow: { flexDirection: 'row' },
    flexCol: { flexDirection: 'column' },
    itemsCenter: { alignItems: 'center' },
    itemsEnd: { alignItems: 'flex-end' },
    justifyCenter: { justifyContent: 'center' },
    justifyBetween: { justifyContent: 'space-between' },

    // Pozisyonlama
    absolute: { position: 'absolute' },
    relative: { position: 'relative' },

    // Utility
    wFull: { width: '100%' },
    hFull: { height: '100%' },
});

/**
 * Dinamik stil oluşturucu - renk bazlı stiller için
 */
export function createDynamicStyles(primaryColor: string, secondaryColor: string) {
    return StyleSheet.create({
        primaryText: { color: primaryColor },
        secondaryText: { color: secondaryColor },
        primaryBorder: { borderColor: primaryColor },
        secondaryBorder: { borderColor: secondaryColor },
        primaryBg: { backgroundColor: primaryColor },
        secondaryBg: { backgroundColor: secondaryColor },
    });
}
