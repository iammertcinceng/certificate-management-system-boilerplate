"use client";

import { useEffect, useState } from "react";

import { CertificateTemplateType } from '@/types/certificate';

export type DraftState = {
  template: CertificateTemplateType;
  trainingId: string | null;
  trainingName?: string | null;
  trainingHours?: number | null;
  trainingLevel?: string | null;
  trainingLanguage?: string | null;
  partners: string[]; // partner user ids
  referencePartnerPublicIds: string[]; // RFR public ids
  upperInstitutionRequired: boolean;
  upperInstitutionPartnerId: string | null;
  studentMethod: 'single' | 'bulk';
  selectedStudentIds: string[]; // demo ids
  csvPreview: Array<{ id?: string; name?: string; email?: string }>;
  // Certificate date range
  certificateStartDate: string | null; // optional start date
  certificateEndDate: string | null; // required end date (certificate issue date)
  // Edit mode
  editingCertificateId?: string | null; // If set, we're editing an existing certificate
};

export const DRAFT_STORAGE_KEY = "cert_create_draft_v2"; // Updated version for new fields

const defaultDraft: DraftState = {
  template: 'classic',
  trainingId: null,
  trainingName: null,
  trainingHours: null,
  trainingLevel: null,
  trainingLanguage: null,
  partners: [],
  referencePartnerPublicIds: [],
  upperInstitutionRequired: false,
  upperInstitutionPartnerId: null,
  studentMethod: 'single',
  selectedStudentIds: [],
  csvPreview: [],
  certificateStartDate: null,
  certificateEndDate: null,
  editingCertificateId: null,
};

export function useDraft() {
  const [draft, setDraft] = useState<DraftState>(defaultDraft);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setDraft({ ...defaultDraft, ...parsed });
      }
    } catch { }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch { }
  }, [draft, ready]);

  return {
    draft,
    setDraft,
    ready,
    reset: () => setDraft(defaultDraft),
  } as const;
}
