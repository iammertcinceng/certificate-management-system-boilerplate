"use client";
import React, { useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export interface ActivityItemData {
  icon: string;
  text: string;
  time: string;
  ts: string; // ISO string to keep it serializable
}

export function Activities({ items }: { items: ActivityItemData[] }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const sorted = useMemo(() =>
    [...items].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
    , [items]);

  const top = sorted.slice(0, 6);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">{t('institution.home.activities.title')}</h2>
        <button onClick={() => setOpen(true)} className="text-blue-600 text-sm hover:underline">{t('institution.home.activities.viewAll')}</button>
      </div>
      <div className="p-6">
        <div className="-mx-3 divide-y divide-gray-200 max-h-64 overflow-auto">
          {top.map((act, i) => (
            <div key={i} className="flex items-start space-x-3 py-3 px-3">
              <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-lg">{act.icon}</span>
              </div>
              <div>
                <p className="text-sm text-gray-700">{act.text}</p>
                <p className="text-xs text-gray-500 mt-0.5">{act.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="text-lg font-semibold text-gray-800">{t('institution.home.activities.allTitle')}</h3>
                <button onClick={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" aria-label={t('common.close')}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <div className="-mx-3 divide-y divide-gray-200 max-h-[65vh] overflow-auto pr-2">
                  {sorted.map((act, i) => (
                    <div key={i} className="flex items-start space-x-3 py-3 px-3">
                      <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-lg">{act.icon}</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-700">{act.text}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{act.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
