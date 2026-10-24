import React, { useEffect, useState } from 'react';
import { Category, Locality, OfferRequest } from '../types';
import { maskPhoneNumber } from '../lib/format';
import { readApiJson } from '../lib/api';
import { X, Send, Check, AlertCircle, ShoppingBag } from 'lucide-react';

interface RequestOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultLocalityId?: string;
  localities: Locality[];
  categories: Category[];
  onRequestSubmitted?: (req: OfferRequest) => void;
}

export const RequestOfferModal: React.FC<RequestOfferModalProps> = ({
  isOpen,
  onClose,
  defaultLocalityId = 'kakkanad',
  localities,
  categories,
  onRequestSubmitted,
}) => {
  const [itemName, setItemName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Other');
  const [localityId, setLocalityId] = useState(
    defaultLocalityId === 'all' ? (localities[1]?.id || '') : defaultLocalityId
  );
  const [targetPrice, setTargetPrice] = useState('');
  const [phone, setPhone] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!categories.includes(category) && categories.length > 0) setCategory(categories[0]);
  }, [categories, category]);

  useEffect(() => {
    if (defaultLocalityId !== 'all' && localities.some((locality) => locality.id === defaultLocalityId)) {
      setLocalityId(defaultLocalityId);
    } else if (!localities.some((locality) => locality.id === localityId)) {
      setLocalityId(localities[1]?.id || '');
    }
  }, [defaultLocalityId, localities, localityId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      setError('Please enter the product or item name.');
      return;
    }

    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.slice(2);
    }

    if (!cleanPhone) {
      setError('Contact mobile number is mandatory. Please enter your 10-digit number.');
      return;
    }

    if (cleanPhone.length !== 10) {
      setError('Contact number must be exactly 10 digits.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    const loc = localities.find((l) => l.id === localityId);
    if (!loc) {
      setError('Choose a locality from the list.');
      return;
    }

    const parsedTargetPrice = targetPrice.trim() ? Number(targetPrice) : undefined;
    if (parsedTargetPrice !== undefined && (!Number.isFinite(parsedTargetPrice) || parsedTargetPrice < 0)) {
      setError('Target price must be a non-negative number.');
      return;
    }
    const targetPriceMinor = parsedTargetPrice === undefined ? undefined : Math.round(parsedTargetPrice * 100);

    const requestData = {
      itemName: itemName.trim(),
      brand: brand.trim() || undefined,
      category,
      locality: loc.name,
      pinCode: loc.pinCode,
      targetPriceMinor,
      contactMasked: maskPhoneNumber(cleanPhone),
    };

    try {
      setIsSaving(true);
      const response = await fetch('/api/offer-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });
      const result = await readApiJson(response);
      if (!response.ok) throw new Error(result.error?.message || 'Could not save your request.');
      setIsSuccess(true);
      onRequestSubmitted?.(result as OfferRequest);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your request.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setItemName('');
    setBrand('');
    setTargetPrice('');
    setPhone('');
    setIsSuccess(false);
    setError('');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="request-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-surface-border relative">
        <button
          type="button"
          onClick={handleReset}
          className="touch-target absolute top-4 right-4 text-ink-muted hover:text-ink rounded-full p-1"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSuccess ? (
          <div>
            <div className="flex items-center gap-2 text-primary-strong mb-1">
              <ShoppingBag className="w-6 h-6" />
              <h2 id="request-modal-title" className="text-xl font-bold text-ink">
                Request an Offer
              </h2>
            </div>
            <p className="text-xs text-ink-muted mb-4">
              Can't find a discount? Save a demo request for a product in your Kochi neighborhood.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label htmlFor="req-item-name" className="block text-xs font-semibold text-ink mb-1">
                  Product / Item Name *
                </label>
                <input
                  id="req-item-name"
                  type="text"
                  required
                  placeholder="e.g. Nirapara Matta Rice 10kg, Sony 43-inch TV"
                  value={itemName}
                  onChange={(e) => {
                    setItemName(e.target.value);
                    setError('');
                  }}
                  className="w-full px-3 py-2 text-sm border border-surface-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="req-brand" className="block text-xs font-semibold text-ink mb-1">
                    Brand (Optional)
                  </label>
                  <input
                    id="req-brand"
                    type="text"
                    placeholder="e.g. Nirapara, LG"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-surface-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="req-category" className="block text-xs font-semibold text-ink mb-1">
                    Category
                  </label>
                  <select
                    id="req-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border border-surface-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="req-locality" className="block text-xs font-semibold text-ink mb-1">
                    Locality / PIN *
                  </label>
                  <select
                    id="req-locality"
                    value={localityId}
                    onChange={(e) => setLocalityId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-surface-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white cursor-pointer"
                  >
                    {localities.filter((l) => l.id !== 'all').map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.pinCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="req-target-price" className="block text-xs font-semibold text-ink mb-1">
                    Target Price (₹)
                  </label>
                  <input
                    id="req-target-price"
                    type="number"
                    min="0"
                    placeholder="e.g. 450"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-surface-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="req-phone" className="block text-xs font-semibold text-ink mb-1">
                  Contact Mobile Number *
                </label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2 bg-slate-100 text-xs font-semibold rounded-lg text-ink-muted border border-surface-border">
                    +91
                  </span>
                  <input
                    id="req-phone"
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="10-digit number (e.g. 9847012345)"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhone(val);
                      if (error) setError('');
                    }}
                    className="w-full px-3 py-2 text-sm border border-surface-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                  />
                </div>
                {phone.length === 10 && (
                  <p className="text-[11px] text-ink-muted mt-1 flex items-center justify-between">
                    <span>Privacy masked: <strong className="font-mono text-ink">{maskPhoneNumber(phone)}</strong></span>
                    {/^[6-9]\d{9}$/.test(phone) ? (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Valid 10-digit number
                      </span>
                    ) : (
                      <span className="text-amber-600 font-medium">Must start with 6, 7, 8, or 9</span>
                    )}
                  </p>
                )}
                <p className="text-[10px] text-slate-400 mt-1">
                  Under DPDP privacy guidelines, your raw number is masked (e.g. 98•••••345) and never shared publicly.
                </p>
              </div>

              {error && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </p>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="touch-target px-4 py-2 text-xs font-semibold text-ink-muted hover:text-ink rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="touch-target px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-strong rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Submit Request'}</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-4 animate-fade-in">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-bold text-ink mb-1">
              Demo Request Saved
            </h2>
            <p className="text-xs text-ink-muted mb-4 max-w-xs mx-auto">
              Your request for <span className="font-bold text-ink">{itemName}</span> was saved to the database. It has not been sent to retailers. Area:{' '}
              <span className="font-semibold text-ink">
                {localities.find((l) => l.id === localityId)?.name}
              </span>.
            </p>

            <button
              type="button"
              onClick={handleReset}
              className="touch-target w-full py-2.5 bg-ink text-white font-bold text-xs rounded-lg hover:bg-ink-light transition-colors"
            >
              Back to Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
