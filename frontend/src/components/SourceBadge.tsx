import React from 'react';
import { SourceType, VerificationStatus } from '../types';
import { CheckCircle2, FileText, Globe, Sparkles } from 'lucide-react';

interface SourceBadgeProps {
  sourceType: SourceType;
  verificationStatus: VerificationStatus;
  className?: string;
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({
  sourceType,
  verificationStatus,
  className = '',
}) => {
  if (sourceType === 'external_serp') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300 ${className}`}
      >
        <Globe className="w-3 h-3 text-slate-500" />
        External Web Result
      </span>
    );
  }

  if (sourceType === 'brochure') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 ${className}`}
      >
        <FileText className="w-3 h-3 text-purple-600" />
        {verificationStatus === 'demo' ? 'Demo · Brochure Extracted' : 'Brochure Extracted'}
      </span>
    );
  }

  if (verificationStatus === 'verified' && sourceType === 'retailer') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 ${className}`}
      >
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        Retailer Verified
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 ${className}`}
    >
      <Sparkles className="w-3 h-3 text-amber-600" />
      Demo Data
    </span>
  );
};
