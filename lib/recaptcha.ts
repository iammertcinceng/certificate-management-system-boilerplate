/**
 * Google reCAPTCHA v3 Utility
 * 
 * Kullanım:
 * 1. Google reCAPTCHA admin panelinden site key ve secret key al
 *    https://www.google.com/recaptcha/admin
 * 2. Domain olarak hem "localhost" hem production domain'ini ekle
 * 3. .env dosyasına ekle:
 *    NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6Le...
 *    RECAPTCHA_SECRET_KEY=6Le...
 * 
 * Frontend: executeRecaptcha('login') → token döner
 * Backend: verifyRecaptcha(token) → { success, score } döner
 */

// ─── Frontend: reCAPTCHA v3 script yükle ve token al ───

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';

let recaptchaScriptLoaded = false;
let recaptchaScriptLoading = false;
const loadCallbacks: (() => void)[] = [];

/**
 * reCAPTCHA v3 script'ini sayfaya yükler (bir kez)
 */
export function loadRecaptchaScript(): Promise<void> {
    if (recaptchaScriptLoaded) return Promise.resolve();
    if (!SITE_KEY) {
        console.warn('[reCAPTCHA] NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not set');
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        if (recaptchaScriptLoading) {
            loadCallbacks.push(resolve);
            return;
        }
        recaptchaScriptLoading = true;

        const script = document.createElement('script');
        script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            recaptchaScriptLoaded = true;
            recaptchaScriptLoading = false;
            resolve();
            loadCallbacks.forEach(cb => cb());
            loadCallbacks.length = 0;
        };
        script.onerror = () => {
            recaptchaScriptLoading = false;
            console.error('[reCAPTCHA] Failed to load script');
            resolve(); // Don't block login if reCAPTCHA fails to load
        };
        document.head.appendChild(script);
    });
}

/**
 * reCAPTCHA v3 token üretir
 * @param action - İşlem adı (örn: 'login', 'register')
 * @returns Token string veya boş string (reCAPTCHA yapılandırılmamışsa)
 */
export async function executeRecaptcha(action: string): Promise<string> {
    if (!SITE_KEY) return '';

    try {
        await loadRecaptchaScript();
        const grecaptcha = (window as any).grecaptcha;
        if (!grecaptcha) return '';

        return await new Promise<string>((resolve) => {
            grecaptcha.ready(() => {
                grecaptcha.execute(SITE_KEY, { action }).then(resolve).catch(() => resolve(''));
            });
        });
    } catch {
        console.error('[reCAPTCHA] Token generation failed');
        return '';
    }
}

/**
 * reCAPTCHA yapılandırılmış mı?
 */
export function isRecaptchaEnabled(): boolean {
    return !!SITE_KEY;
}
