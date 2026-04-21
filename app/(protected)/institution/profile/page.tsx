"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Institution } from '@/types/institution';
import FirmProfile from '@/components/FirmProfile';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/contexts/LanguageContext';
import Loader from '@/components/ui/Loader';

export default function ProfilePage() {
  const { t } = useLanguage();
  const { data: session, status } = useSession();
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch organization from DB
  useEffect(() => {
    if (status === 'authenticated') {
      fetchOrganization();
    }
  }, [status]);

  const fetchOrganization = async () => {
    try {
      const res = await fetch('/api/organization');
      if (res.ok) {
        const data = await res.json();
        const org = data.organization;
        // Map DB fields to Institution type
        const mappedInstitution: Institution = {
          id: org.publicId || 'unknown',
          slug: org.slug || '',
          name: org.name || '',
          vatNumber: org.taxNumber || '',
          taxOffice: org.taxOffice || '',
          loginEmail: session?.user?.email || '', // users.email - giriş için (sadece profile modunda gösterilir)
          email: org.infoEmail || '', // organizations.infoEmail - iletişim için (her yerde gösterilir)
          phone: org.phone || '',
          website: org.website || '',
          address: org.address || '',
          about: org.about || '',
          mission: org.mission || '',
          vision: org.vision || '',
          socialMedia: {
            linkedin: org.socialLinkedin || '',
            twitter: org.socialTwitter || '',
            facebook: org.socialFacebook || '',
            instagram: org.socialInstagram || '',
          },
          advantages: org.advantages || [],
          isPartner: org.isPartner || false,
          signatureName: org.signatureName || '',
          signatureTitle: org.signatureTitle || '',
        };

        setInstitution(mappedInstitution);

        // Load logo and signature from the organization data
        setLogoDataUrl(org.logo || null);
        setSignatureDataUrl(org.signature || null);
      }
    } catch (err) {
      console.error('Failed to fetch organization', err);
    } finally {
      setLoading(false);
    }
  };

  // This useEffect is no longer needed as we are not persisting to localStorage.

  const handleSave = async (updatedInstitution: Institution) => {
    try {
      const res = await fetch('/api/organization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updatedInstitution.name,
          taxNumber: updatedInstitution.vatNumber,
          taxOffice: updatedInstitution.taxOffice,
          infoEmail: updatedInstitution.email, // organizations.infoEmail - iletişim email'i
          // loginEmail (users.email) güncellenmez - sadece okunur
          phone: updatedInstitution.phone,
          website: updatedInstitution.website,
          address: updatedInstitution.address,
          about: updatedInstitution.about,
          mission: updatedInstitution.mission,
          vision: updatedInstitution.vision,
          socialLinkedin: updatedInstitution.socialMedia?.linkedin,
          socialTwitter: updatedInstitution.socialMedia?.twitter,
          socialFacebook: updatedInstitution.socialMedia?.facebook,
          socialInstagram: updatedInstitution.socialMedia?.instagram,
          isPartner: updatedInstitution.isPartner,
          advantages: updatedInstitution.advantages || [],
          logo: logoDataUrl, // Send the base64 string
          signature: signatureDataUrl, // Send the signature base64 string
          signatureName: updatedInstitution.signatureName || '',
          signatureTitle: updatedInstitution.signatureTitle || '',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(t('institution.profile.messages.updateSuccess'));
        fetchOrganization(); // Refresh
      } else {
        alert(t('institution.profile.messages.updateError'));
      }
    } catch (err) {
      console.error('Failed to save organization', err);
      alert(t('common.serverError'));
    }
  };

  const handleLogoChange = (newLogoDataUrl: string | null) => {
    setLogoDataUrl(newLogoDataUrl);
    // Auto-save with the new logo value (don't rely on stale state)
    if (institution) {
      handleSaveWithMedia(institution, newLogoDataUrl, signatureDataUrl);
    }
  };

  const handleSignatureChange = (newSignatureDataUrl: string | null) => {
    setSignatureDataUrl(newSignatureDataUrl);
    // Auto-save with the new signature value (don't rely on stale state)
    if (institution) {
      handleSaveWithMedia(institution, logoDataUrl, newSignatureDataUrl);
    }
  };

  // Helper function that takes explicit media values (used for auto-save)
  const handleSaveWithMedia = async (updatedInstitution: Institution, logo: string | null, signature: string | null) => {
    try {
      const res = await fetch('/api/organization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updatedInstitution.name,
          taxNumber: updatedInstitution.vatNumber,
          taxOffice: updatedInstitution.taxOffice,
          infoEmail: updatedInstitution.email,
          phone: updatedInstitution.phone,
          website: updatedInstitution.website,
          address: updatedInstitution.address,
          about: updatedInstitution.about,
          mission: updatedInstitution.mission,
          vision: updatedInstitution.vision,
          socialLinkedin: updatedInstitution.socialMedia?.linkedin,
          socialTwitter: updatedInstitution.socialMedia?.twitter,
          socialFacebook: updatedInstitution.socialMedia?.facebook,
          socialInstagram: updatedInstitution.socialMedia?.instagram,
          isPartner: updatedInstitution.isPartner,
          advantages: updatedInstitution.advantages || [],
          logo: logo,
          signature: signature,
          signatureName: updatedInstitution.signatureName || '',
          signatureTitle: updatedInstitution.signatureTitle || '',
        }),
      });
      if (res.ok) {
        alert(t('institution.profile.messages.updateSuccess'));
        // Don't fetchOrganization here - we already have the correct state
      } else {
        alert(t('institution.profile.messages.updateError'));
      }
    } catch (err) {
      console.error('Failed to save organization', err);
      alert(t('common.serverError'));
    }
  };

  if (status === 'loading' || !institution) {
    return (
      <Loader />
    );
  }

  return (
    <div className="p-6 space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">{t('institution.profile.title')}</h1>
          <p className="text-gray-600">{t('institution.profile.subtitle')}</p>
        </div>
      </div>

      <FirmProfile
        entity={institution}
        role="institution"
        mode="profile"
        onSave={handleSave}
        onLogoChange={handleLogoChange}
        logoDataUrl={logoDataUrl}
        onSignatureChange={handleSignatureChange}
        signatureDataUrl={signatureDataUrl}
      />
    </div>
  );
}
