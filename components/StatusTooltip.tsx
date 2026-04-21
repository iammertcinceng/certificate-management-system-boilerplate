"use client";
import { useState } from 'react';

interface StatusTooltipProps {
  children: React.ReactNode;
  content: string;
}

export default function StatusTooltip({ children, content }: StatusTooltipProps) {
  const [show, setShow] = useState(false);

  if (!content) return <>{children}</>;

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {children}
      </div>
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap animate-in fade-in duration-150">
          {content}
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px]">
            <div className="border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
}
