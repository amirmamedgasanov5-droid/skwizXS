import React from 'react';
import { Home, Search, Bell, Mail, ShieldAlert } from 'lucide-react';
import clsx from 'clsx';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isAdmin?: boolean;
  unreadCount?: number;
  unreadNotificationsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentPage, 
  onNavigate, 
  isAdmin, 
  unreadCount = 0,
  unreadNotificationsCount = 0
}) => {
  const items = [
    { id: 'feed', icon: Home, label: 'Home' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'notifications', icon: Bell, label: 'Notifications', badge: unreadNotificationsCount > 0, count: unreadNotificationsCount },
    { id: 'direct', icon: Mail, label: 'Messages', badge: unreadCount > 0, count: unreadCount },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-50">
      <div className="max-w-screen-md mx-auto w-full flex justify-between items-center">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={clsx(
              "p-2 rounded-full transition-all active:scale-90 flex flex-col items-center relative",
              currentPage === item.id ? "text-black" : "text-gray-400 hover:text-black"
            )}
          >
            <div className="relative">
              <item.icon size={26} strokeWidth={currentPage === item.id ? 2.5 : 2} />
              {item.badge && (
                 <div className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[8px] font-black rounded-full border-2 border-white flex items-center justify-center">
                    {item.count && item.count > 9 ? '9+' : item.count}
                 </div>
              )}
            </div>
          </button>
        ))}
        {isAdmin && (
          <button
             onClick={() => onNavigate('admin')}
             className={clsx(
               "p-2 rounded-full transition-colors",
               currentPage === 'admin' ? "text-black" : "text-gray-400 hover:text-black"
             )}
          >
            <ShieldAlert size={26} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
};