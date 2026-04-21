"use client";
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

type StudentLite = {
  id: string;
  nationalId: string;
  firstName: string;
  lastName: string;
  birthDate: string;
};

export type PetitionCert = {
  id: string;
  trainingName: string;
  dateIssued: string;
  totalHours?: number | null;
  students: StudentLite[];
};

function formatDate(iso?: string) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  } catch {
    return '';
  }
}

export default function PetitionDownloadButton({ cert, orgName }: { cert: PetitionCert; orgName?: string }) {
  const { t } = useLanguage();

  const onClick = async () => {
    const pdfMake = (await import('pdfmake/build/pdfmake')).default as any;
    const pdfFonts = await import('pdfmake/build/vfs_fonts');
    // Different bundles expose vfs under pdfMake.vfs
    (pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || (pdfFonts as any).vfs;

    const count = String(cert.students?.length || 0);
    const header = orgName || t('acreditor.approvals.petition.headerDefault');
    const paragraph = t('acreditor.approvals.petition.paragraph').replace('{count}', count);

    const endDate = formatDate(cert.dateIssued);
    const hoursText = (typeof cert.totalHours === 'number' && !isNaN(cert.totalHours)) ? String(cert.totalHours) : '';

    const body: any[] = [];
    body.push([
      { text: t('acreditor.approvals.petition.table.no'), style: 'th' },
      { text: t('acreditor.approvals.petition.table.student'), style: 'th' },
      { text: t('acreditor.approvals.petition.table.tc'), style: 'th' },
      { text: t('acreditor.approvals.petition.table.birth'), style: 'th' },
      { text: t('acreditor.approvals.petition.table.end'), style: 'th' },
      { text: t('acreditor.approvals.petition.table.hours'), style: 'th' },
      { text: t('acreditor.approvals.petition.table.training'), style: 'th' },
      { text: t('acreditor.approvals.petition.table.exam'), style: 'th' },
    ]);

    (cert.students || []).forEach((s, idx) => {
      body.push([
        String(idx + 1),
        `${s.firstName} ${s.lastName}`.trim(),
        s.nationalId || '',
        formatDate(s.birthDate) || '',
        endDate,
        hoursText,
        cert.trainingName || '',
        ''
      ]);
    });

    const docDefinition: any = {
      pageSize: 'A4',
      pageOrientation: 'landscape',
      content: [
        { text: header, alignment: 'center', style: 'header', margin: [0, 5, 0, 10] },
        { text: paragraph, margin: [15, 0, 15, 10], style: 'paragraph' },
        {
          table: {
            headerRows: 1,
            widths: [25, '*', 80, 70, 70, 40, '*', 90],
            body
          },
          layout: 'lightHorizontalLines',
          fontSize: 9,
          margin: [10, 0, 10, 0]
        }
      ],
      defaultStyle: {
        font: 'Roboto'
      },
      styles: {
        header: { fontSize: 16, bold: true },
        th: { bold: true },
        paragraph: { fontSize: 11 }
      }
    };

    pdfMake.createPdf(docDefinition).download(`${cert.id}_dilekce.pdf`);
  };

  return (
    <button onClick={onClick} className="px-4 py-2 rounded-lg border border-blue-300 bg-white text-blue-700 hover:bg-blue-50 font-medium transition-colors">
      📄 {t('acreditor.approvals.actions.downloadPetition')}
    </button>
  );
}
