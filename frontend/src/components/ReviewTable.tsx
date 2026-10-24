import React, { PointerEvent, useEffect, useState } from 'react';
import { BrochureProductCandidate, Category } from '../types';
import { Check, AlertTriangle, ShieldCheck, Edit2, Sparkles, Trash2, Crop, X } from 'lucide-react';
import { cropBrochureProducts, renderBrochurePagePreview } from '../lib/brochureCrops';

interface ReviewTableProps {
  candidates: BrochureProductCandidate[];
  onUpdateCandidate: (updated: BrochureProductCandidate) => void;
  onApproveAndPublish: (approvedCandidates: BrochureProductCandidate[]) => void;
  onDeleteCandidate: (candidate: BrochureProductCandidate) => Promise<void>;
  sourceFile: File | null;
  onSaveCrop: (candidate: BrochureProductCandidate, cropBox: NonNullable<BrochureProductCandidate['cropBox']>, blob: Blob) => Promise<void>;
  canPublish: boolean;
  categories: Category[];
}

export const ReviewTable: React.FC<ReviewTableProps> = ({
  candidates,
  onUpdateCandidate,
  onApproveAndPublish,
  onDeleteCandidate,
  sourceFile,
  onSaveCrop,
  canPublish,
  categories,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cropCandidateId, setCropCandidateId] = useState<string | null>(null);
  const [pagePreview, setPagePreview] = useState('');
  const [cropBox, setCropBox] = useState<NonNullable<BrochureProductCandidate['cropBox']> | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [savingCrop, setSavingCrop] = useState(false);

  const cropCandidate = candidates.find((candidate) => candidate.id === cropCandidateId) || null;
  useEffect(() => {
    let cancelled = false;
    if (!sourceFile || !cropCandidate) { setPagePreview(''); return; }
    renderBrochurePagePreview(sourceFile, cropCandidate.pageNumber || 1)
      .then((url) => { if (!cancelled) setPagePreview(url); })
      .catch(() => { if (!cancelled) setPagePreview(''); });
    return () => { cancelled = true; };
  }, [sourceFile, cropCandidate?.id, cropCandidate?.pageNumber]);

  const pointOnPage = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) };
  };
  const startCropDrag = (event: PointerEvent<HTMLDivElement>) => {
    const point = pointOnPage(event);
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragStart(point);
    setCropBox({ x: point.x, y: point.y, width: 0.01, height: 0.01 });
  };
  const moveCropDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragStart) return;
    const point = pointOnPage(event);
    setCropBox({ x: Math.min(point.x, dragStart.x), y: Math.min(point.y, dragStart.y), width: Math.max(0.01, Math.abs(point.x - dragStart.x)), height: Math.max(0.01, Math.abs(point.y - dragStart.y)) });
  };
  const finishCropDrag = (event: PointerEvent<HTMLDivElement>) => {
    moveCropDrag(event);
    setDragStart(null);
  };

  const saveCrop = async () => {
    if (!sourceFile || !cropCandidate || !cropBox) return;
    setSavingCrop(true);
    try {
      const edited = { ...cropCandidate, cropBox };
      const crops = await cropBrochureProducts(sourceFile, [edited]);
      const blob = crops.get(cropCandidate.id);
      if (!blob) throw new Error('Select the product area before saving its crop.');
      await onSaveCrop(cropCandidate, cropBox, blob);
      setCropCandidateId(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Could not save this crop.');
    } finally { setSavingCrop(false); }
  };

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
                        {c.cropPreviewUrl ? <img src={c.cropPreviewUrl} alt={`Crop of ${c.productName}`} className="mb-2 h-16 w-16 rounded-lg border border-slate-200 bg-white object-contain" /> : <span className="mb-2 flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-amber-300 bg-amber-50 px-1 text-center text-[9px] font-semibold text-amber-800">Crop unavailable</span>}
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
                      <button type="button" disabled={!sourceFile} onClick={() => { setCropBox(c.cropBox || { x: 0.1, y: 0.1, width: 0.3, height: 0.3 }); setCropCandidateId(c.id); }} className="p-1.5 text-teal-700 hover:bg-teal-50 rounded disabled:opacity-40" title="Adjust product crop" aria-label={`Adjust crop for ${c.productName}`}><Crop className="w-4 h-4" /></button>
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
                        onClick={() => {
                          if (window.confirm(`Delete ${c.productName} from this brochure review?`)) {
                            void onDeleteCandidate(c).catch((error: unknown) => alert(error instanceof Error ? error.message : 'Could not delete this item.'));
                          }
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        title="Delete extracted item"
                        aria-label={`Delete ${c.productName}`}
                      >
                        <Trash2 className="w-4 h-4" />
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

      {cropCandidate && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={`Adjust crop for ${cropCandidate.productName}`}>
        <section className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <header className="flex items-center justify-between border-b border-slate-200 p-4"><div><h2 className="font-bold text-slate-900">Crop product image</h2><p className="text-xs text-slate-600">Drag a tight rectangle around {cropCandidate.productName}. Leave out prices, labels, and neighboring items.</p></div><button type="button" onClick={() => setCropCandidateId(null)} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Close crop editor"><X className="h-5 w-5" /></button></header>
          <div className="min-h-0 overflow-auto bg-slate-100 p-3 text-center">{pagePreview ? <div className="relative mx-auto inline-block max-w-full cursor-crosshair touch-none select-none" onPointerDown={startCropDrag} onPointerMove={moveCropDrag} onPointerUp={finishCropDrag}>
            <img src={pagePreview} alt={`Original brochure page for ${cropCandidate.productName}`} className="block max-h-[70vh] max-w-full object-contain" draggable={false} />
            {cropBox && <div className="pointer-events-none absolute border-2 border-teal-600 bg-teal-400/15 shadow-[0_0_0_9999px_rgba(15,23,42,.22)]" style={{ left: `${cropBox.x * 100}%`, top: `${cropBox.y * 100}%`, width: `${cropBox.width * 100}%`, height: `${cropBox.height * 100}%` }} />}
          </div> : <p className="p-8 text-sm text-slate-600">Could not render this brochure page.</p>}</div>
          <footer className="flex items-center justify-between gap-3 border-t border-slate-200 p-4"><div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded border bg-white">{cropCandidate.cropPreviewUrl && <img src={cropCandidate.cropPreviewUrl} alt="Current crop" className="h-full w-full object-contain" />}</div><div className="flex gap-2"><button type="button" onClick={() => setCropCandidateId(null)} className="min-h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold">Cancel</button><button type="button" disabled={savingCrop || !cropBox || !pagePreview} onClick={() => void saveCrop()} className="min-h-10 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white disabled:opacity-50">{savingCrop ? 'Saving…' : 'Save crop'}</button></div></footer>
        </section>
      </div>}

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
