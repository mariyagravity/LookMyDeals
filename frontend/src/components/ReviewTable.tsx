import React, { useState } from 'react';
import { BrochureProductCandidate, Category } from '../types';
import { Check, AlertTriangle, ShieldCheck, Edit2, Sparkles } from 'lucide-react';

interface ReviewTableProps {
  candidates: BrochureProductCandidate[];
  onUpdateCandidate: (updated: BrochureProductCandidate) => void;
  onApproveAndPublish: (approvedCandidates: BrochureProductCandidate[]) => void;
  canPublish: boolean;
  categories: Category[];
}

export const ReviewTable: React.FC<ReviewTableProps> = ({
  candidates,
  onUpdateCandidate,
  onApproveAndPublish,
  canPublish,
  categories,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (candidates.length === 0) {
    return null;
  }

  const approvedCount = candidates.filter((c) => c.status === 'approved').length;
  const draftCount = candidates.filter((c) => c.status === 'draft').length;

  const handleFieldChange = (
    candidate: BrochureProductCandidate,
    field: keyof BrochureProductCandidate,
    val: any
  ) => {
    const updated = {
      ...candidate,
      [field]: val,
    };
    if (updated.status === 'approved' && !isCandidatePublishable(updated)) {
      updated.status = 'draft';
    }
    onUpdateCandidate(updated);
  };

  const toggleApproval = (candidate: BrochureProductCandidate) => {
    if (candidate.status !== 'approved' && !isCandidatePublishable(candidate)) {
      alert('Add a product category and a valid price before approving this candidate.');
      return;
    }
    const nextStatus = candidate.status === 'approved' ? 'draft' : 'approved';
    onUpdateCandidate({
      ...candidate,
      status: nextStatus,
    });
  };

  const isCandidatePublishable = (candidate: BrochureProductCandidate) => {
    const hasPrice = [candidate.regularPrice, candidate.offerPrice]
      .some((price) => price !== null && Number.isFinite(price) && price > 0);
    const invalidOffer = candidate.regularPrice !== null && candidate.offerPrice !== null &&
      candidate.offerPrice > candidate.regularPrice;
    return Boolean(candidate.productName.trim() && candidate.category && hasPrice && !invalidOffer);
  };

  const handlePublishAll = () => {
    const toPublish = candidates.filter((c) => c.status === 'approved' && isCandidatePublishable(c));
    if (toPublish.length === 0) {
      alert('Please approve at least one candidate before publishing.');
      return;
    }
    onApproveAndPublish(toPublish);
  };

  return (
    <div className="bg-white rounded-xl border border-surface-border shadow-xs overflow-hidden">
      {/* Table Action Bar */}
      <div className="p-4 bg-surface border-b border-surface-border flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-ink flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-primary-strong" />
            Extracted Deal Candidates ({candidates.length})
          </h3>
          <p className="text-xs text-ink-muted">
            <strong className="text-emerald-700">{approvedCount} approved</strong>,{' '}
            <strong className="text-amber-700">{draftCount} drafts awaiting review</strong>. Unapproved items are kept strictly private.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              candidates.forEach((c) => {
                if (c.status === 'draft' && isCandidatePublishable(c)) toggleApproval(c);
              });
            }}
            className="touch-target px-3 py-1.5 text-xs font-semibold bg-white border border-surface-border hover:bg-slate-50 text-ink rounded-lg shadow-2xs"
          >
            Approve All
          </button>

          <button
            type="button"
            onClick={handlePublishAll}
            disabled={approvedCount === 0 || !canPublish}
            className={`touch-target px-4 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors ${
              approvedCount > 0 && canPublish
                ? 'bg-primary text-white hover:bg-primary-strong cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{canPublish ? `Publish ${approvedCount} Approved Deals` : 'Choose a store to publish'}</span>
          </button>
        </div>
      </div>

      {/* Review Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-ink-muted border-b border-surface-border font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Product Name & Brand</th>
              <th className="py-3 px-3">Pack Size</th>
              <th className="py-3 px-3">Category</th>
              <th className="py-3 px-3">Regular (₹)</th>
              <th className="py-3 px-3">Offer (₹)</th>
              <th className="py-3 px-3">Valid Until</th>
              <th className="py-3 px-3">Confidence</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {candidates.map((c) => {
              const isEditing = editingId === c.id;
              const hasPriceIssue =
                c.regularPrice === null ||
                c.offerPrice === null ||
                (c.regularPrice !== null && c.regularPrice <= 0) ||
                (c.offerPrice !== null && c.offerPrice <= 0) ||
                (c.regularPrice !== null && c.offerPrice !== null && c.offerPrice >= c.regularPrice);
              const isLowConfidence = c.confidence !== null && c.confidence < 0.7;

              return (
                <tr
                  key={c.id}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    c.status === 'approved' ? 'bg-emerald-50/30' : ''
                  } ${hasPriceIssue ? 'border-l-4 border-l-amber-400' : ''}`}
                >
                  {/* Status Badge */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {c.status === 'approved' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        <Check className="w-3 h-3" />
                        Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800">
                        Needs Review
                      </span>
                    )}
                  </td>

                  {/* Product & Brand */}
                  <td className="py-3 px-3 min-w-[200px]">
                    {isEditing ? (
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={c.productName}
                          onChange={(e) => handleFieldChange(c, 'productName', e.target.value)}
                          className="w-full px-2 py-1 border rounded text-xs"
                        />
                        <input
                          type="text"
                          value={c.brand || ''}
                          placeholder="Brand"
                          onChange={(e) => handleFieldChange(c, 'brand', e.target.value)}
                          className="w-full px-2 py-1 border rounded text-[11px]"
                        />
                      </div>
                    ) : (
                      <div>
                        <p className="font-bold text-ink leading-tight">{c.productName}</p>
                        <p className="text-[11px] text-ink-muted">Brand: {c.brand || 'Unspecified'}</p>
                      </div>
                    )}
                  </td>

                  {/* Pack Size */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {isEditing ? (
                      <input
                        type="text"
                        value={c.packSize || ''}
                        onChange={(e) => handleFieldChange(c, 'packSize', e.target.value)}
                        className="w-20 px-2 py-1 border rounded text-xs"
                      />
                    ) : (
                      <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                        {c.packSize || 'N/A'}
                      </span>
                    )}
                  </td>

                  {/* Product category, required before approval */}
                  <td className="py-3 px-3 min-w-[150px]">
                    {isEditing ? (
                      <select
                        value={c.category || ''}
                        onChange={(e) => handleFieldChange(c, 'category', e.target.value || null)}
                        className="w-full px-2 py-1 border rounded text-xs bg-white"
                        aria-label={`Category for ${c.productName}`}
                      >
                        <option value="">Choose category</option>
                        {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                      </select>
                    ) : (
                      <span className={c.category ? 'text-slate-700' : 'text-amber-700 font-semibold'}>
                        {c.category || 'Required'}
                      </span>
                    )}
                  </td>

                  {/* Regular Price */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {isEditing ? (
                      <input
                        type="number"
                        value={c.regularPrice ?? ''}
                        onChange={(e) =>
                          handleFieldChange(c, 'regularPrice', parseFloat(e.target.value) || null)
                        }
                        className="w-20 px-2 py-1 border rounded text-xs font-mono"
                      />
                    ) : (
                      <div className="flex items-center gap-1">
                        {c.regularPrice !== null ? (
                          <span className="font-mono text-ink line-through text-slate-500">
                            ₹{c.regularPrice}
                          </span>
                        ) : (
                          <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded text-[11px] flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Missing
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Offer Price */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {isEditing ? (
                      <input
                        type="number"
                        value={c.offerPrice ?? ''}
                        onChange={(e) =>
                          handleFieldChange(c, 'offerPrice', parseFloat(e.target.value) || null)
                        }
                        className="w-20 px-2 py-1 border rounded text-xs font-mono font-bold"
                      />
                    ) : (
                      <div>
                        {c.offerPrice !== null ? (
                          <span className="font-mono font-bold text-emerald-700 text-sm">
                            ₹{c.offerPrice}
                          </span>
                        ) : (
                          <span className="text-red-700 font-bold bg-red-50 px-1.5 py-0.5 rounded text-[11px]">
                            Missing
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Valid Until */}
                  <td className="py-3 px-3 whitespace-nowrap text-ink-muted">
                    {isEditing ? (
                      <input
                        type="date"
                        value={c.validUntil || ''}
                        onChange={(e) => handleFieldChange(c, 'validUntil', e.target.value)}
                        className="px-2 py-1 border rounded text-xs"
                      />
                    ) : (
                      <span>{c.validUntil || 'Ongoing'}</span>
                    )}
                  </td>

                  {/* Confidence */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                        isLowConfidence
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {c.confidence !== null ? `${Math.round(c.confidence * 100)}%` : '—'}
                    </span>
                  </td>

                  {/* Action buttons */}
                  <td className="py-3 px-3 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingId(isEditing ? null : c.id)}
                        className="p-1.5 text-slate-600 hover:text-ink hover:bg-slate-100 rounded"
                        title={isEditing ? 'Save inline changes' : 'Edit row'}
                      >
                        {isEditing ? <Check className="w-4 h-4 text-emerald-600" /> : <Edit2 className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleApproval(c)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded flex items-center gap-1 transition-colors ${
                          c.status === 'approved'
                            ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                        }`}
                      >
                        {c.status === 'approved' ? 'Revoke' : 'Approve'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Review Guidelines Footnote */}
      <div className="p-3 bg-surface border-t border-surface-border text-[11px] text-ink-muted flex items-center justify-between">
        <span>
          💡 <strong>Human Verification Rule</strong>: AI-extracted deals remain in draft state until explicitly approved by the merchant.
        </span>
        <span className="font-semibold text-primary">Kochi Offline Retail Quality Standard</span>
      </div>
    </div>
  );
};
