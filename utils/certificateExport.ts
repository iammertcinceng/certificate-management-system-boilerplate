import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// A4 dimensions in mm
export const A4_WIDTH_MM = 297; // Landscape
export const A4_HEIGHT_MM = 210;

// A4 dimensions in pixels at 96 DPI (for screen display)
export const A4_WIDTH_PX = 1122; // ~297mm at 96 DPI
export const A4_HEIGHT_PX = 794; // ~210mm at 96 DPI

// Scale factor for responsive display (adjust based on screen size)
export const getDisplayScale = (containerWidth: number): number => {
  const maxWidth = Math.min(containerWidth * 0.9, 1000); // Max 1000px or 90% of container
  return maxWidth / A4_WIDTH_PX;
};

/**
 * Export certificate element to PDF
 * @param element - HTML element to export
 * @param filename - Output filename
 */
export const exportCertificateToPDF = async (
  element: HTMLElement,
  filename: string = 'certificate.pdf'
): Promise<void> => {
  try {
    // Capture the element as canvas with high quality and better font handling
    const canvas = await html2canvas(element, {
      scale: 2, // Higher quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      // Better font rendering for Turkish characters
      foreignObjectRendering: true,
      // Ensure proper font loading
      onclone: (clonedDoc) => {
        // Ensure Roboto font is loaded in the cloned document
        const link = clonedDoc.createElement('link');
        link.href = '/fonts/Roboto-Regular.ttf';
        link.rel = 'preload';
        link.as = 'font';
        link.type = 'font/ttf';
        link.crossOrigin = 'anonymous';
        clonedDoc.head.appendChild(link);
        
        // Add font face rules
        const style = clonedDoc.createElement('style');
        style.textContent = `
          @font-face {
            font-family: 'Roboto';
            src: url('/fonts/Roboto-Regular.ttf') format('truetype');
            font-weight: 400;
            font-style: normal;
          }
          @font-face {
            font-family: 'Roboto';
            src: url('/fonts/Roboto-Bold.ttf') format('truetype');
            font-weight: 700;
            font-style: normal;
          }
          @font-face {
            font-family: 'Roboto';
            src: url('/fonts/Roboto-Medium.ttf') format('truetype');
            font-weight: 500;
            font-style: normal;
          }
          * {
            font-family: 'Roboto', system-ui, -apple-system, 'Segoe UI', sans-serif !important;
          }
        `;
        clonedDoc.head.appendChild(style);
      },
    });

    // Create PDF in landscape A4 format
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // Calculate dimensions to fit A4
    const imgWidth = A4_WIDTH_MM;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Add image to PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    // Save PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error exporting certificate to PDF:', error);
    throw new Error('Sertifika PDF olarak dışa aktarılamadı');
  }
};

/**
 * Download certificate as PNG image
 * @param element - HTML element to export
 * @param filename - Output filename
 */
export const exportCertificateToPNG = async (
  element: HTMLElement,
  filename: string = 'certificate.png'
): Promise<void> => {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      // Better font rendering for Turkish characters
      foreignObjectRendering: true,
      // Ensure proper font loading
      onclone: (clonedDoc) => {
        // Ensure Roboto font is loaded in the cloned document
        const link = clonedDoc.createElement('link');
        link.href = '/fonts/Roboto-Regular.ttf';
        link.rel = 'preload';
        link.as = 'font';
        link.type = 'font/ttf';
        link.crossOrigin = 'anonymous';
        clonedDoc.head.appendChild(link);
        
        // Add font face rules
        const style = clonedDoc.createElement('style');
        style.textContent = `
          @font-face {
            font-family: 'Roboto';
            src: url('/fonts/Roboto-Regular.ttf') format('truetype');
            font-weight: 400;
            font-style: normal;
          }
          @font-face {
            font-family: 'Roboto';
            src: url('/fonts/Roboto-Bold.ttf') format('truetype');
            font-weight: 700;
            font-style: normal;
          }
          @font-face {
            font-family: 'Roboto';
            src: url('/fonts/Roboto-Medium.ttf') format('truetype');
            font-weight: 500;
            font-style: normal;
          }
          * {
            font-family: 'Roboto', system-ui, -apple-system, 'Segoe UI', sans-serif !important;
          }
        `;
        clonedDoc.head.appendChild(style);
      },
    });

    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      }
    });
  } catch (error) {
    console.error('Error exporting certificate to PNG:', error);
    throw new Error('Sertifika PNG olarak dışa aktarılamadı');
  }
};
