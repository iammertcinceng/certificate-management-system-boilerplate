"use client";

import React from "react";

export default function Loader({ label, fullScreen = false }: { label?: string, fullScreen?: boolean }) {
  const content = (
    <div className="flex flex-col items-center relative">
      <div className="relative mb-6">
        {/* Arkaplan Glow Efekti */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-blue-400/10 rounded-full blur-2xl animate-pulse"></div>

        {/* Logo Container */}
        <div className="relative z-10 p-4 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          {/* Logo - not: Image src projenin logosuna göre ayarlanmalı */}
          <img
            src="/mertcin-anonym-logo.png"
            alt="Loading"
            className="w-10 h-10 object-contain animate-[pulse_3s_ease-in-out_infinite]"
          />
        </div>

        {/* Dönen İnce Halka (Opsiyonel - çok hafif) */}
        <div className="absolute inset-0 -m-1 border border-blue-100 rounded-[1.2rem] animate-[spin_4s_linear_infinite] opacity-50" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }}></div>
      </div>

      {/* Text ve Bar */}
      <div className="flex flex-col items-center gap-3">
        {label && <span className="text-xs font-semibold text-gray-400 tracking-[0.2em] uppercase">{label}</span>}
        {/* Minimal Progress Bar */}
        <div className="w-16 h-0.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="w-full h-full bg-gradient-to-r from-transparent via-[#0945A5] to-transparent animate-[shimmer_1.5s_infinite] -translate-x-full"></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--background)] transition-all duration-500">
        {content}
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[200px] flex items-center justify-center py-8">
      {content}
    </div>
  );
}
