/**
 * reCAPTCHA v3 — Backend Doğrulama
 * 
 * API route'larda kullanım:
 *   const { success, score } = await verifyRecaptcha(token);
 *   if (!success || score < 0.5) return NextResponse.json({ error: '...' }, { status: 403 });
 */

const SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || '';

interface RecaptchaVerifyResponse {
    success: boolean;
    score: number;       // 0.0 (bot) — 1.0 (insan)
    action?: string;
    challenge_ts?: string;
    hostname?: string;
    'error-codes'?: string[];
}

/**
 * reCAPTCHA v3 token'ını Google sunucularında doğrular
 * @param token - Frontend'den gelen reCAPTCHA token
 * @param expectedAction - Beklenen action adı (opsiyonel, ekstra güvenlik)
 * @returns { success, score }
 */
export async function verifyRecaptcha(
    token: string,
    expectedAction?: string
): Promise<{ success: boolean; score: number }> {
    // reCAPTCHA yapılandırılmamışsa geç (development kolaylığı)
    if (!SECRET_KEY) {
        console.warn('[reCAPTCHA] RECAPTCHA_SECRET_KEY is not set — skipping verification');
        return { success: true, score: 1.0 };
    }

    // Token yoksa doğrudan reddet
    if (!token) {
        return { success: false, score: 0.0 };
    }

    try {
        const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                secret: SECRET_KEY,
                response: token,
            }),
        });

        const data: RecaptchaVerifyResponse = await response.json();

        // Action kontrolü (opsiyonel ama önerilen)
        if (expectedAction && data.action !== expectedAction) {
            console.warn(`[reCAPTCHA] Action mismatch: expected "${expectedAction}", got "${data.action}"`);
            return { success: false, score: 0.0 };
        }

        return {
            success: data.success,
            score: data.score ?? 0.0,
        };
    } catch (error) {
        console.error('[reCAPTCHA] Verification request failed:', error);
        // Hata durumunda trafiği engellemememek için geçir (fail-open)
        // Production'da fail-close istersen burayı { success: false, score: 0 } yap
        return { success: true, score: 0.5 };
    }
}

/**
 * reCAPTCHA backend yapılandırılmış mı?
 */
export function isRecaptchaConfigured(): boolean {
    return !!SECRET_KEY;
}

/**
 * Önerilen minimum skor eşikleri
 */
export const RECAPTCHA_THRESHOLDS = {
    LOGIN: 0.5,       // Login için minimum skor
    REGISTER: 0.5,    // Kayıt için minimum skor
    CONTACT: 0.3,     // İletişim formu için daha düşük eşik
    BULK_CREATE: 0.4, // Toplu sertifika oluşturma için eşik
} as const;
