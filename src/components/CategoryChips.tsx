import React from 'react';
import { CATEGORIES } from '../data/seedData';
import { Category } from '../types';
import { ShoppingBasket, Apple, Sparkles, Home, Tv, LayoutGrid } from 'lucide-react';

interface CategoryChipsProps {
  selectedCategory: Category | 'All';
  onSelectCategory: (cat: Category | 'All') => void;
}

export const CategoryChips: React.FC<CategoryChipsProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Groceries & Staples':
        return <ShoppingBasket className="w-4 h-4 shrink-0" />;
      case 'Fresh Fruits & Veggies':
        return <Apple className="w-4 h-4 shrink-0" />;
      case 'Personal Care':
        return <Sparkles className="w-4 h-4 shrink-0" />;
      case 'Home & Cleaning':
        return <Home className="w-4 h-4 shrink-0" />;
      case 'Electronics & Appliances':
        return <Tv className="w-4 h-4 shrink-0" />;
      default:
        return <LayoutGrid className="w-4 h-4 shrink-0" />;
    }
  };

  const allCategories: (Category | 'All')[] = ['All', ...CATEGORIES];

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-1">
      {allCategories.map((cat) => {
        const isSelected = selectedCategory === cat;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onSelectCategory(cat)}
            className={`touch-target px-3.5 py-2 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-all shadow-sm ${
              isSelected
                ? 'bg-ink text-white shadow-md ring-2 ring-ink/20'
                : 'bg-white text-ink-light border border-surface-border hover:bg-slate-50'
            }`}
          >
            {getCategoryIcon(cat)}
            <span>{cat === 'All' ? 'All Deals' : cat}</span>
          </button>
        );
      })}
    </div>
  );
};
