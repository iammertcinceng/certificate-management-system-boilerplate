"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Institution } from '@/types/institution';
import { slugify } from '@/utils/slug';
import FirmProfile from '@/components/FirmProfile';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/contexts/LanguageContext';
import Loader from '@/components/ui/Loader';

export default function ProfilePage() {
  const { t } = useLanguage();
  const { data: session, status } = useSession();
  const [inst, setInst] = useState<Institution | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchOrg();
    }
  }, [status]);

  const fetchOrg = async () => {
    try {
      const res = await fetch('/api/organization', { cache: 'no-store' });
      if (!res.ok) throw new Error('org fetch failed');
      const data = await res.json();
      const org = data.organization as {
        publicId: string;
        slug: string;
        name: string;
        taxNumber?: string;
        taxOffice?: string;
        infoEmail?: string;
        phone?: string;
        website?: string;
        address?: string;
        about?: string;
        mission?: string;
        vision?: string;
        socialLinkedin?: string;
        socialTwitter?: string;
        socialFacebook?: string;
        socialInstagram?: string;
        advantages?: string[] | null;
        isPartner?: boolean;
        logo?: string | null;
        signature?: string | null;
        signatureName?: string;
        signatureTitle?: string;
      };

      const mapped: Institution = {
        id: org.publicId || 'PRT-UNKNOWN',
        slug: org.slug || slugify(org.name || 'partner'),
        name: org.name || 'Partner',
        vatNumber: org.taxNumber || '',
        taxOffice: org.taxOffice || '',
        loginEmail: session?.user?.email || '',
        email: org.infoEmail || '',
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
        isPartner: true,
        signatureName: org.signatureName || '',
        signatureTitle: org.signatureTitle || '',
      };
      setInst(mapped);
      setLogo(org.logo || null);
      setSignature(org.signature || null);
    } catch {
      setInst({
        id: 'PRT-000000',
        slug: 'partner',
        name: 'Partner Firma',
        vatNumber: '',
        taxOffice: '',
        loginEmail: session?.user?.email || '',
        email: '',
        phone: '',
        isPartner: true,
      } as Institution);
      setLogo(null);
      setSignature(null);
    }
  };

  const onSave = async (next: Institution) => {
    setInst(next);
    try {
      const res = await fetch('/api/organization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: next.name,
          taxNumber: next.vatNumber,
          taxOffice: next.taxOffice,
          infoEmail: next.email,
          phone: next.phone,
          website: next.website,
          address: next.address,
          about: next.about,
          mission: next.mission,
          vision: next.vision,
          socialLinkedin: next.socialMedia?.linkedin,
          socialTwitter: next.socialMedia?.twitter,
          socialFacebook: next.socialMedia?.facebook,
          socialInstagram: next.socialMedia?.instagram,
          isPartner: true,
          advantages: next.advantages || [],
          logo: logo,
          signature: signature,
          signatureName: next.signatureName || '',
          signatureTitle: next.signatureTitle || '',
        })
      });
      if (res.ok) {
        alert(t('acreditor.profile.messages.updateSuccess'));
      } else {
        alert(t('acreditor.profile.messages.updateError'));
      }
    } catch {
      alert(t('common.serverError'));
    }
  };

  const handleLogoChange = (newLogo: string | null) => {
    setLogo(newLogo);
    if (inst) {
      handleSaveWithMedia(inst, newLogo, signature);
    }
  };

  const handleSignatureChange = (newSignature: string | null) => {
    setSignature(newSignature);
    if (inst) {
      handleSaveWithMedia(inst, logo, newSignature);
    }
  };

  const handleSaveWithMedia = async (entity: Institution, logoData: string | null, signatureData: string | null) => {
    try {
      const res = await fetch('/api/organization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: entity.name,
          taxNumber: entity.vatNumber,
          taxOffice: entity.taxOffice,
          infoEmail: entity.email,
          phone: entity.phone,
          website: entity.website,
          address: entity.address,
          about: entity.about,
          mission: entity.mission,
          vision: entity.vision,
          socialLinkedin: entity.socialMedia?.linkedin,
          socialTwitter: entity.socialMedia?.twitter,
          socialFacebook: entity.socialMedia?.facebook,
          socialInstagram: entity.socialMedia?.instagram,
          isPartner: true,
          advantages: entity.advantages || [],
          logo: logoData,
          signature: signatureData,
          signatureName: entity.signatureName || '',
          signatureTitle: entity.signatureTitle || '',
        })
      });
      if (res.ok) {
        alert(t('acreditor.profile.messages.updateSuccess'));
      } else {
        alert(t('acreditor.profile.messages.updateError'));
      }
    } catch {
      alert(t('common.serverError'));
    }
  };

  if (status === 'loading' || !inst) {
    return (
      <Loader />
    );
  }

  return (
    <div>
      <Link href="/acreditor" className="text-sm text-dark-200 hover:text-primary-400 mb-4 inline-block">
        &larr; {t('nav.dashboard')}
      </Link>
      <h1 className="text-3xl font-bold gradient-text mb-6">{t('acreditor.profile.title')}</h1>
      <FirmProfile
        entity={inst}
        role="partner"
        mode="profile"
        onSave={onSave}
        onLogoChange={handleLogoChange}
        logoDataUrl={logo}
        onSignatureChange={handleSignatureChange}
        signatureDataUrl={signature}
      />
    </div>
  );
}
