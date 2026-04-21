/**
 * PDF Generation Utility - @react-pdf/renderer
 * 
 * Sertifika verilerinden PDF Buffer üretir.
 * Server-side kullanım için optimize edilmiştir.
 */

import React from 'react';
import { renderToBuffer, Document, Page } from '@react-pdf/renderer';
import { CertificateData, CertificateTemplateType } from '@/types/certificate';
import { registerFonts } from './fonts';
import { certificateDimensions, colors } from './styles';

// Templates
import { ClassicTemplate } from './templates/ClassicTemplate';
import { ModernTemplate } from './templates/ModernTemplate';
import { CreativeTemplate } from './templates/CreativeTemplate';
import { ElegantTemplate } from './templates/ElegantTemplate';
import { ProfessionalTemplate } from './templates/ProfessionalTemplate';
import { ExecutiveTemplate } from './templates/ExecutiveTemplate';
import { MinimalTemplate } from './templates/MinimalTemplate';

// Fontları kaydet
registerFonts();

/**
 * Template seçimine göre doğru şablonu döndür
 */
function getTemplateComponent(templateKey: CertificateTemplateType) {
    switch (templateKey) {
        case 'classic':
            return ClassicTemplate;
        case 'modern':
            return ModernTemplate;
        case 'creative':
            return CreativeTemplate;
        case 'elegant':
            return ElegantTemplate;
        case 'professional':
            return ProfessionalTemplate;
        case 'executive':
            return ExecutiveTemplate;
        case 'minimal':
            return MinimalTemplate;
        default:
            return ClassicTemplate;
    }
}

/**
 * Sertifika verisinden PDF Buffer üretir
 * 
 * @param data - Sertifika verileri (CertificateData)
 * @returns Promise<Buffer> - PDF dosyası buffer olarak
 * 
 * @example
 * ```ts
 * const pdfBuffer = await generateCertificatePdfBuffer(certificateData);
 * // Response olarak gönder veya dosyaya yaz
 * ```
 */
export async function generateCertificatePdfBuffer(data: CertificateData): Promise<Buffer> {
    try {
        const TemplateComponent = getTemplateComponent(data.templateKey);

        // Doğrudan Document ve Page elementlarını oluştur
        const document = (
            <Document
                title={`Sertifika - ${data.studentName}`}
                author={data.institutionName}
                subject={data.trainingName}
                keywords="sertifika, certificate, eğitim, training"
                creator="Mert CIN Certificates"
                producer="@react-pdf/renderer"
            >
                <Page
                    size={[certificateDimensions.width, certificateDimensions.height]}
                    style={{ backgroundColor: colors.white }}
                >
                    <TemplateComponent data={data} />
                </Page>
            </Document>
        );

        // React PDF Document'ı Buffer'a render et
        const pdfBuffer = await renderToBuffer(document);

        return pdfBuffer;
    } catch (error) {
        console.error('[react-pdf] PDF generation error:', error);
        throw new Error(`PDF oluşturulamadı: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
}

/**
 * PDF dosya adı oluştur
 * 
 * @param data - Sertifika verileri
 * @param studentFirstName - Öğrenci adı
 * @param studentLastName - Öğrenci soyadı
 * @returns Dosya adı (örn: "sertifika-CERT123-Ahmet-Yilmaz.pdf")
 */
export function generatePdfFilename(
    data: CertificateData,
    studentFirstName?: string,
    studentLastName?: string
): string {
    const parts = ['sertifika'];

    if (data.publicId) {
        parts.push(data.publicId);
    }

    if (studentFirstName) {
        parts.push(studentFirstName);
    }

    if (studentLastName) {
        parts.push(studentLastName);
    }

    // Türkçe karakterleri ve boşlukları temizle
    const filename = parts
        .join('-')
        .replace(/[ğ]/g, 'g')
        .replace(/[ü]/g, 'u')
        .replace(/[ş]/g, 's')
        .replace(/[ı]/g, 'i')
        .replace(/[ö]/g, 'o')
        .replace(/[ç]/g, 'c')
        .replace(/[Ğ]/g, 'G')
        .replace(/[Ü]/g, 'U')
        .replace(/[Ş]/g, 'S')
        .replace(/[İ]/g, 'I')
        .replace(/[Ö]/g, 'O')
        .replace(/[Ç]/g, 'C')
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_-]/g, '');

    return `${filename}.pdf`;
}

export default generateCertificatePdfBuffer;
