'use client';

import React from 'react';
import { CertificateData, CertificateTemplateType } from '@/types/certificate';
import { ClassicTemplate } from './ClassicTemplate';
import { ModernTemplate } from './ModernTemplate';
import { CreativeTemplate } from './CreativeTemplate';
import { ElegantTemplate } from './ElegantTemplate';
import { ProfessionalTemplate } from './ProfessionalTemplate';
import { ExecutiveTemplate } from './ExecutiveTemplate';
import { MinimalTemplate } from './MinimalTemplate';

interface CertificateRendererProps {
  data: CertificateData;
  scale?: number;
  isPdf?: boolean;
}

export const CertificateRenderer: React.FC<CertificateRendererProps> = ({ data, scale = 1, isPdf = false }) => {
  const renderTemplate = () => {
    switch (data.templateKey) {
      case 'classic':
        return <ClassicTemplate data={data} scale={scale} isPdf={isPdf} />;
      case 'modern':
        return <ModernTemplate data={data} scale={scale} isPdf={isPdf} />;
      case 'creative':
        return <CreativeTemplate data={data} scale={scale} isPdf={isPdf} />;
      case 'elegant':
        return <ElegantTemplate data={data} scale={scale} isPdf={isPdf} />;
      case 'professional':
        return <ProfessionalTemplate data={data} scale={scale} isPdf={isPdf} />;
      case 'executive':
        return <ExecutiveTemplate data={data} scale={scale} isPdf={isPdf} />;
      case 'minimal':
        return <MinimalTemplate data={data} scale={scale} isPdf={isPdf} />;
      default:
        return <ClassicTemplate data={data} scale={scale} isPdf={isPdf} />;
    }
  };

  return <>{renderTemplate()}</>;
};
