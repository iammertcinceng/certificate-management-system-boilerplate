"use client";

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import React from 'react';
import Checkbox from '@/components/ui/Checkbox';
import type { Institution } from '../types/institution';
import { useLanguage } from '@/contexts/LanguageContext';

export type FirmRole = 'institution' | 'partner';
export type ProfileMode = 'profile' | 'listing';

interface FirmProfileProps {
  entity: Institution; // existing shape reused
  role: FirmRole; // explicit role: institution or partner
  mode?: ProfileMode;
  onSave?: (entity: Institution) => void;
  onLogoChange?: (logoDataUrl: string | null) => void;
  logoDataUrl?: string | null;
  onSignatureChange?: (signatureDataUrl: string | null) => void;
  signatureDataUrl?: string | null;
}

export default function FirmProfile({
  entity,
  role,
  mode = 'listing',
  onSave,
  onLogoChange,
  logoDataUrl,
  onSignatureChange,
  signatureDataUrl
}: FirmProfileProps) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const signatureInputRef = useRef<HTMLInputElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Institution>(entity);
  const [signatureError, setSignatureError] = useState<string | null>(null);

  const isEditable = mode === 'profile';
  const showActions = mode === 'profile';
  const showPartnerToggle = mode === 'profile' && role === 'institution';

  useEffect(() => setFormData(entity), [entity]);

  const handleSave = () => {
    onSave?.(formData);
    setIsEditing(false);
  };
  const handleCancel = () => {
    setFormData(entity);
    setIsEditing(false);
  };

  const onPickLogo = () => inputRef.current?.click();
  const onFile = (file?: File) => {
    if (!file || !onLogoChange) return;
    const reader = new FileReader();
    reader.onload = () => {
      onLogoChange(String(reader.result || ''));
    };
    reader.readAsDataURL(file);
  };

  // Signature upload handler with validation
  const onPickSignature = () => signatureInputRef.current?.click();
  const onSignatureFile = (file?: File) => {
    if (!file || !onSignatureChange) return;
    setSignatureError(null);

    // Validate file type - only PNG allowed
    if (file.type !== 'image/png') {
      setSignatureError(t('institution.profile.signature.errors.formatError'));
      return;
    }

    // Validate file size - max 100KB
    if (file.size > 100 * 1024) {
      setSignatureError(t('institution.profile.signature.errors.sizeError'));
      return;
    }

    // Validate image dimensions
    const img = new window.Image();
    img.onload = () => {
      if (img.width > 400 || img.height > 200) {
        setSignatureError(t('institution.profile.signature.errors.dimensionsError'));
        return;
      }
      // All validations passed, read the file
      const reader = new FileReader();
      reader.onload = () => {
        onSignatureChange(String(reader.result || ''));
      };
      reader.readAsDataURL(file);
    };
    img.onerror = () => {
      setSignatureError(t('institution.profile.signature.errors.invalidImage'));
    };
    img.src = URL.createObjectURL(file);
  };

  const updateField = (field: keyof Institution, value: any) => setFormData(prev => ({ ...prev, [field]: value }));
  const updateSocialMedia = (platform: keyof NonNullable<Institution['socialMedia']>, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialMedia: { ...prev.socialMedia, [platform]: value }
    }));
  };
  const updateAdvantages = (advantages: string[]) => setFormData(prev => ({ ...prev, advantages }));

  const inputClassName = `w-full px-3 py-2 rounded-lg transition-all ${isEditing ? 'border border-blue-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 bg-white shadow-sm' : 'border-0 bg-transparent focus:outline-none'
    }`;
  const textareaClassName = `w-full px-3 py-2 rounded-lg transition-all resize-none ${isEditing ? 'border border-blue-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 bg-white shadow-sm' : 'border-0 bg-transparent focus:outline-none'
    }`;

  const badgeText = role === 'institution' ? t('institution.profile.badge.institution') : t('institution.profile.badge.partner');
  const nameLabel = role === 'institution' ? t('institution.profile.details.nameInstitution') : t('institution.profile.details.namePartner');

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {onLogoChange ? (
            <div className="relative">
              <button
                type="button"
                onClick={onPickLogo}
                title={t('institution.profile.logo.uploadTitle')}
                className="w-24 h-24 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-[#0945A5] focus:outline-none focus:ring-2 focus:ring-[#0945A5]"
              >
                {logoDataUrl ? (
                  <Image src={logoDataUrl} alt="Logo" width={96} height={96} className="w-full h-full object-cover" unoptimized />
                ) : (
                  <span className="text-3xl text-gray-400">🏷️</span>
                )}
              </button>
              <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] || undefined)} />
              <div className="mt-3 text-xs text-gray-500">
                {t('institution.profile.logo.hint')} {logoDataUrl && (
                  <button onClick={() => onLogoChange(null)} className="ml-2 text-rose-600 hover:underline">{t('institution.profile.logo.remove')}</button>
                )}
              </div>
            </div>
          ) : (
            <div className="w-24 h-24 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
              {logoDataUrl ? (
                <Image src={logoDataUrl} alt="Logo" width={96} height={96} className="w-full h-full object-cover" unoptimized />
              ) : (
                <span className="text-3xl text-gray-400">🏢</span>
              )}
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="text-xl font-semibold text-gray-900">{formData.name} <span className="text-sm font-medium text-gray-500">({badgeText})</span></div>
              {formData.id && (
                <span className="px-2 py-0.5 text-xs font-mono rounded-md border border-gray-200 bg-gray-50 text-gray-600">
                  {formData.id}
                </span>
              )}
            </div>

            {mode === 'profile' && (
              <div className="text-gray-500 mt-1">
                <div>{t('institution.profile.details.vatNumber')}: {formData.vatNumber}</div>
                <div>{t('institution.profile.details.taxOffice')}: {formData.taxOffice}</div>
              </div>
            )}

            {/* public id basalım ki partner olanlar için id paylaşılabilsin. */}

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-600">
              {formData.email && (
                <>
                  <a className="hover:underline" href={`mailto:${formData.email}`}>{formData.email}</a>
                  <span>•</span>
                </>
              )}
              <a className="hover:underline" href={`tel:${formData.phone}`}>{formData.phone}</a>
              {formData.website && (
                <>
                  <span>•</span>
                  <a className="text-[#0945A5] hover:underline" href={formData.website} target="_blank">{t('institution.profile.details.website')}</a>
                </>
              )}
            </div>
          </div>

          {showActions && isEditable && (
            <div className="flex flex-col items-end gap-2">
              {isEditing ? (
                <>
                  {showPartnerToggle && (
                    <div className="mb-2">
                      <Checkbox
                        checked={!!formData.isPartner}
                        onChange={(e) => updateField('isPartner', (e.target as HTMLInputElement).checked)}
                        label={t('institution.profile.partnerToggle')}
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={handleCancel} className="btn-secondary text-sm">{t('institution.profile.cancel')}</button>
                    <button onClick={handleSave} className="btn-primary text-sm">{t('institution.profile.save')}</button>
                  </div>
                </>
              ) : (
                <button onClick={() => setIsEditing(true)} className="btn-secondary text-sm">{t('institution.profile.edit')}</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Login Credentials - Only in profile mode */}
      {mode === 'profile' && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('institution.profile.loginCredentials.title')}</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-3">{t('institution.profile.loginCredentials.description')}</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('institution.profile.loginCredentials.label')}</label>
              <input
                type="email"
                value={formData.loginEmail}
                className="w-full px-3 py-2 rounded-lg border-0 bg-gray-100 text-gray-500 cursor-not-allowed"
                readOnly
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">{t('institution.profile.loginCredentials.note')}</p>
            </div>
          </div>
        </section>
      )}

      {/* Details */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{role === 'institution' ? t('institution.profile.details.institutionTitle') : t('institution.profile.details.partnerTitle')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1">{nameLabel}</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              className={inputClassName}
              readOnly={!isEditing}
            />
          </div>

          {mode === 'profile' && (
            <div>
              <label className="block text-sm text-gray-500 mb-1">{t('institution.profile.details.vatNumber')}</label>
              <input
                type="text"
                value={formData.vatNumber}
                onChange={(e) => updateField('vatNumber', e.target.value)}
                className={inputClassName}
                readOnly={!isEditing}
              />
            </div>
          )}

          {mode === 'profile' && (
            <div>
              <label className="block text-sm text-gray-500 mb-1">{t('institution.profile.details.taxOffice')}</label>
              <input
                type="text"
                value={formData.taxOffice}
                onChange={(e) => updateField('taxOffice', e.target.value)}
                className={inputClassName}
                readOnly={!isEditing}
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-500 mb-1">{t('institution.profile.details.contactEmail')}</label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => updateField('email', e.target.value)}
              className={inputClassName}
              placeholder={t('institution.profile.details.contactEmailPlaceholder')}
              readOnly={!isEditing}
            />
            {isEditing && (
              <p className="text-xs text-gray-500 mt-1">{t('institution.profile.details.contactEmailNote')}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">{t('institution.profile.details.phone')}</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              className={inputClassName}
              readOnly={!isEditing}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">{t('institution.profile.details.website')}</label>
            <input
              type="url"
              value={formData.website || ''}
              onChange={(e) => updateField('website', e.target.value)}
              className={inputClassName}
              placeholder="https://..."
              readOnly={!isEditing}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-500 mb-1">{t('institution.profile.details.address')}</label>
            <textarea
              value={formData.address || ''}
              onChange={(e) => updateField('address', e.target.value)}
              rows={2}
              className={textareaClassName}
              placeholder={t('institution.profile.details.addressPlaceholder')}
              readOnly={!isEditing}
            />
          </div>
        </div>
      </section>

      {(formData.about || isEditing) && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('institution.profile.about.title')}</h2>
          <textarea
            value={formData.about || ''}
            onChange={(e) => updateField('about', e.target.value)}
            rows={4}
            className={textareaClassName}
            placeholder={t('institution.profile.about.placeholder')}
            readOnly={!isEditing}
          />
        </section>
      )}

      {((formData.mission || formData.vision) || isEditing) && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('institution.profile.missionVision.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">{t('institution.profile.missionVision.mission')}</h3>
              <textarea
                value={formData.mission || ''}
                onChange={(e) => updateField('mission', e.target.value)}
                rows={3}
                className={textareaClassName}
                placeholder={t('institution.profile.missionVision.missionPlaceholder')}
                readOnly={!isEditing}
              />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">{t('institution.profile.missionVision.vision')}</h3>
              <textarea
                value={formData.vision || ''}
                onChange={(e) => updateField('vision', e.target.value)}
                rows={3}
                className={textareaClassName}
                placeholder={t('institution.profile.missionVision.visionPlaceholder')}
                readOnly={!isEditing}
              />
            </div>
          </div>
        </section>
      )}

      {((formData.socialMedia && Object.values(formData.socialMedia).some(link => link)) || isEditing) && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('institution.profile.socialMedia.title')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">LinkedIn</label>
              <input type="url" value={formData.socialMedia?.linkedin || ''} onChange={(e) => updateSocialMedia('linkedin', e.target.value)} className={inputClassName} placeholder="https://linkedin.com/company/..." readOnly={!isEditing} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Twitter</label>
              <input type="url" value={formData.socialMedia?.twitter || ''} onChange={(e) => updateSocialMedia('twitter', e.target.value)} className={inputClassName} placeholder="https://twitter.com/..." readOnly={!isEditing} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Facebook</label>
              <input type="url" value={formData.socialMedia?.facebook || ''} onChange={(e) => updateSocialMedia('facebook', e.target.value)} className={inputClassName} placeholder="https://facebook.com/..." readOnly={!isEditing} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Instagram</label>
              <input type="url" value={formData.socialMedia?.instagram || ''} onChange={(e) => updateSocialMedia('instagram', e.target.value)} className={inputClassName} placeholder="https://instagram.com/..." readOnly={!isEditing} />
            </div>
          </div>
        </section>
      )}

      {/* Signature Upload Section - Only in profile mode */}
      {mode === 'profile' && onSignatureChange && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('institution.profile.signature.title')}</h2>
          <p className="text-sm text-gray-600 mb-4">
            {t('institution.profile.signature.description')}
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload Area */}
            <div>
              <label className="block text-sm text-gray-500 mb-2">{t('institution.profile.signature.imageLabel')}</label>
              <button
                type="button"
                onClick={onPickSignature}
                className="w-full h-24 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                {signatureDataUrl ? (
                  <img
                    src={signatureDataUrl}
                    alt="İmza"
                    className="max-w-full max-h-full object-contain p-2"
                  />
                ) : (
                  <>
                    <svg className="w-8 h-8 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <span className="text-xs text-gray-500">{t('institution.profile.signature.uploadText')}</span>
                  </>
                )}
              </button>
              <input
                ref={signatureInputRef}
                type="file"
                accept="image/png"
                className="hidden"
                onChange={(e) => onSignatureFile(e.target.files?.[0])}
              />

              {signatureDataUrl && (
                <button
                  onClick={() => { onSignatureChange(null); setSignatureError(null); }}
                  className="mt-2 text-xs text-rose-600 hover:underline"
                >
                  {t('institution.profile.signature.removeText')}
                </button>
              )}

              {signatureError && (
                <p className="mt-2 text-xs text-red-600">{signatureError}</p>
              )}
            </div>

            {/* Name & Title Inputs */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">{t('institution.profile.signature.nameLabel')}</label>
                <input
                  type="text"
                  value={formData.signatureName || ''}
                  onChange={(e) => updateField('signatureName', e.target.value)}
                  className={inputClassName}
                  placeholder={t('institution.profile.signature.namePlaceholder')}
                  readOnly={!isEditing}
                />
                <p className="text-xs text-gray-400 mt-1">{t('institution.profile.signature.nameNote')}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">{t('institution.profile.signature.titleLabel')}</label>
                <input
                  type="text"
                  value={formData.signatureTitle || ''}
                  onChange={(e) => updateField('signatureTitle', e.target.value)}
                  className={inputClassName}
                  placeholder={t('institution.profile.signature.titlePlaceholder')}
                  readOnly={!isEditing}
                />
                <p className="text-xs text-gray-400 mt-1">{t('institution.profile.signature.titleNote')}</p>
              </div>
            </div>

            {/* Preview */}
            <div>
              <label className="block text-sm text-gray-500 mb-2">{t('institution.profile.signature.previewLabel')}</label>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4">
                <div className="flex flex-col items-center">
                  {signatureDataUrl ? (
                    <img
                      src={signatureDataUrl}
                      alt="Signature Preview"
                      className="h-12 object-contain mb-2"
                    />
                  ) : (
                    <div className="h-12 flex items-center justify-center text-gray-300 italic text-sm mb-2">
                      {t('institution.profile.signature.previewNoSignature')}
                    </div>
                  )}
                  <div className="w-32 h-px bg-gray-400 mb-1"></div>
                  <p className="text-xs font-semibold text-gray-800">
                    {formData.signatureName || formData.name}
                  </p>
                  {formData.signatureTitle && (
                    <p className="text-[10px] text-gray-500">{formData.signatureTitle}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Requirements Note */}
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-amber-800 mb-1">{t('institution.profile.signature.requirements.title')}</h4>
            <p className="text-xs text-amber-700">
              {t('institution.profile.signature.requirements.text')}
            </p>
          </div>
        </section>
      )}


      {((formData.advantages && formData.advantages.length > 0) || isEditing) && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('institution.profile.advantages.title')}</h2>
          {isEditing ? (
            <AdvantagesEditor advantages={formData.advantages || []} onChange={updateAdvantages} />
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {formData.advantages?.map((advantage, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-2 h-2 bg-[#0945A5] rounded-full flex-shrink-0"></span>
                  {advantage}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function AdvantagesEditor({ advantages, onChange }: { advantages: string[]; onChange: (advantages: string[]) => void }) {
  const { t } = useLanguage();
  const [newAdvantage, setNewAdvantage] = useState('');
  const addAdvantage = () => { if (newAdvantage.trim()) { onChange([...advantages, newAdvantage.trim()]); setNewAdvantage(''); } };
  const removeAdvantage = (index: number) => onChange(advantages.filter((_, i) => i !== index));
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={newAdvantage}
          onChange={(e) => setNewAdvantage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAdvantage())}
          className="input flex-1 border-2 border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          placeholder={t('institution.profile.advantages.placeholder')}
        />
        <button type="button" onClick={addAdvantage} className="btn-primary px-4">{t('institution.profile.advantages.add')}</button>
      </div>
      {advantages.length > 0 && (
        <div className="space-y-2">
          {advantages.map((advantage, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <span className="flex-1 text-sm">{advantage}</span>
              <button type="button" onClick={() => removeAdvantage(index)} className="text-red-500 hover:text-red-700 text-sm">{t('institution.profile.advantages.remove')}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
