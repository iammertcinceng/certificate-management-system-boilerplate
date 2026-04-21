"use client";

import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export default function Radio({ label, error, className = "", ...props }: Props) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <input
        {...props}
        type="radio"
        className={
          `w-4 h-4 text-[#0945A5] focus:ring-[#0945A5]/30 focus:ring-2 ` +
          (className ? ` ${className}` : '')
        }
      />
      {label && <span className="text-sm text-gray-700">{label}</span>}
      {error && <span className="ml-2 text-xs text-red-600">{error}</span>}
    </label>
  );
}
