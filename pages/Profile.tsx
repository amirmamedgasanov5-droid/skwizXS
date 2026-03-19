import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, Post, NFTInstance, UserGift } from '../types';
import { requestVerification, auth, getSavedPosts, updateUserAvatar, getUserProfile, followUser, unfollowUser, getOrCreateChat, deleteUserAccount, subscribeToUserPosts, toggleLike, toggleSavePost, getEquippedNft, subscribeToMyNfts, submitReport, selectNft, exchangeNftForCoins, subscribeToUserProfile, subscribeToPinnedGifts, toggleGiftPin, exchangeGift, GIFTS } from '../services/firebase';
import { Button } from '../components/ui/Button';
import { LogOut, Bookmark, Grid, Settings, Upload, ArrowLeft, MessageCircle, UserPlus, UserCheck, ShieldAlert, X, Maximize2, Hexagon, Flag, Crown, Wallet } from 'lucide-react';
import { VerificationBadge } from '../components/ui/VerificationBadge';
import { RichText } from '../components/ui/RichText';
import { PostItem } from './Feed';
import { CommentsModal } from '../components/CommentsModal';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { NFTVisual } from '../components/ui/NFTVisual';
import { ReportModal } from '../components/ReportModal';

interface ProfileProps {
  currentUser: UserProfile;
  viewedUid?: string; 
  onBack?: () => void;
  onOpenChat?: (chatId: string) => void;
  onNavigate?: (page: string) => void;
  onToggleNavbar?: (visible: boolean) => void;
}

