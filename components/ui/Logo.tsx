import React from 'react';
import { Hexagon } from 'lucide-react';

interface LogoProps {
  size?: number;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 24, className = "" }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img 
        src="https://i.ibb.co/DHJSMNJN/Tabloid-3.png" 
        alt="Skwiz Logo" 
        style={{ width: size, height: size }}
        className="object-contain"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
