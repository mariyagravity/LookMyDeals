import React from 'react';

interface IconProps {
  className?: string;
}

export const CategoryIconGroceries: React.FC<IconProps> = ({ className = "w-14 h-14" }) => (
  <img
    src="/categories/009-grocery.png"
    alt="Groceries"
    className={`${className} object-contain`}
    loading="lazy"
  />
);

export const CategoryIconFruits: React.FC<IconProps> = ({ className = "w-14 h-14" }) => (
  <img
    src="/categories/003-fruits.png"
    alt="Fruits & Vegetables"
    className={`${className} object-contain`}
    loading="lazy"
  />
);

export const CategoryIconHomeware: React.FC<IconProps> = ({ className = "w-14 h-14" }) => (
  <img
    src="/categories/015-plates.png"
    alt="Homeware"
    className={`${className} object-contain`}
    loading="lazy"
  />
);

export const CategoryIconElectronics: React.FC<IconProps> = ({ className = "w-14 h-14" }) => (
  <img
    src="/categories/009-electronic-devices.png"
    alt="Electronics"
    className={`${className} object-contain`}
    loading="lazy"
  />
);

export const CategoryIconBeverages: React.FC<IconProps> = ({ className = "w-14 h-14" }) => (
  <img
    src="/categories/006-drinks.png"
    alt="Beverages"
    className={`${className} object-contain`}
    loading="lazy"
  />
);

export const CategoryIconPantry: React.FC<IconProps> = ({ className = "w-14 h-14" }) => (
  <img
    src="/categories/001-pantry.png"
    alt="Pantry"
    className={`${className} object-contain`}
    loading="lazy"
  />
);

export const CategoryIconMeat: React.FC<IconProps> = ({ className = "w-14 h-14" }) => (
  <img
    src="/categories/004-meat.png"
    alt="Meat & Seafood"
    className={`${className} object-contain`}
    loading="lazy"
  />
);

export const CategoryIconPersonalCare: React.FC<IconProps> = ({ className = "w-14 h-14" }) => (
  <img
    src="/categories/008-personal-care-product.png"
    alt="Personal Care"
    className={`${className} object-contain`}
    loading="lazy"
  />
);

export const CategoryIconDairy: React.FC<IconProps> = ({ className = "w-14 h-14" }) => (
  <img
    src="/categories/002-dairy-products.png"
    alt="Dairy"
    className={`${className} object-contain`}
    loading="lazy"
  />
);

export const CategoryIconBakery: React.FC<IconProps> = ({ className = "w-14 h-14" }) => (
  <img
    src="/categories/005-bread.png"
    alt="Bakery"
    className={`${className} object-contain`}
    loading="lazy"
  />
);

export const CategoryIconFrozenFood: React.FC<IconProps> = ({ className = "w-14 h-14" }) => (
  <img
    src="/categories/013-ice-cream.png"
    alt="Frozen Food"
    className={`${className} object-contain`}
    loading="lazy"
  />
);

export const CategoryIconBeauty: React.FC<IconProps> = ({ className = "w-14 h-14" }) => (
  <img
    src="/categories/010-beauty-product.png"
    alt="Beauty"
    className={`${className} object-contain`}
    loading="lazy"
  />
);

export const CategoryIconBabyProducts: React.FC<IconProps> = ({ className = "w-14 h-14" }) => (
  <img
    src="/categories/011-baby-products.png"
    alt="Baby Products"
    className={`${className} object-contain`}
    loading="lazy"
  />
);

export const CategoryIconPetFood: React.FC<IconProps> = ({ className = "w-14 h-14" }) => (
  <img
    src="/categories/012-pet-food.png"
    alt="Pet Food"
    className={`${className} object-contain`}
    loading="lazy"
  />
);

export const CategoryIconLaundry: React.FC<IconProps> = ({ className = "w-14 h-14" }) => (
  <img
    src="/categories/014-laundry.png"
    alt="Laundry"
    className={`${className} object-contain`}
    loading="lazy"
  />
);

export const CategoryIconStationery: React.FC<IconProps> = ({ className = "w-14 h-14" }) => (
  <img
    src="/categories/016-stationery.png"
    alt="Stationery"
    className={`${className} object-contain`}
    loading="lazy"
  />
);
