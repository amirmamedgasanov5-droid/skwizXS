import React from 'react';
import clsx from 'clsx';

interface NFTVisualProps {
  templateId: string;
  className?: string;
}

export const NFTVisual: React.FC<NFTVisualProps> = ({ templateId, className }) => {
  // Common wrapper styles
  const wrapperClass = clsx("w-full h-full relative overflow-hidden", className);

  // 1. SOLAR FLARE (Sun/Fire)
  if (templateId.includes('solar')) {
    return (
      <div className={clsx(wrapperClass, "bg-orange-900")}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500 via-orange-600 to-red-900 animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] opacity-20 animate-[spin_10s_linear_infinite]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 bg-yellow-100 rounded-full blur-2xl opacity-80 animate-pulse" />
      </div>
    );
  }

  // 2. DEEP OCEAN (Water/Flow)
  if (templateId.includes('ocean')) {
    return (
      <div className={clsx(wrapperClass, "bg-blue-900")}>
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500 to-blue-900" />
        {/* Waves */}
        <div className="absolute -bottom-1/2 left-0 right-0 h-full bg-white/10 rounded-[40%] animate-[spin_6s_linear_infinite]" />
        <div className="absolute -bottom-1/2 left-0 right-0 h-full bg-white/20 rounded-[35%] animate-[spin_8s_linear_infinite_reverse]" style={{ left: '-20%' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900 via-transparent to-transparent opacity-80" />
      </div>
    );
  }

  // 3. EMERALD ROOTS (Nature/Growth) - NEW
  if (templateId.includes('emerald')) {
    return (
      <div className={clsx(wrapperClass, "bg-green-950")}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_var(--tw-gradient-stops))] from-green-500 via-green-900 to-black" />
        {/* Floating Spores */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full blur-[1px] animate-bounce duration-[3s]" />
        <div className="absolute top-1/2 left-3/4 w-3 h-3 bg-green-200 rounded-full blur-[2px] animate-bounce duration-[5s]" />
        <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-white rounded-full blur-[1px] animate-bounce duration-[2s]" />
        
        {/* Vines abstract */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-full border-l-2 border-green-500/20 rotate-12 blur-sm transform origin-bottom" />
        <div className="absolute bottom-0 left-1/3 w-full h-full border-l-2 border-green-400/30 -rotate-6 blur-sm transform origin-bottom" />
      </div>
    );
  }

  // 4. ZEUS BOLT (Electricity)
  if (templateId.includes('bolt') || templateId.includes('storm')) {
    return (
      <div className={clsx(wrapperClass, "bg-slate-900")}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900 via-slate-900 to-black" />
        {/* Lightning SVG */}
        <svg className="absolute inset-0 w-full h-full p-4 drop-shadow-[0_0_15px_rgba(255,255,0,0.8)]" viewBox="0 0 24 24" fill="none">
           <path 
             d="M13 2L3 14H12L11 22L21 10H12L13 2Z" 
             stroke="yellow" 
             strokeWidth="0" 
             fill="yellow"
             className="animate-[pulse_0.2s_ease-in-out_infinite]"
           />
        </svg>
        <div className="absolute inset-0 bg-purple-500/20 mix-blend-overlay animate-pulse" />
      </div>
    );
  }

  // 5. FROZEN SHARD (Ice/Crystal) - NEW
  if (templateId.includes('frozen') || templateId.includes('shard')) {
    return (
      <div className={clsx(wrapperClass, "bg-cyan-950")}>
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-900 to-white/10" />
        {/* Crystal Shapes */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-br from-white/80 to-transparent rotate-45 backdrop-blur-md border border-white/50 animate-[spin_12s_linear_infinite]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-cyan-400/30 rotate-[60deg] backdrop-blur-md border border-cyan-200/50" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diamond-upholstery.png')] opacity-20" />
      </div>
    );
  }

  // 6. NEON GLITCH (Cyber/Tech)
  if (templateId.includes('neon') || templateId.includes('glitch')) {
    return (
      <div className={clsx(wrapperClass, "bg-black")}>
        <div className="absolute inset-0 bg-gradient-to-br from-pink-600 to-purple-900 opacity-50" />
        {/* Grid */}
        <div className="absolute inset-0" 
             style={{ 
               backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.2) 1px, transparent 1px)', 
               backgroundSize: '20px 20px',
               transform: 'perspective(100px) rotateX(20deg)'
             }} 
        />
        {/* Glitch Boxes */}
        <div className="absolute top-1/4 left-1/4 w-12 h-2 bg-cyan-400 animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-8 h-8 border-2 border-pink-500 animate-ping" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-4 border-white shadow-[0_0_20px_#fff] animate-[spin_3s_linear_infinite]" />
      </div>
    );
  }

  // 7. MIDAS TOUCH (Gold/Luxury)
  if (templateId.includes('midas') || templateId.includes('gold')) {
    return (
      <div className={clsx(wrapperClass, "bg-yellow-900")}>
        <div className="absolute inset-0 bg-[linear-gradient(45deg,#BF953F,#FCF6BA,#B38728,#FBF5B7,#AA771C)] bg-[length:400%_400%] animate-[gradient_3s_ease_infinite]" 
             style={{ animation: 'shimmer 3s infinite linear' }}
        />
        <style>{`
          @keyframes shimmer {
            0% { background-position: 0% 50% }
            50% { background-position: 100% 50% }
            100% { background-position: 0% 50% }
          }
        `}</style>
        <div className="absolute inset-0 flex items-center justify-center">
           <div className="w-16 h-16 border-2 border-white/50 rotate-45" />
           <div className="absolute w-10 h-10 border border-white/80 rotate-12" />
        </div>
      </div>
    );
  }

  // 8. VOID GENESIS (Artifact/BlackHole)
  if (templateId.includes('void') || templateId.includes('genesis')) {
    return (
      <div className={clsx(wrapperClass, "bg-black")}>
        {/* Accretion Disk */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] rounded-full bg-[conic-gradient(white,transparent,white)] animate-[spin_4s_linear_infinite] opacity-30 blur-sm" />
        {/* Event Horizon */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2/3 h-2/3 bg-black rounded-full shadow-[0_0_50px_white] z-10" />
        {/* Particles */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-50 animate-pulse" />
      </div>
    );
  }

  // Default Fallback
  return (
    <div className={clsx(wrapperClass, "bg-gray-900")}>
      <div className="absolute inset-0 bg-gradient-to-tr from-gray-700 to-gray-900" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/10 font-bold text-4xl">?</div>
    </div>
  );
};