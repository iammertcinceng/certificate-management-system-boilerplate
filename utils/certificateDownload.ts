/**
 * Certificate Download Utility
 * 
 * Server-side PDF generation (@react-pdf/renderer)
 * 
 * Usage:
 * import { downloadCertificatePdf } from '@/utils/certificateDownload';
 * await downloadCertificatePdf(certificateId, studentId);
 */

interface DownloadOptions {
    certificateId: string;
    studentId?: string;
    onProgress?: (message: string) => void;
}

/**
 * Download certificate PDF from server
 */
export async function downloadCertificatePdf(options: DownloadOptions): Promise<boolean> {
    const { certificateId, studentId, onProgress } = options;

    // Ana @react-pdf endpoint'ini kullan
    const url = studentId
        ? `/api/certificates/${certificateId}/download?studentId=${studentId}`
        : `/api/certificates/${certificateId}/download`;

    try {
        onProgress?.('PDF hazırlanıyor...');

        const res = await fetch(url);

        if (res.ok) {
            const blob = await res.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            // Extract filename from Content-Disposition header or use default
            const contentDisposition = res.headers.get('Content-Disposition');
            let filename = `certificate-${certificateId}.pdf`;
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?(.+?)"?$/);
                if (match) filename = match[1];
            }

            // Trigger download
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(a);

            onProgress?.('İndirme tamamlandı!');
            return true;
        }

        // Error response
        const errorData = await res.json().catch(() => ({ error: 'Bilinmeyen hata' }));
        throw new Error(errorData.error || `Download failed: ${res.status}`);

    } catch (error: any) {
        console.error('Certificate download error:', error);
        onProgress?.(`Hata: ${error.message}`);
        return false;
    }
}
