import React from 'react';
import { Logo } from './ui/Logo';
import { UserProfile } from '../types';

interface HeaderProps {
  user: UserProfile;
  onProfileClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onProfileClick }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-2xl px-6 py-4 flex items-center justify-between max-w-screen-md mx-auto w-full">
      <div className="flex items-center">
        <Logo size={36} />
      </div>
      
      <button 
        onClick={onProfileClick}
        className="w-10 h-10 rounded-full overflow-hidden bg-gray-100/50 shadow-sm transition-transform active:scale-90"
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-full h-full bg-gray-200" />
        )}
      </button>
    </header>
  );
};
