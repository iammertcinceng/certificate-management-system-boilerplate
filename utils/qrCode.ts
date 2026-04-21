import QRCode from 'qrcode';

/**
 * Generate QR code as data URL
 * @param url - URL to encode in QR code
 * @param size - Size of QR code in pixels (default: 200)
 * @returns Promise with data URL
 */
export const generateQRCode = async (
  url: string,
  size: number = 200
): Promise<string> => {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      width: size,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('QR kod oluşturulamadı');
  }
};

/**
 * Get certificate verification URL
 * @param id - Certificate ID (UUID)
 * @param studentId - Student ID (UUID)
 * @returns Full URL for certificate verification
 */
export const getCertificateVerificationUrl = (id: string, studentId: string): string => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/verify/result/${id}?studentId=${studentId}`;
  }
  // Fallback for SSR
  return `/verify/result/${id}`;
};

/**
 * Get certificate verification URL by ID
 * @param id - Certificate ID (UUID)
 * @returns Full URL for certificate verification result page
 */
export const getCertificateVerificationUrlById = (id: string): string => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/verify/result/${id}`;
  }
  // Fallback for SSR
  return `/verify/result/${id}`;
};

/**
 * Get verify result URL by verify key (and optional 1-based index)
 * Example:
 *  - baseKey: C12340708 -> /verify/result?q=C12340708
 *  - baseKey: C12340708, index: 1 -> /verify/result?q=C123407081
 */
export const getVerifyResultUrlByKey = (baseKey: string, index?: number): string => {
  const suffix = typeof index === 'number' && index > 0 ? String(index) : '';
  const q = `${baseKey}${suffix}`;
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/verify/result?q=${encodeURIComponent(q)}`;
  }
  return `/verify/result?q=${encodeURIComponent(q)}`;
};
