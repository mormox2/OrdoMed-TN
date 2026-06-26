import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Logo({ className = '', size = 'md' }: LogoProps) {
  const dimensions = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <div className={`relative flex items-center justify-center ${dimensions[size]} ${className}`}>
      {/* Glow outer ring */}
      <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/20 to-emerald-500/20 rounded-2xl blur-md animate-pulse" />
      
      {/* Core container */}
      <div className="relative w-full h-full bg-gradient-to-tr from-teal-700 to-emerald-500 p-2 sm:p-2.5 rounded-2xl border border-teal-400/30 shadow-lg flex items-center justify-center overflow-hidden group hover:scale-105 transition-transform duration-300">
        {/* Subtle radial inner shine */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_60%)]" />

        {/* Scalable SVG Logo Graphics */}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 100 100" 
          className="w-full h-full text-white fill-none"
        >
          {/* Faded background medical cross */}
          <path 
            d="M50 15 v70 M15 50 h70" 
            stroke="rgba(255, 255, 255, 0.16)" 
            strokeWidth="16" 
            strokeLinecap="round" 
          />
          
          {/* Dynamic white lifepulse line */}
          <path 
            d="M20 50 h15 l6-18 l8 36 l6-24 l5 6 h20" 
            stroke="currentColor" 
            strokeWidth="7" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
          />
          
          {/* Small modern accent dot (represents a pill / focal point of care) */}
          <circle cx="49" cy="44" r="5" className="fill-rose-500 animate-ping opacity-75" />
          <circle cx="49" cy="44" r="4.5" className="fill-rose-500" />
        </svg>
      </div>
    </div>
  );
}
