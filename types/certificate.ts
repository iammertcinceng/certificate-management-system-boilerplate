// Certificate template types
export type CertificateTemplateType = 'classic' | 'modern' | 'creative' | 'elegant' | 'professional' | 'executive' | 'minimal';

export interface CertificateTemplate {
  key: CertificateTemplateType;
  nameKey: string;        // i18n çeviri key'i
  descriptionKey: string; // i18n çeviri key'i
  preview?: string;
}

export interface CertificateData {
  // Certificate info
  id?: string; // Certificate UUID (for verification URL)
  studentId?: string; // Student ID (for QR verification URL query param)
  certificateNumber: string; // Legacy field (kept for backwards compatibility)
  certificateCode?: string; // Unique certificate code (verifyBaseKey + sequenceNo)
  verificationUrl?: string; // Full verification URL
  publicId: string;
  dateIssued: string;

  // Student info
  studentName: string;
  studentTc?: string;

  // Training info
  trainingName: string;
  trainingDescription?: string;
  trainingHours?: number;
  trainingLevel?: string;
  trainingLanguage?: string;
  trainingStartDate?: string; // Training start date (for date range display)
  trainingEndDate?: string; // Training end date (for date range display)

  // Institution info
  institutionName: string;
  institutionLogo?: string;
  institutionSignature?: string; // Base64 PNG with transparent background
  institutionSignatureName?: string; // Name under signature (e.g., "Jeffrey T. Sooey")
  institutionSignatureTitle?: string; // Title under name (e.g., "Dean")

  // Partners info
  partners: Array<{
    name: string;
    logo?: string;
    signature?: string; // Base64 PNG with transparent background
    signatureName?: string; // Name under signature
    signatureTitle?: string; // Title under name
  }>;

  // Site info
  siteLogo?: string;
  siteName: string;

  // Theme colors
  primaryColor: string;
  secondaryColor: string;

  // Template
  templateKey: CertificateTemplateType;

  // QR Code Data URL (for embedding in PDF)
  qrCode?: string;
}

export const CERTIFICATE_TEMPLATES: CertificateTemplate[] = [
  {
    key: 'classic',
    nameKey: 'institution.certificates.templates.classic.name',
    descriptionKey: 'institution.certificates.templates.classic.description',
  },
  {
    key: 'modern',
    nameKey: 'institution.certificates.templates.modern.name',
    descriptionKey: 'institution.certificates.templates.modern.description',
  },
  {
    key: 'creative',
    nameKey: 'institution.certificates.templates.creative.name',
    descriptionKey: 'institution.certificates.templates.creative.description',
  },
  {
    key: 'elegant',
    nameKey: 'institution.certificates.templates.elegant.name',
    descriptionKey: 'institution.certificates.templates.elegant.description',
  },
  {
    key: 'professional',
    nameKey: 'institution.certificates.templates.professional.name',
    descriptionKey: 'institution.certificates.templates.professional.description',
  },
  {
    key: 'executive',
    nameKey: 'institution.certificates.templates.executive.name',
    descriptionKey: 'institution.certificates.templates.executive.description',
  },
  {
    key: 'minimal',
    nameKey: 'institution.certificates.templates.minimal.name',
    descriptionKey: 'institution.certificates.templates.minimal.description',
  },
];
