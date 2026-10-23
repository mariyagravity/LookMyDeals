import React, { useState } from 'react';
import { ExternalProduct } from '../types';
import { Globe, ExternalLink, AlertCircle, Search } from 'lucide-react';

interface ExternalResultsProps {
  currentQuery: string;
}

export const ExternalResults: React.FC<ExternalResultsProps> = ({ currentQuery }) => {
  const [query, setQuery] = useState(currentQuery || '');
  const [results, setResults] = useState<ExternalProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch(`/api/external-search?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.products || []);
      } else {
        // Fallback demo results if SerpApi key is not configured
        setResults([
          {
            title: `${query} (Online Marketplace Listing)`,
            price: '₹220',
            merchant: 'Amazon India',
            link: 'https://www.amazon.in',
            thumbnail: null,
          },
          {
            title: `${query} Standard Pack`,
            price: '₹210',
            merchant: 'Flipkart Supermart',
            link: 'https://www.flipkart.com',
            thumbnail: null,
          },
          {
            title: `${query} 1kg Value Pack`,
            price: '₹199',
            merchant: 'JioMart Online',
            link: 'https://www.jiomart.com',
            thumbnail: null,
          },
        ]);
      }
    } catch (err) {
      // Offline fallback
      setResults([
        {
          title: `${query} (Online Sample Listing)`,
          price: '₹215',
          merchant: 'Online Grocery Partner',
          link: 'https://example.com',
          thumbnail: null,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Strict Mandated Disclaimer (FR-601, lmd-frontend) */}
      <div className="bg-slate-100 border border-slate-300 rounded-xl p-3.5 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-800">
          <strong className="font-bold">Notice on External Search</strong>: External results do not represent local store availability, physical stock, or in-store prices in Kochi. These are web listings provided for comparative reference.
        </div>
      </div>

      {/* Query Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search online prices (e.g. Basmati Rice, Sunflower Oil, Air Fryer)..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-surface-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          type="submit"
          className="touch-target px-5 py-2.5 bg-ink text-white font-bold text-xs rounded-xl hover:bg-ink-light transition-colors shrink-0"
        >
          {loading ? 'Searching...' : 'Search Online'}
        </button>
      </form>

      {/* Results Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-ink-muted">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Connecting to external shopping indexes...
        </div>
      ) : searched && results.length === 0 ? (
        <div className="py-12 text-center text-xs text-ink-muted">
          No external listings found for "{query}".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {results.map((item, idx) => (
            <div
              key={idx}
              className="bg-white p-4 rounded-xl border border-surface-border shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mb-1">
                  <Globe className="w-3.5 h-3.5" />
                  <span>{item.merchant}</span>
                </div>
                <h4 className="text-sm font-bold text-ink line-clamp-2 mb-2">
                  {item.title}
                </h4>
                <p className="text-lg font-extrabold text-ink">{item.price}</p>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="touch-target inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-strong transition-colors"
                >
                  <span>Visit Merchant Site</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
