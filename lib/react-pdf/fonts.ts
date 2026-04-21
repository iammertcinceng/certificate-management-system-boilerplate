/**
 * Font Registration for @react-pdf/renderer
 * 
 * Roboto fontu kullanılıyor - Türkçe karakter desteği tam.
 * Lokal font dosyaları kullanılıyor (prod'da dış bağımlılık yok).
 */

import { Font } from '@react-pdf/renderer';
import path from 'path';

// Font kayıt durumunu takip et
let fontsRegistered = false;

/**
 * Fontları kaydet
 */
export function registerFonts(): void {
    if (fontsRegistered) return;

    // Lokal font dosyalarının yolu
    const fontDir = path.join(process.cwd(), 'public', 'fonts');

    // Roboto - Lokal TTF dosyaları
    Font.register({
        family: 'Roboto',
        fonts: [
            {
                src: path.join(fontDir, 'Roboto-Regular.ttf'),
                fontWeight: 400,
            },
            {
                src: path.join(fontDir, 'Roboto-Italic.ttf'),
                fontWeight: 400,
                fontStyle: 'italic',
            },
            {
                src: path.join(fontDir, 'Roboto-Medium.ttf'),
                fontWeight: 500,
            },
            {
                src: path.join(fontDir, 'Roboto-Bold.ttf'),
                fontWeight: 700,
            },
        ],
    });

    // Hyphenation kapalı (Türkçe için)
    Font.registerHyphenationCallback((word) => [word]);

    fontsRegistered = true;
}

// Font aileleri
export const DEFAULT_FONT_FAMILY = 'Roboto';
export const MONO_FONT_FAMILY = 'Courier';

