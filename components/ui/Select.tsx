"use client";

import React from "react";

type Option = { value: string; label: string };

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  options?: Option[];
};

export default function Select({ label, error, className = "", options, children, ...props }: Props) {
  return (
    <label className="block w-full">
      {label && <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>}
      <div className="relative">
        <select
          {...props}
          className={
            `w-full appearance-none px-3 py-2 rounded-lg border bg-white text-gray-900 pr-9 ` +
            `focus:outline-none focus:ring-2 focus:ring-[#0945A5]/30 focus:border-[#0945A5] ` +
            `disabled:opacity-60 disabled:cursor-not-allowed ` +
            (error ? 'border-red-300' : 'border-gray-300') +
            (className ? ` ${className}` : '')
          }
        >
          {options ? options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          )) : children}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd"/></svg>
        </span>
      </div>
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
