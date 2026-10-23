export const LuluLogo = () => (
  <svg viewBox="0 0 100 100" className="w-10 h-10 object-contain">
    <g transform="translate(10, 32)">
      {/* Lulu stylized text */}
      <path
        d="M5 25 V5 C5 2.5 7 1 9.5 1 C12 1 14 2.5 14 5 V20 H25 C27.5 20 29 22 29 25 C29 27.5 27.5 29 25 29 H8 C6 29 5 27.5 5 25Z"
        fill="#008037"
      />
      <path
        d="M32 25 V12 C32 9.5 34 8 36.5 8 C39 8 41 9.5 41 12 V20 H49 C51.5 20 53 22 53 25 C53 27.5 51.5 29 49 29 H35 C33 29 32 27.5 32 25Z"
        fill="#EE1C25"
      />
      <circle cx="21" cy="-2" r="3.5" fill="#EE1C25" />
      <circle cx="45" cy="3" r="3" fill="#008037" />
    </g>
    <text x="50" y="80" textAnchor="middle" fontSize="13" fontWeight="900" fill="#008037" fontFamily="sans-serif">
      LuLu
    </text>
  </svg>
);

export const NestoLogo = () => (
  <svg viewBox="0 0 100 100" className="w-10 h-10 object-contain">
    <circle cx="50" cy="34" r="14" fill="#009639" />
    <path d="M42 34 L58 34 M50 20 L50 48" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
    <text x="50" y="65" textAnchor="middle" fontSize="17" fontWeight="900" fill="#E31E24" fontFamily="Arial, sans-serif" letterSpacing="0.5">
      NESTO
    </text>
    <path d="M30 72 Q50 78 70 72" stroke="#E31E24" strokeWidth="2.5" fill="none" strokeLinecap="round" />
  </svg>
);

export const MyGLogo = () => (
  <svg viewBox="0 0 100 100" className="w-10 h-10 object-contain">
    <rect x="15" y="15" width="70" height="70" rx="18" fill="#F97316" />
    <text x="48" y="58" textAnchor="middle" fontSize="30" fontWeight="900" fill="#FFFFFF" fontFamily="sans-serif">
      myG
    </text>
    <circle cx="70" cy="38" r="3.5" fill="#FFFFFF" />
  </svg>
);

export const SmartBazaarLogo = () => (
  <svg viewBox="0 0 100 100" className="w-10 h-10 object-contain">
    <rect x="8" y="24" width="84" height="52" rx="12" fill="#E11937" />
    <text x="50" y="50" textAnchor="middle" fontSize="16" fontWeight="900" fill="#FFFFFF" fontFamily="sans-serif" letterSpacing="1">
      SMART
    </text>
    <text x="50" y="66" textAnchor="middle" fontSize="10" fontWeight="800" fill="#FFF200" fontFamily="sans-serif" letterSpacing="2">
      BAZAAR
    </text>
  </svg>
);

export const KalyanLogo = () => (
  <svg viewBox="0 0 100 100" className="w-10 h-10 object-contain">
    {/* Kalyan red diamond shield */}
    <path d="M50 10 L82 32 L70 78 L50 90 L30 78 L18 32 Z" fill="#C41230" />
    <path d="M50 16 L76 34 L66 72 L50 82 L34 72 L24 34 Z" fill="#99001A" />
    <text x="50" y="47" textAnchor="middle" fontSize="11" fontWeight="900" fill="#FFD700" fontFamily="serif" letterSpacing="1">
      KALYAN
    </text>
    <circle cx="50" cy="62" r="5" fill="#FFD700" />
  </svg>
);

export const SafariLogo = () => (
  <svg viewBox="0 0 100 100" className="w-10 h-10 object-contain">
    <rect x="22" y="16" width="56" height="68" rx="8" fill="#D32F2F" />
    <path
      d="M62 34 C60 28 45 28 42 34 C39 40 59 44 60 54 C61 65 44 66 38 60"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth="6"
      strokeLinecap="round"
    />
    <text x="50" y="78" textAnchor="middle" fontSize="8" fontWeight="800" fill="#FFFFFF" letterSpacing="1">
      SAFARI
    </text>
  </svg>
);

export const CarrefourLogo = () => (
  <svg viewBox="0 0 100 100" className="w-10 h-10 object-contain">
    {/* Carrefour blue & red arrows forming the negative-space 'C' */}
    <path d="M18 50 L42 22 C42 36 34 50 44 60 Z" fill="#E21836" />
    <path d="M82 50 L58 78 C58 64 66 50 56 40 Z" fill="#004E98" />
    <path d="M42 22 C48 16 58 16 64 22 L56 32 C52 28 48 28 44 32 Z" fill="#004E98" />
    <path d="M58 78 C52 84 42 84 36 78 L44 68 C48 72 52 72 56 68 Z" fill="#E21836" />
  </svg>
);

export const OxygenLogo = () => (
  <svg viewBox="0 0 100 100" className="w-10 h-10 object-contain">
    <ellipse cx="50" cy="46" rx="26" ry="24" fill="none" stroke="#ED1C24" strokeWidth="6" strokeDasharray="140 20" />
    <circle cx="50" cy="46" r="10" fill="#ED1C24" />
    <text x="50" y="82" textAnchor="middle" fontSize="13" fontWeight="900" fill="#ED1C24" fontFamily="sans-serif" letterSpacing="1">
      OXYGEN
    </text>
  </svg>
);

export const LookMyDealsLogo = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center cursor-pointer ${className}`}>
    <img
      src="/Logo.png"
      alt="LOOK MY DEALS"
      className="h-[34px] sm:h-[42px] md:h-[45px] w-auto object-contain block"
      onError={(e) => {
        e.currentTarget.style.display = 'none';
        const fallback = e.currentTarget.parentElement?.querySelector('.logo-fallback') as HTMLElement | null;
        if (fallback) fallback.style.display = 'flex';
      }}
    />
    <div className="logo-fallback hidden items-center gap-1.5">
      <div className="bg-[#FFB703] text-black font-black text-xs px-2.5 py-1.5 rounded-lg tracking-wider shadow-xs flex items-center justify-center">
        LOOK
      </div>
      <div className="flex flex-col justify-center leading-none">
        <span className="text-[10px] font-black tracking-widest text-slate-800 uppercase">MY</span>
        <span className="text-sm font-black tracking-tight text-slate-950 uppercase -mt-0.5">DEALS</span>
      </div>
    </div>
  </div>
);
