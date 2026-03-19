import React from 'react';

interface VerificationBadgeProps {
  isVerified?: boolean;
  handle?: string;
  role?: string;
  size?: number;
  className?: string;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({ isVerified, handle, role, size = 16, className }) => {
  // Normalize handle for check
  const normalizedHandle = handle?.toLowerCase().replace('@', '') || '';
  
  // Define Black Badge Users
  const isBlackBadgeUser = ['amir', 'skwiz'].includes(normalizedHandle);

  if (!isVerified && !isBlackBadgeUser) return null;

  // Render High-End Black Badge for Special Users (Perfect Round Rosette)
  if (isBlackBadgeUser) {
    return (
      <div 
        title="Black Verification" 
        className={`inline-flex items-center justify-center ${className || ''}`}
        style={{ width: size, height: size }} 
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full drop-shadow-sm">
           {/* Premium Circular Rosette Shape (Symmetrical) */}
           <path 
             d="M22.5 12.0001L19.95 9.1501L20.325 5.4001L16.725 4.5751L15 1.5001L12 2.7751L9 1.5001L7.275 4.5751L3.675 5.4001L4.05 9.1501L1.5 12.0001L4.05 14.8501L3.675 18.6001L7.275 19.4251L9 22.5001L12 21.2251L15 22.5001L16.725 19.4251L20.325 18.6001L19.95 14.8501L22.5 12.0001Z" 
             fill="#000000"
           />
           {/* Checkmark */}
           <path 
             d="M8 12L10.5 14.5L16 9" 
             stroke="white" 
             strokeWidth="2.5" 
             strokeLinecap="round" 
             strokeLinejoin="round" 
           />
        </svg>
      </div>
    );
  }

  // Render Standard Blue Badge for Verified Users
  const isPremium = role === 'Premium';
  const badgeColor = isPremium ? '#F59E0B' : '#3B82F6'; // Gold for Premium, Blue for Standard

  return (
    <div 
      title={isPremium ? "Premium Account" : "Verified Account"} 
      className={`inline-flex items-center justify-center ${className || ''}`}
      style={{ width: size, height: size }} 
    >
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full drop-shadow-sm" style={{ color: badgeColor }}>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M22.5 12.0001L19.95 9.1501L20.325 5.4001L16.725 4.5751L15 1.5001L12 2.7751L9 1.5001L7.275 4.5751L3.675 5.4001L4.05 9.1501L1.5 12.0001L4.05 14.8501L3.675 18.6001L7.275 19.4251L9 22.5001L12 21.2251L15 22.5001L16.725 19.4251L20.325 18.6001L19.95 14.8501L22.5 12.0001ZM10.5 15.75L7.5 12.75L8.55 11.7L10.5 13.65L15.45 8.7L16.5 9.75L10.5 15.75Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
};