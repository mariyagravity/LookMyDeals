import React from 'react';
import { Category } from '../types';
import { Grid2X2 } from 'lucide-react';

interface CategoryChipsProps {
  selectedCategory: Category | 'All';
  onSelectCategory: (cat: Category | 'All') => void;
  categories: Category[];
  categoryCounts: Record<string, number>;
}

export const CategoryChips: React.FC<CategoryChipsProps> = ({
  selectedCategory,
  onSelectCategory,
  categories,
  categoryCounts,
}) => {
  const categoryArt: Record<string, { icon: string; label: string }> = {
    'Groceries & Staples': { icon: '🛒', label: 'Groceries' },
    'Fresh Fruits & Veggies': { icon: '🍎', label: 'Fruits & Vegetables' },
    'Home & Cleaning': { icon: '🍽️', label: 'Homeware' },
    'Electronics & Appliances': { icon: '🎮', label: 'Electronics' },
    'Personal Care': { icon: '🧴', label: 'Personal Care' },
  };

  return (
    <section aria-label="Browse deals by category" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-ink">Shop by Category</h3>
        <button
          type="button"
          onClick={() => onSelectCategory('All')}
          aria-pressed={selectedCategory === 'All'}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
            selectedCategory === 'All'
              ? 'bg-ink text-white'
              : 'border border-surface-border bg-white text-ink hover:bg-slate-50'
          }`}
        >
          <Grid2X2 className="h-4 w-4" />
          All deals
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8">
        {categories.map((category) => {
          const art = categoryArt[category] || { icon: '🏷️', label: category };
          const isSelected = selectedCategory === category;
          const count = categoryCounts[category] || 0;
          return (
            <button
              key={category}
              type="button"
              onClick={() => onSelectCategory(category)}
              aria-pressed={isSelected}
              className={`flex min-h-[218px] flex-col items-center justify-center gap-2 rounded-lg border bg-white px-3 py-5 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                isSelected ? 'border-primary ring-2 ring-primary/15' : 'border-surface-border hover:border-slate-300'
              }`}
            >
              <span aria-hidden="true" className="mb-1 text-6xl leading-none">{art.icon}</span>
              <span className="text-sm font-bold leading-snug text-ink">{art.label}</span>
              <span className="text-xs text-ink-muted">{count} {count === 1 ? 'Deal' : 'Deals'}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
