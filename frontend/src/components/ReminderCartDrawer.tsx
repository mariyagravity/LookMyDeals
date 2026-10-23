import React, { useState } from 'react';
import { CartItem } from '../types';
import { formatINR } from '../lib/format';
import { calculateCartSummary, CART_DISCLAIMER_TEXT } from '../lib/cartStorage';
import { X, Trash2, Plus, Minus, ShoppingBag, Check, Info, Share2 } from 'lucide-react';

interface ReminderCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}

export const ReminderCartDrawer: React.FC<ReminderCartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const { totalItems, totalPayableMinor, totalSavingsMinor } = calculateCartSummary(items);

  // Group items by store for offline trip convenience
  const storeGroups = items.reduce<Record<string, CartItem[]>>((acc, item) => {
    const key = `${item.storeName} (${item.localityName})`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const handleExportList = () => {
    if (items.length === 0) return;

    let text = `🛒 LookMyDeals — Offline Shopping Reminder List\n`;
    text += `Target Area: Kochi, Kerala\n`;
    text += `--------------------------------------------------\n`;

    Object.entries(storeGroups).forEach(([store, storeItems]) => {
      text += `\n📍 ${store}:\n`;
      storeItems.forEach((item, idx) => {
        text += `  ${idx + 1}. ${item.productName} (${item.packSize}) × ${item.quantity} — ${formatINR(
          item.priceSnapshotMinor * item.quantity
        )}\n`;
      });
    });

    text += `\n--------------------------------------------------\n`;
    text += `Estimated Total: ${formatINR(totalPayableMinor)}\n`;
    text += `Estimated Total Savings: ${formatINR(totalSavingsMinor)}\n\n`;
    text += `Note: ${CART_DISCLAIMER_TEXT}\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-ink/50 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl relative border-l border-surface-border">
        {/* Drawer Header */}
        <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface/50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary-strong" />
            <h2 id="cart-drawer-title" className="text-base font-bold text-ink">
              Reminder Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="touch-target p-1 text-ink-muted hover:text-ink rounded-lg transition-colors"
            aria-label="Close cart drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verbatim Disclaimer Banner (FR-302) */}
        <div className="bg-amber-50 px-4 py-2.5 border-b border-amber-200 text-amber-950 text-xs flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <span className="leading-relaxed font-medium">
            {CART_DISCLAIMER_TEXT}
          </span>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-ink mb-1">Your list is empty</h3>
              <p className="text-xs text-ink-muted mb-4 max-w-xs mx-auto">
                Explore local deals and tap "Add to Cart" to build your offline grocery or electronics shopping list.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="touch-target px-4 py-2 text-xs font-bold bg-primary text-white rounded-lg hover:bg-primary-strong transition-colors"
              >
                Browse Deals
              </button>
            </div>
          ) : (
            Object.entries(storeGroups).map(([storeName, groupItems]) => (
              <div
                key={storeName}
                className="bg-surface rounded-xl p-3 border border-surface-border shadow-xs"
              >
                <div className="text-xs font-bold text-ink mb-2 pb-1.5 border-b border-surface-border flex items-center justify-between">
                  <span className="text-primary-strong">{storeName}</span>
                  <span className="text-ink-muted font-normal text-[11px]">
                    {groupItems.length} {groupItems.length === 1 ? 'deal' : 'deals'}
                  </span>
                </div>

                <div className="space-y-3">
                  {groupItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-ink truncate">
                          {item.productName}
                        </p>
                        <p className="text-[11px] text-ink-muted">
                          Pack: {item.packSize} • {formatINR(item.priceSnapshotMinor)} / unit
                        </p>
                      </div>

                      {/* Quantity & Removal Controls */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-slate-200 rounded-md bg-slate-50">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="p-1 text-slate-600 hover:text-ink hover:bg-slate-200 rounded-l transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2 text-xs font-bold text-ink">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="p-1 text-slate-600 hover:text-ink hover:bg-slate-200 rounded-r transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          aria-label={`Remove ${item.productName} from cart`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer: Totals & Action Buttons */}
        {items.length > 0 && (
          <div className="p-4 border-t border-surface-border bg-white space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-ink-muted">
                <span>Estimated In-Store Total:</span>
                <span className="text-base font-extrabold text-ink">
                  {formatINR(totalPayableMinor)}
                </span>
              </div>
              {totalSavingsMinor > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Estimated Total Savings:</span>
                  <span>{formatINR(totalSavingsMinor)}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleExportList}
                className="touch-target px-3 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-ink rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>List Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-slate-600" />
                    <span>Copy Shopping List</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClearCart}
                className="touch-target px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-red-200"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear List</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
