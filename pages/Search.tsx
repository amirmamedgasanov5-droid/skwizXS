import React, { useState, useEffect } from 'react';
import { searchUsers, followUser, unfollowUser, getOrCreateChat, getUserProfile } from '../services/firebase';
import { UserProfile } from '../types';
import { Search as SearchIcon, UserPlus, UserCheck, MessageCircle } from 'lucide-react';
import { VerificationBadge } from '../components/ui/VerificationBadge';
import { Input } from '../components/ui/Input';
import { auth } from '../services/firebase';

interface SearchProps {
  onOpenChat?: (chatId: string) => void;
  onViewProfile?: (uid: string) => void;
}

export const Search: React.FC<SearchProps> = ({ onOpenChat, onViewProfile }) => {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (auth.currentUser) {
      getUserProfile(auth.currentUser.uid).then(setCurrentUser);
    }
  }, []);

  const handleSearch = async (val: string) => {
    setTerm(val);
    if (val.length > 2) {
      setLoading(true);
      try {
        const users = await searchUsers(val.toLowerCase());
        setResults(users.filter(u => u.uid !== auth.currentUser?.uid));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    } else {
      setResults([]);
    }
  };

  const toggleFollow = async (target: UserProfile) => {
    if (!currentUser) return;
    // SAFEGUARD: Check includes safely
    const isFollowing = currentUser.following?.includes?.(target.uid) ?? false;
    
    // Safety check for following array
    const currentFollowing = currentUser.following ?? [];

    const updatedFollowing = isFollowing 
      ? currentFollowing.filter(id => id !== target.uid)
      : [...currentFollowing, target.uid];
      
    setCurrentUser({ ...currentUser, following: updatedFollowing });

    try {
      if (isFollowing) {
        await unfollowUser(currentUser.uid, target.uid);
      } else {
        await followUser(currentUser.uid, target.uid);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMessage = async (target: UserProfile) => {
    if (!currentUser || !onOpenChat) return;
    try {
      const chatId = await getOrCreateChat(currentUser.uid, target.uid, target);
      onOpenChat(chatId);
    } catch (e) {
      console.error("Error creating chat", e);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto min-h-[80vh]">
      <h1 className="text-xl font-bold mb-6 text-black">Поиск</h1>
      
      <div className="relative mb-6">
        <SearchIcon className="absolute top-3.5 left-4 text-vk-secondary" size={18} />
        <input 
          className="w-full pl-11 pr-4 py-2.5 bg-[#EBEDF0] border-none rounded-lg text-sm focus:ring-2 focus:ring-vk-blue outline-none" 
          placeholder="Поиск по @handle" 
          value={term}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {loading && <p className="text-center text-vk-secondary text-sm animate-pulse">Поиск...</p>}
        
        {!loading && term.length > 2 && results.length === 0 && (
          <p className="text-center text-vk-secondary text-sm">Никого не найдено.</p>
        )}

        {results.map(user => {
          // SAFEGUARD: Safe check for following
          const isFollowing = currentUser?.following?.includes?.(user.uid) ?? false;
          return (
            <div 
              key={user.uid} 
              onClick={() => onViewProfile && onViewProfile(user.uid)}
              className="flex items-center gap-3 p-3 bg-white border border-vk-border rounded-xl transition-colors cursor-pointer hover:bg-gray-50"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden flex-shrink-0 border border-vk-border">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.handle} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400"><UserPlus size={20}/></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                   <p className="font-bold text-sm truncate text-vk-blue">{user.handle}</p>
                   <VerificationBadge isVerified={user.isVerified} handle={user.handle} size={14} />
                </div>
              </div>
              
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                 <button 
                   onClick={() => handleMessage(user)}
                   className="p-2 bg-[#F2F3F5] rounded-lg text-vk-blue hover:bg-gray-200"
                 >
                   <MessageCircle size={18} />
                 </button>
                 <button 
                   onClick={() => toggleFollow(user)}
                   className={`p-2 rounded-lg border transition-all ${isFollowing ? 'bg-[#F2F3F5] text-black border-transparent' : 'bg-vk-blue text-white border-transparent'}`}
                 >
                   {isFollowing ? <UserCheck size={18} /> : <UserPlus size={18} />}
                 </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
