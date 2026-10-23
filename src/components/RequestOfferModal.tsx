import React, { useState } from 'react';
import { LOCALITIES, CATEGORIES } from '../data/seedData';
import { OfferRequest } from '../types';
import { REQUESTS_STORAGE_KEY } from '../lib/cartStorage';
import { maskPhoneNumber } from '../lib/format';
import { X, Send, Check, AlertCircle, ShoppingBag } from 'lucide-react';

interface RequestOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultLocalityId?: string;
  onRequestSubmitted?: (req: OfferRequest) => void;
}

export const RequestOfferModal: React.FC<RequestOfferModalProps> = ({
  isOpen,
  onClose,
  defaultLocalityId = 'kakkanad',
  onRequestSubmitted,
}) => {
  const [itemName, setItemName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [localityId, setLocalityId] = useState(
    defaultLocalityId === 'all' ? 'kakkanad' : defaultLocalityId
  );
  const [targetPrice, setTargetPrice] = useState('');
  const [phone, setPhone] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      setError('Please enter the product or item name.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length > 0 && cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number or leave blank.');
      return;
    }

    const loc = LOCALITIES.find((l) => l.id === localityId) || LOCALITIES[1];

    const targetPriceMinor = targetPrice ? Math.round(parseFloat(targetPrice) * 100) : undefined;
    if (targetPriceMinor && targetPriceMinor < 0) {
      setError('Target price must be a positive number.');
      return;
    }

    const newRequest: OfferRequest = {
      id: `req_${Date.now()}`,
      itemName: itemName.trim(),
      brand: brand.trim() || undefined,
      category,
      locality: loc.name,
      pinCode: loc.pinCode,
      targetPriceMinor,
      contactMasked: cleanPhone ? maskPhoneNumber(cleanPhone) : undefined,
      createdAt: new Date().toISOString(),
      status: 'open',
    };

    try {
      const raw = localStorage.getItem(REQUESTS_STORAGE_KEY);
      const existing = raw ? JSON.parse(raw) : [];
      localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify([newRequest, ...existing]));
    } catch (err) {
      console.error('Failed saving offer request to storage', err);
    }

    setIsSuccess(true);
    if (onRequestSubmitted) onRequestSubmitted(newRequest);
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
              Can't find a discount on a specific product? Send a request to local retailers in your Kochi neighborhood.
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
                    {CATEGORIES.map((c) => (
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
                    {LOCALITIES.filter((l) => l.id !== 'all').map((l) => (
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
                  Contact Mobile (Optional)
                </label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2 bg-slate-100 text-xs font-semibold rounded-lg text-ink-muted border border-surface-border">
                    +91
                  </span>
                  <input
                    id="req-phone"
                    type="tel"
                    maxLength={10}
                    placeholder="10-digit number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-surface-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                  />
                </div>
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
                  <span>Submit Request</span>
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
              Offer Request Received!
            </h2>
            <p className="text-xs text-ink-muted mb-4 max-w-xs mx-auto">
              Your request for <span className="font-bold text-ink">{itemName}</span> has been logged for stores in{' '}
              <span className="font-semibold text-ink">
                {LOCALITIES.find((l) => l.id === localityId)?.name}
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
