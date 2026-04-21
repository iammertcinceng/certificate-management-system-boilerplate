export type Institution = {
  id: string;
  slug?: string;
  name: string;
  vatNumber: string;
  taxOffice: string;
  loginEmail: string; // users.email - giriş için kullanılan email
  email: string; // organizations.infoEmail - iletişim email'i (help@kurum.com gibi)
  phone: string;
  website?: string;
  address?: string;
  about?: string;
  mission?: string;
  vision?: string;
  socialMedia?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  advantages?: string[];
  isPartner: boolean;
  signature?: string; // Base64 PNG with transparent background for certificate signing
  signatureName?: string; // Name to display under signature (e.g., "Jeffrey T. Sooey")
  signatureTitle?: string; // Title to display under name (e.g., "Dean, Master Coach University")
};