export const Profile: React.FC<ProfileProps> = ({ currentUser, viewedUid, onBack, onOpenChat, onNavigate, onToggleNavbar }) => {
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [activeTab, setActiveTab] = useState<'my' | 'saved'>('my');
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [viewingMedia, setViewingMedia] = useState<{ url: string, type: 'image' | 'video' } | null>(null);
  const [equippedNftInstance, setEquippedNftInstance] = useState<NFTInstance | null>(null);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [pinnedGifts, setPinnedGifts] = useState<UserGift[]>([]);
  
  // NFT Modal State
  const [showNftModal, setShowNftModal] = useState(false);
  const [viewedUserNfts, setViewedUserNfts] = useState<NFTInstance[]>([]);

  // Report State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingPost, setReportingPost] = useState<Post | null>(null);

  const isOwnProfile = !viewedUid || viewedUid === currentUser.uid;
  const isAdmin = currentUser.isAdmin;

  const handleEquipNft = async (nftId: string) => {
    if (!isOwnProfile) return;
    try {
      await selectNft(currentUser.uid, nftId);
      // Profile will refresh via currentUser prop if parent re-renders or we can force local update
      setProfileUser(prev => prev ? { ...prev, selectedNftId: nftId } : null);
    } catch (e) {
      console.error(e);
      alert("Ошибка при экипировке");
    }
  };

  const handleExchangeNft = async (nftId: string) => {
    if (!isOwnProfile) return;
    if (window.confirm("Вы уверены, что хотите обменять этот артефакт на SK Coins? Вы получите 80% от его стоимости.")) {
      try {
        await exchangeNftForCoins(currentUser.uid, nftId);
        alert("Артефакт успешно обменян");
      } catch (e) {
        console.error(e);
        alert("Ошибка при обмене");
      }
    }
  };

  useEffect(() => {
    if (onToggleNavbar) {
      onToggleNavbar(!commentPostId);
    }
  }, [commentPostId, onToggleNavbar]);

  useEffect(() => {
    if (isOwnProfile) {
      setProfileUser(currentUser);
      return;
    }
    
    if (viewedUid) {
      const unsubscribe = subscribeToUserProfile(viewedUid, (data) => {
        if (data) setProfileUser(data);
      });
      return () => unsubscribe();
    }
  }, [currentUser, viewedUid, isOwnProfile]);

  useEffect(() => {
    if (profileUser?.selectedNftId) {
        getEquippedNft(profileUser.selectedNftId).then(setEquippedNftInstance);
    } else {
        setEquippedNftInstance(null);
    }
  }, [profileUser?.selectedNftId]);

  // Fetch User Posts
  useEffect(() => {
    if (profileUser?.uid) {
       const unsubscribe = subscribeToUserPosts(profileUser.uid, (posts) => {
           setUserPosts(Array.isArray(posts) ? posts : []);
       });
       return () => unsubscribe();
    }
  }, [profileUser?.uid]);

  // Fetch NFTs when modal is open
  useEffect(() => {
    if (showNftModal && profileUser?.uid) {
        const unsubscribe = subscribeToMyNfts(profileUser.uid, (nfts) => {
            setViewedUserNfts(nfts);
        });
        return () => unsubscribe();
    }
  }, [showNftModal, profileUser?.uid]);

  // Fetch Pinned Gifts
  useEffect(() => {
    if (profileUser?.uid) {
      const unsubscribe = subscribeToPinnedGifts(profileUser.uid, (gifts) => {
        setPinnedGifts(gifts);
      });
      return () => unsubscribe();
    }
  }, [profileUser?.uid]);

  // Fetch Saved Posts
  useEffect(() => {
    if (activeTab === 'saved' && profileUser?.savedPosts?.length) {
      getSavedPosts(profileUser.savedPosts).then(posts => {
         setSavedPosts(Array.isArray(posts) ? posts : []);
      });
    } else {
        setSavedPosts([]);
    }
  }, [activeTab, profileUser]);

  const handleVerificationRequest = async () => {
    if(!profileUser) return;
    try {
      await requestVerification(profileUser.uid, profileUser.handle);
      setRequestSent(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && profileUser) {
      setUploadingAvatar(true);
      try {
        await updateUserAvatar(profileUser.uid, e.target.files[0]);
        // No reload needed, subscription handles it
      } catch (err) {
        console.error("Failed to update avatar", err);
        alert("Ошибка загрузки");
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  const handleLogout = () => {
    auth.signOut();
    // No reload needed, App.tsx handles auth state change
  };

  const toggleFollow = async () => {
    if (!profileUser) return;
    const isFollowing = currentUser.following?.includes?.(profileUser.uid) ?? false;
    try {
      if (isFollowing) {
        await unfollowUser(currentUser.uid, profileUser.uid);
      } else {
        await followUser(currentUser.uid, profileUser.uid);
      }
      // No reload needed, subscription handles it
    } catch (e) { console.error(e); }
  };

  const handleMessage = async () => {
    if (!profileUser || !onOpenChat) return;
    try {
      const chatId = await getOrCreateChat(currentUser.uid, profileUser.uid, profileUser);
      onOpenChat(chatId);
    } catch (e) { console.error(e); }
  };

  const handleAdminDeleteUser = async () => {
    if (!profileUser) return;
    if (window.confirm(`АДМИН ДЕЙСТВИЕ: Вы уверены, что хотите УНИЧТОЖИТЬ аккаунт ${profileUser.handle} и все его данные? Это действие необратимо.`)) {
       try {
         await deleteUserAccount(profileUser.uid);
         alert("Пользователь уничтожен.");
         if (onBack) onBack();
       } catch (e) {
         console.error(e);
         alert("Ошибка удаления пользователя");
       }
    }
  };

  const submitReportUser = async (reason: string) => {
    if (!profileUser) return;
    try {
        await submitReport({
            type: 'user',
            targetId: profileUser.uid,
            reason,
            reportedBy: currentUser.uid,
            targetHandle: profileUser.handle
        });
        alert("Жалоба отправлена.");
        setShowReportModal(false);
    } catch (e) {
        console.error(e);
    }
  };

  const submitReportPost = async (reason: string) => {
      if (!reportingPost) return;
      try {
          await submitReport({
              type: 'post',
              targetId: reportingPost.id,
              reason,
              reportedBy: currentUser.uid,
              targetContent: reportingPost.content.substring(0, 50) + '...'
          });
          alert("Жалоба на пост отправлена.");
          setReportingPost(null);
      } catch (e) {
          console.error(e);
      }
  };

  const handleSave = async (postId: string) => {
    try {
       const isSaved = currentUser.savedPosts?.includes?.(postId) ?? false;
       await toggleSavePost(postId, currentUser.uid, isSaved);
    } catch(e) { console.error(e); }
  };

  if (!profileUser) return <div className="p-8 text-center text-gray-400">Загрузка профиля...</div>;

  if (isSettingsOpen && isOwnProfile) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-8">
           <h1 className="text-2xl font-bold dark:text-white">Настройки</h1>
           <button onClick={() => setIsSettingsOpen(false)} className="text-gray-500">Закрыть</button>
        </div>
        <div className="space-y-6">
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 mb-4 relative">
               {profileUser.photoURL ? (
                 <img src={profileUser.photoURL} className="w-full h-full object-cover" />
               ) : <div className="w-full h-full bg-gray-200" />}
               {uploadingAvatar && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs">Загрузка...</div>}
            </div>
            <label className="cursor-pointer px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full text-sm font-bold hover:bg-gray-800 transition-colors flex items-center gap-2">
               <Upload size={16} />
               Сменить фото
               <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>
          <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
            <Button variant="danger" onClick={handleLogout} className="flex items-center justify-center gap-2">
              <LogOut size={20} /> Выйти из аккаунта
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isFollowingUser = currentUser.following?.includes?.(profileUser.uid) ?? false;

  return (
    <div className="p-6 max-w-xl mx-auto flex flex-col items-center pt-16 pb-24">
      {!isOwnProfile && onBack && (
         <button onClick={onBack} className="fixed top-4 left-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-full z-10 dark:text-white"><ArrowLeft /></button>
      )}

      {isOwnProfile && (
        <div className="absolute top-4 right-4 flex gap-2">
          <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-gray-400 hover:text-black dark:hover:text-white">
            <Settings size={24} />
          </button>
        </div>
      )}

      {!isOwnProfile && (
        <div className="absolute top-4 right-4 flex gap-2">
           <button 
             onClick={() => setShowReportModal(true)}
             className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
             title="Пожаловаться"
           >
              <Flag size={20} />
           </button>
           {isAdmin && (
             <button 
               onClick={handleAdminDeleteUser}
               className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
               title="Admin: Delete User"
             >
                <ShieldAlert size={20} />
             </button>
           )}
        </div>
      )}

      {/* Avatar Container with Animated NFT Effect */}
      <div className="relative w-36 h-36 mb-4 flex items-center justify-center">
        {equippedNftInstance && (
            <>
                {/* Outer Glow - Animation depends on type */}
                <div 
                    className={clsx(
                        "absolute inset-0 rounded-full blur-xl opacity-60",
                        equippedNftInstance.rarity === 'Legendary' || equippedNftInstance.rarity === 'Artifact' 
                            ? "animate-pulse" 
                            : "opacity-40"
                    )}
                    style={{ background: equippedNftInstance.accentColor }}
                />
                
                {/* Background Ring - Spin for Avatar types, Pulse for Lightning */}
                <div 
                    className={clsx(
                        "absolute inset-0 rounded-full overflow-hidden",
                        equippedNftInstance.templateId.includes('avatar') || equippedNftInstance.templateId.includes('neon') 
                            ? "animate-spin-slow" 
                            : ""
                    )}
                    style={{ padding: '4px' }}
                >
                    {/* Reuse Generative Visual for aura */}
                    <NFTVisual templateId={equippedNftInstance.templateId} className="w-full h-full opacity-80 blur-[2px]" />
                </div>
            </>
        )}
        
        <div className={clsx(
            "relative z-10 w-32 h-32 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-lg",
            equippedNftInstance ? "border-4 border-transparent" : "border-4 border-white dark:border-gray-800"
        )}>
          {profileUser.photoURL ? (
            <img src={profileUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-200" />
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-1 justify-center relative z-10">
        <h1 className="text-2xl font-bold text-black">{profileUser.handle}</h1>
        <VerificationBadge isVerified={profileUser.isVerified} handle={profileUser.handle} role={profileUser.role} size={22} />
        {profileUser.role === 'Premium' && (
          <div className="flex flex-col items-center">
            <span className="px-2 py-0.5 bg-black text-white text-[10px] font-black rounded-full uppercase tracking-widest">
              Premium
            </span>
            {profileUser.premiumUntil && (
              <span className="text-[8px] text-gray-400 mt-1 uppercase font-bold">
                До {new Date(profileUser.premiumUntil).toLocaleDateString()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* FIXED: NFT Name Display */}
      {equippedNftInstance && (
          <div 
            className="mb-4 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-widest uppercase shadow-sm border-2 bg-white"
            style={{ 
              borderColor: equippedNftInstance.accentColor,
              color: 'black' 
            }}
          >
              {equippedNftInstance.name}
          </div>
      )}
      
      {/* Stats */}
      <div className="flex items-center gap-12 mb-6 mt-2 relative z-10 dark:text-white">
        <div className="text-center">
          <span className="block font-bold text-lg">{profileUser.followers?.length || 0}</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Подписчики</span>
        </div>
        <div className="w-[1px] h-8 bg-gray-100 dark:bg-gray-800" />
        <div className="text-center">
          <span className="block font-bold text-lg">{profileUser.following?.length || 0}</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Подписки</span>
        </div>
      </div>

      {/* Pinned Gifts Section */}
      {pinnedGifts.length > 0 && (
        <div className="w-full mb-8 px-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Закрепленные подарки</h3>
            <span className="text-[10px] font-bold text-gray-300">{pinnedGifts.length}/3</span>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {pinnedGifts.map(gift => {
              const giftData = GIFTS.find(g => g.id === gift.giftId);
              return (
                <div 
                  key={gift.id}
                  className="flex-shrink-0 w-24 h-24 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center relative group overflow-hidden"
                  style={gift.background ? { background: gift.background } : {}}
                >
                  {gift.background && (
                    <motion.div 
                      className="absolute inset-0 opacity-30"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                      transition={{ duration: 5, repeat: Infinity }}
                      style={{ background: gift.background, filter: 'blur(15px)' }}
                    />
                  )}
                  <motion.div 
                    className="text-3xl mb-1 relative z-10"
                    animate={
                      giftData?.animation === 'bounce' ? { y: [0, -5, 0] } :
                      giftData?.animation === 'launch' ? { y: [0, -10, 0], x: [0, 2, 0] } :
                      giftData?.animation === 'float' ? { y: [0, -3, 0], x: [0, 3, 0] } :
                      {}
                    }
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    {giftData?.icon || "🎁"}
                  </motion.div>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400 relative z-10">
                    {giftData?.name}
                  </span>
                  
                  {isOwnProfile && (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
                      <button 
                        onClick={() => toggleGiftPin(currentUser.uid, gift.id, false)}
                        className="p-1.5 bg-white text-black rounded-full hover:scale-110 transition-transform"
                        title="Открепить"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 mb-8 items-center">
          {!isOwnProfile && (
            <>
               <button 
                 onClick={toggleFollow} 
                 className={clsx("px-6 py-2 rounded-full font-bold transition-all flex items-center gap-2", 
                   isFollowingUser ? "bg-gray-100 dark:bg-gray-800 text-black dark:text-white" : "bg-black dark:bg-white text-white dark:text-black")}
               >
                 {isFollowingUser ? <UserCheck size={18} /> : <UserPlus size={18} />}
                 {isFollowingUser ? "Вы подписаны" : "Подписаться"}
               </button>
               <button onClick={handleMessage} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700">
                 <MessageCircle size={20} />
               </button>
            </>
          )}
          
          {/* NFT Collection Button */}
          <button 
            onClick={() => setShowNftModal(true)} 
            className="p-3 bg-gradient-to-tr from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full text-black dark:text-white hover:scale-105 transition-transform border border-gray-300 dark:border-gray-600 shadow-sm"
            title="NFT Collection"
          >
             <Hexagon size={20} />
          </button>
      </div>

      <div className="flex w-full bg-gray-50 dark:bg-gray-900 rounded-2xl p-1 mb-8">
        <button 
          onClick={() => setActiveTab('my')}
          className={clsx("flex-1 py-2 rounded-xl text-sm font-semibold transition-all", activeTab === 'my' ? "bg-white dark:bg-gray-800 shadow-sm dark:text-white" : "text-gray-400")}
        >
          <div className="flex items-center justify-center gap-2">
             <Grid size={16} /> Профиль
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('saved')}
          className={clsx("flex-1 py-2 rounded-xl text-sm font-semibold transition-all", activeTab === 'saved' ? "bg-white dark:bg-gray-800 shadow-sm dark:text-white" : "text-gray-400")}
        >
          <div className="flex items-center justify-center gap-2">
             <Bookmark size={16} /> Сохраненное
          </div>
        </button>
      </div>

      {activeTab === 'my' && (
        <div className="w-full space-y-4">
          {/* Own Profile Actions */}
          {isOwnProfile && !profileUser.isVerified && !requestSent && (
            <div className="mb-6 flex flex-col gap-3">
               <Button variant="secondary" onClick={handleVerificationRequest}>
                Запросить верификацию
               </Button>
               <button 
                 onClick={() => onNavigate?.('premium')}
                 className="w-full py-4 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-[24px] text-white font-black flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 hover:scale-[1.02] transition-transform"
               >
                 <Crown size={20} /> SQUWIZ PREMIUM
               </button>
            </div>
          )}
          {isOwnProfile && profileUser.isVerified && (
            <div className="mb-6">
               <button 
                 onClick={() => onNavigate?.('premium')}
                 className="w-full py-4 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-[24px] text-white font-black flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 hover:scale-[1.02] transition-transform"
               >
                 <Crown size={20} /> SQUWIZ PREMIUM
               </button>
            </div>
          )}
          {isOwnProfile && requestSent && (
            <div className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-[32px] text-center text-sm text-gray-500 mb-6">
              Заявка на рассмотрении Архитектором.
            </div>
          )}
          {isOwnProfile && profileUser.isAdmin && (
             <div className="mb-6 p-4 bg-black dark:bg-white text-white dark:text-black rounded-[24px] w-full text-center">
                <p className="font-mono text-sm">ARCHITECT ACCESS GRANTED</p>
             </div>
          )}

          {/* User Posts List */}
          {userPosts.length === 0 ? (
             <div className="text-center py-10 text-gray-400">
                <p>Пользователь еще ничего не публиковал.</p>
             </div>
          ) : (
             <div className="space-y-6">
                {userPosts.map(post => (
                   <PostItem 
                      key={post.id}
                      post={post}
                      currentUserUid={currentUser.uid}
                      userProfile={currentUser}
                      onLike={() => toggleLike(post.id, currentUser.uid, !!post.likes?.includes(currentUser.uid))}
                      onSave={() => handleSave(post.id)}
                      onComment={() => setCommentPostId(post.id)} 
                      onViewProfile={(uid) => {
                        if (uid !== profileUser.uid && onNavigate) {
                           // Navigate to that user's profile
                           // In App.tsx handleViewProfile sets viewedProfileUid
                           // But here we are already in Profile.
                           // We should probably call a callback to change viewedUid
                        }
                      }} 
                      onMediaClick={(url, type) => setViewingMedia({ url, type })}
                      onReport={setReportingPost}
                   />
                ))}
             </div>
          )}
        </div>
      )}

      {activeTab === 'saved' && (
        <div className="w-full space-y-4">
           {(!savedPosts || savedPosts.length === 0) ? (
             <p className="text-center text-gray-400 py-10">Нет сохраненных сигналов.</p>
           ) : (
             savedPosts.map(post => (
               <div key={post.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[24px] p-4 shadow-sm text-left">
                  <div className="flex items-center gap-2 mb-2">
                     <span className="font-bold text-xs dark:text-white">{post.authorHandle}</span>
                     <span className="text-xs text-gray-400">{post.createdAt ? formatDistanceToNow(post.createdAt) : ''}</span>
                  </div>
                  <p className="text-sm line-clamp-3 dark:text-white">{post.content}</p>
               </div>
             ))
           )}
        </div>
      )}

      {/* NFT Collection Modal */}
      {showNftModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-none">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto" onClick={() => setShowNftModal(false)} />
              <div className="bg-white dark:bg-gray-900 w-full max-w-lg h-[80vh] sm:rounded-[32px] rounded-t-[32px] flex flex-col pointer-events-auto shadow-2xl relative animate-in slide-in-from-bottom duration-300">
                  <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                      <h2 className="text-xl font-bold dark:text-white">Коллекция NFT</h2>
                      <button onClick={() => setShowNftModal(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-white"><X size={20}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4 no-scrollbar">
                      {viewedUserNfts.length === 0 ? (
                          <div className="col-span-2 text-center text-gray-400 mt-20">
                              <Hexagon size={48} className="mx-auto mb-4 opacity-50" />
                              <p>Артефакты отсутствуют.</p>
                          </div>
                      ) : (
                          viewedUserNfts.map(nft => (
                              <div key={nft.id} className="bg-gray-50 rounded-[24px] overflow-hidden relative shadow-sm flex flex-col">
                                  <div className="h-28 w-full relative">
                                      <NFTVisual templateId={nft.templateId} className="absolute inset-0 z-0" />
                                      <div className="absolute top-2 left-3 text-white/80 font-mono text-xs font-bold bg-black/20 px-1 rounded">#{nft.serialNumber}</div>
                                      {profileUser?.selectedNftId === nft.id && (
                                          <div className="absolute top-2 right-2 bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full">ЭКИПИРОВАНО</div>
                                      )}
                                  </div>
                                  <div className="p-3 flex-1 flex flex-col">
                                      <h4 className="font-bold text-[10px] uppercase truncate text-black mb-2">{nft.name}</h4>
                                      {isOwnProfile && (
                                        <div className="mt-auto flex gap-1">
                                          {profileUser?.selectedNftId !== nft.id && (
                                            <button 
                                              onClick={() => handleEquipNft(nft.id)}
                                              className="flex-1 py-1.5 bg-black text-white text-[9px] font-bold rounded-full uppercase"
                                            >
                                              Надеть
                                            </button>
                                          )}
                                          <button 
                                            onClick={() => handleExchangeNft(nft.id)}
                                            className="p-1.5 bg-gray-200 text-black rounded-full"
                                            title="Обменять на SK"
                                          >
                                            <Wallet size={12} />
                                          </button>
                                        </div>
                                      )}
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* User Report Modal */}
      {showReportModal && (
          <ReportModal 
             type="user" 
             onClose={() => setShowReportModal(false)}
             onSubmit={submitReportUser}
          />
      )}

      {/* Post Report Modal */}
      {reportingPost && (
          <ReportModal 
             type="post"
             onClose={() => setReportingPost(null)}
             onSubmit={submitReportPost}
          />
      )}

      {viewingMedia && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center animate-in fade-in duration-200">
          <button 
            onClick={() => setViewingMedia(null)}
            className="absolute top-6 right-6 p-3 bg-white/10 text-white rounded-full backdrop-blur-md hover:bg-white/20 z-50"
          >
            <X size={24} />
          </button>
          
          <div 
            className="w-full h-full p-2 flex items-center justify-center cursor-zoom-out"
            onClick={() => setViewingMedia(null)}
          >
            {viewingMedia.type === 'video' ? (
              <video 
                src={viewingMedia.url} 
                controls 
                autoPlay 
                className="max-h-full max-w-full rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()} 
              />
            ) : (
              <img 
                src={viewingMedia.url} 
                alt="Full screen" 
                className="max-h-full max-w-full object-contain rounded-lg shadow-2xl" 
              />
            )}
          </div>
        </div>
      )}

      {commentPostId && (
        <CommentsModal 
          postId={commentPostId} 
          onClose={() => setCommentPostId(null)} 
          currentUserUid={currentUser.uid} 
          userHandle={currentUser.handle}
          userPhoto={currentUser.photoURL}
        />
      )}
    </div>
  );
};