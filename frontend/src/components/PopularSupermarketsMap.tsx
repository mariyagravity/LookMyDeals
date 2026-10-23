import React, { useState } from 'react';
import {
  LuluLogo,
  NestoLogo,
  MyGLogo,
  SmartBazaarLogo,
  KalyanLogo,
  CarrefourLogo,
  OxygenLogo,
} from './BrandLogos';
import { MapPin, Navigation, ExternalLink, Star } from 'lucide-react';

interface StoreItem {
  id: string;
  name: string;
  location: string;
  fullAddress: string;
  mapQuery: string;
  logo: React.ReactNode;
  rating: number;
  dealsCount: number;
}

export const PopularSupermarketsMap: React.FC = () => {
  const stores: StoreItem[] = [
    {
      id: 'lulu',
      name: 'LuLu Hypermarket',
      location: 'Edappally, Kochi',
      fullAddress: 'LuLu International Shopping Mall, Edappally, Kochi, Kerala 682024',
      mapQuery: 'LuLu International Shopping Mall, Edappally, Kochi, Kerala',
      logo: <LuluLogo />,
      rating: 4.8,
      dealsCount: 15,
    },
    {
      id: 'nesto',
      name: 'Nesto Hypermarket',
      location: 'Edappally, Kochi',
      fullAddress: 'Nesto Hypermarket, Toll Junction, Edappally, Kochi, Kerala 682024',
      mapQuery: 'Nesto Hypermarket, Edappally, Kochi, Kerala',
      logo: <NestoLogo />,
      rating: 4.6,
      dealsCount: 8,
    },
    {
      id: 'myg',
      name: 'myG Future Store',
      location: 'MG Road, Kochi',
      fullAddress: 'myG Digital Hub, MG Road, Ernakulam, Kochi, Kerala 682016',
      mapQuery: 'myG Future Store, MG Road, Ernakulam, Kochi',
      logo: <MyGLogo />,
      rating: 4.7,
      dealsCount: 9,
    },
    {
      id: 'smart_bazaar',
      name: 'Smart Bazaar',
      location: 'Kakkanad, Kochi',
      fullAddress: 'Reliance Smart Bazaar, Seaport-Airport Rd, Kakkanad, Kochi, Kerala 682030',
      mapQuery: 'Reliance Smart Bazaar, Kakkanad, Kochi, Kerala',
      logo: <SmartBazaarLogo />,
      rating: 4.5,
      dealsCount: 7,
    },
    {
      id: 'kalyan',
      name: 'Kalyan Silks & Hyper',
      location: 'MG Road, Kochi',
      fullAddress: 'Kalyan Silks, Shenoys Junction, MG Road, Ernakulam, Kochi 682016',
      mapQuery: 'Kalyan Silks, MG Road, Ernakulam, Kochi',
      logo: <KalyanLogo />,
      rating: 4.6,
      dealsCount: 6,
    },
    {
      id: 'carrefour',
      name: 'Carrefour Market',
      location: 'Aluva, Kochi',
      fullAddress: 'Carrefour Market, Metro Station Terminal, Aluva, Kochi 682101',
      mapQuery: 'Aluva Metro Station, Kochi, Kerala',
      logo: <CarrefourLogo />,
      rating: 4.4,
      dealsCount: 4,
    },
    {
      id: 'oxygen',
      name: 'Oxygen Digital Shop',
      location: 'Palarivattom, Kochi',
      fullAddress: 'Oxygen Digital Shop, Pipeline Junction, Palarivattom, Kochi 682025',
      mapQuery: 'Oxygen Digital Shop, Palarivattom, Kochi',
      logo: <OxygenLogo />,
      rating: 4.6,
      dealsCount: 6,
    },
  ];

  const [selectedStoreId, setSelectedStoreId] = useState<string>('lulu');
  const activeStore = stores.find((s) => s.id === selectedStoreId) || stores[0];

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
      <div className="flex flex-col lg:flex-row h-auto lg:h-[480px]">
        {/* Left / Top Store Selector Sidebar */}
        <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50/50 flex flex-col shrink-0">
          {/* Header */}
          <div className="p-4 border-b border-slate-200/70 bg-white">
            <span className="text-[11px] font-extrabold text-[#009688] tracking-widest uppercase block mb-0.5">
              TOP RATED
            </span>
            <h3 className="text-base font-black text-[#003B46] tracking-tight">
              Popular Supermarkets
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Select a store to view its verified location on Google Maps
            </p>
          </div>

          {/* Stores List (Horizontal scroll on mobile, Vertical on desktop) */}
          <div className="p-2 sm:p-3 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:overflow-x-hidden flex-1 scrollbar-thin">
            {stores.map((s) => {
              const isSelected = selectedStoreId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedStoreId(s.id)}
                  className={`w-auto lg:w-full flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all text-left shrink-0 lg:shrink ${
                    isSelected
                      ? 'bg-teal-50/80 border border-teal-300 shadow-xs ring-1 ring-teal-500/20'
                      : 'bg-white hover:bg-slate-100/80 border border-slate-200/80'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 shadow-2xs p-1 flex items-center justify-center shrink-0">
                    {s.logo}
                  </div>
                  <div className="min-w-0 pr-1 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-900 leading-tight truncate">
                        {s.name}
                      </h4>
                      <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-600 shrink-0">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        {s.rating}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight truncate mt-0.5">
                      {s.location}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Store Bottom Info Banner (Desktop) */}
          <div className="hidden lg:block p-3.5 bg-white border-t border-slate-200/70">
            <div className="flex items-start gap-2 mb-2">
              <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 line-clamp-2 leading-snug">
                {activeStore.fullAddress}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(activeStore.mapQuery)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-1.5 px-3 bg-[#007A78] hover:bg-[#006664] text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              >
                <Navigation className="w-3 h-3" />
                <span>Directions</span>
              </a>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeStore.mapQuery)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-1.5 px-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-semibold rounded-lg flex items-center gap-1 transition-colors"
                title="Open in Google Maps"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </aside>

        {/* Right Google Map Viewport */}
        <div className="relative flex-1 min-h-[350px] lg:min-h-full bg-slate-100">
          <iframe
            key={activeStore.id}
            title={`Google Map - ${activeStore.name}`}
            src={`https://maps.google.com/maps?q=${encodeURIComponent(activeStore.mapQuery)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
            className="w-full h-full border-0 absolute inset-0"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />

          {/* Mobile Bottom Quick Actions */}
          <div className="lg:hidden absolute bottom-3 left-3 right-3 z-10 bg-white/95 backdrop-blur-md rounded-xl p-3 shadow-md border border-slate-200/80 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-slate-900 truncate">
                {activeStore.name}
              </h4>
              <p className="text-[11px] text-slate-500 truncate">
                {activeStore.location}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(activeStore.mapQuery)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-1.5 px-3 bg-[#007A78] text-white text-[11px] font-bold rounded-lg flex items-center gap-1"
              >
                <Navigation className="w-3 h-3" />
                <span>Directions</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
