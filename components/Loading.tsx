"use client";
import Loader from "@/components/ui/Loader";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Loading({ label, fullScreen }: { label?: string; fullScreen?: boolean }) {
  const { t } = useLanguage();
  return <Loader label={label || t('common.loading')} fullScreen={fullScreen} />;
}
