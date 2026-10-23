import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

interface BrochureUploadProps {
  onFileSelected: (file: File) => void;
  isProcessing: boolean;
  statusText?: string;
}

export const BrochureUpload: React.FC<BrochureUploadProps> = ({
  onFileSelected,
  isProcessing,
  statusText,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  const maxSizeBytes = 10 * 1024 * 1024; // 10MB limit per lmd-security

  const validateAndProcess = (file: File) => {
    setError(null);
    if (!allowedTypes.includes(file.type)) {
      setError('Unsupported file type. Please upload a PDF, JPEG, or PNG brochure.');
      return;
    }
    if (file.size > maxSizeBytes) {
      setError('File is too large. Maximum supported brochure size is 10 MB.');
      return;
    }

    setSelectedFileName(file.name);
    onFileSelected(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcess(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndProcess(e.target.files[0]);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-surface-border p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-ink flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            AI Brochure Digitizer
          </h3>
          <p className="text-xs text-ink-muted">
            Upload your paper leaflet or PDF circular. Deals are extracted into an editable review table.
          </p>
        </div>
        <span className="text-[11px] font-semibold text-ink-muted bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          Max 10 MB • PDF / JPG / PNG
        </span>
      </div>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-slate-300 hover:border-primary/60 bg-surface/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleChange}
          className="hidden"
          disabled={isProcessing}
        />

        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-xs border border-surface-border text-primary">
          {isProcessing ? (
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : selectedFileName ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          ) : (
            <Upload className="w-6 h-6 text-slate-500" />
          )}
        </div>

        {isProcessing ? (
          <div>
            <p className="text-sm font-bold text-ink">
              {statusText || 'Analyzing brochure with AI Vision...'}
            </p>
            <p className="text-xs text-ink-muted mt-1">
              Extracting product SKUs, MRPs, deal prices, and validity dates.
            </p>
          </div>
        ) : selectedFileName ? (
          <div>
            <p className="text-sm font-bold text-emerald-700 flex items-center justify-center gap-1.5">
              <FileText className="w-4 h-4" />
              {selectedFileName}
            </p>
            <p className="text-xs text-ink-muted mt-1">
              Click or drag to replace with another flyer.
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-semibold text-ink">
              Drag and drop your store leaflet here, or{' '}
              <span className="text-primary underline">browse files</span>
            </p>
            <p className="text-xs text-ink-muted mt-1">
              LuLu, Bismi, Reliance, or local supermarket weekly promotions supported.
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
