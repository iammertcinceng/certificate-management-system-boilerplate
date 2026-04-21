"use client";

import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export default function Input({ label, error, className = "", ...props }: Props) {
  return (
    <label className="block w-full">
      {label && <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>}
      <input
        {...props}
        className={
          `w-full px-3 py-2 rounded-lg border bg-white text-gray-900 placeholder:text-gray-400 ` +
          `focus:outline-none focus:ring-2 focus:ring-[#0945A5]/30 focus:border-[#0945A5] ` +
          `disabled:opacity-60 disabled:cursor-not-allowed ` +
          (error ? 'border-red-300' : 'border-gray-300') +
          (className ? ` ${className}` : '')
        }
      />
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
