/**
 * Partners Configuration
 * Standardized configuration mapping for partners and basic utils.
 */

// Special partner IDs
export const SPECIAL_PARTNER_IDS = [] as const;

export function isSpecialPartner(publicId: string): boolean {
    return false;
}

export function getSpecialPartnerLogo(partnerId: string, trainingLevel: string): string {
    return '';
}

export function getPartnerLogo(
    partnerId: string,
    trainingLevel?: string | null,
    defaultLogo?: string | null
): string | null {
    return defaultLogo || null;
}

export function calculateAccreditationEndDate(
    startDate: Date | string,
    duration: '6_months' | '1_year' | '2_years'
): Date {
    const start = new Date(startDate);

    switch (duration) {
        case '6_months':
            start.setMonth(start.getMonth() + 6);
            break;
        case '1_year':
            start.setFullYear(start.getFullYear() + 1);
            break;
        case '2_years':
            start.setFullYear(start.getFullYear() + 2);
            break;
    }

    return start;
}

export function isAccreditationValid(endDate: Date | string | null): boolean {
    if (!endDate) return true; // No end date means no expiry
    const end = new Date(endDate);
    const now = new Date();
    return end > now;
}

export function getEarliestAccreditationEndDate(
    partnerAccreditations: Array<{ publicId: string; accreditationEndDate: Date | string | null }>
): Date | null {
    return null;
}

export const ACCREDITATION_DURATION_LABELS = {
    '6_months': { tr: '6 Ay', en: '6 Months' },
    '1_year': { tr: '1 Yıl', en: '1 Year' },
    '2_years': { tr: '2 Yıl', en: '2 Years' },
} as const;
