import React, { useEffect, useState, useRef } from 'react';
import { 
  subscribeToFeed, 
  subscribeToPromotedPosts,
  toggleLike, 
  toggleSavePost, 
  getUserProfile, 
  subscribeToUserProfile, 
  addComment, 
  subscribeToComments, 
  deletePost,
  updatePost,
  repostPost,
  promotePost,
  processGiveawayWinner,
  voteInPoll,
  submitReport,
  followUser,
  unfollowUser,
  auth
} from '../services/firebase';
import { Post, UserProfile, Comment, NFTTemplate, NFTInstance } from '../types';
import { Heart, MessageCircle, Bookmark, X, Send, User, Flame, Maximize2, Brain, MoreHorizontal, Trash2, Edit2, Repeat, Gift, Flag, Rocket, Zap, Trophy, Megaphone, Eye } from 'lucide-react';
import { VerificationBadge } from '../components/ui/VerificationBadge';
import { RichText } from '../components/ui/RichText';
import { CommentsModal } from '../components/CommentsModal';
import clsx from 'clsx';
import { Logo } from '../components/ui/Logo';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAppContext } from '../contexts/AppContext';
import { NFTVisual } from '../components/ui/NFTVisual';
import { ReportModal } from '../components/ReportModal';

// --- Types ---
interface FeedProps {
  currentUserUid: string;
  onNavigate: (page: string) => void;
  onViewProfile: (uid: string) => void;
  onToggleNavbar?: (visible: boolean) => void;
}

// --- Sub Components ---

const PromoteModal: React.FC<{
  post: Post;
  user: UserProfile;
  onClose: () => void;
}> = ({ post, user, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState<'1h' | '24h'>('1h');
  
  const cost = duration === '1h' ? 10 : 100;
  const hours = duration === '1h' ? 1 : 24;

  const handlePromote = async () => {
     if ((user.walletBalance || 0) < cost) {
         alert("Недостаточно SK Coins.");
         return;
     }
     
     // Confirmation is handled by the UI button mostly, but good to double check
     setLoading(true);
     try {
         await promotePost(post.id, user.uid, hours, cost);
         alert("Premium Signal активирован!");
         onClose();
     } catch (e: any) {
         console.error(e);
         alert(e.message || "Ошибка");
     } finally {
         setLoading(false);
     }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
       <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
       <div className="bg-white dark:bg-black border border-gray-100 dark:border-gray-800 w-full max-w-sm rounded-[32px] p-6 relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
           <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-black dark:bg-white rounded-full flex items-center justify-center text-white dark:text-black shadow-lg">
                       <Zap size={20} fill="currentColor" />
                   </div>
                   <div>
                       <h2 className="text-xl font-bold dark:text-white leading-none">Premium</h2>
                       <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">Signal</span>
                   </div>
               </div>
               <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-white"><X size={20}/></button>
           </div>
           
           <p className="text-sm text-gray-500 mb-8 leading-relaxed">
               Поместите ваш сигнал в зону повышенного внимания. Выберите время доминирования.
           </p>

           <div className="space-y-4 mb-8">
               <div 
                   onClick={() => setDuration('1h')}
                   className={clsx(
                       "flex items-center justify-between p-5 rounded-[24px] border-2 cursor-pointer transition-all",
                       duration === '1h' ? "border-black dark:border-white bg-gray-50 dark:bg-gray-900" : "border-transparent bg-gray-100 dark:bg-gray-800"
                   )}
               >
                   <div>
                       <p className="font-bold text-lg dark:text-white">1 Час</p>
                       <p className="text-xs text-gray-500">Быстрый импульс</p>
                   </div>
                   <div className="text-right">
                       <span className="block font-bold text-xl dark:text-white">10 SK</span>
                   </div>
               </div>

               <div 
                   onClick={() => setDuration('24h')}
                   className={clsx(
                       "flex items-center justify-between p-5 rounded-[24px] border-2 cursor-pointer transition-all relative overflow-hidden",
                       duration === '24h' ? "border-black dark:border-white bg-gray-50 dark:bg-gray-900" : "border-transparent bg-gray-100 dark:bg-gray-800"
                   )}
               >
                   <div className="relative z-10">
                       <p className="font-bold text-lg dark:text-white">24 Часа</p>
                       <p className="text-xs text-green-600 font-bold uppercase tracking-wide">Выгода 58%</p>
                   </div>
                   <div className="text-right relative z-10">
                        <span className="block font-bold text-xl dark:text-white">100 SK</span>
                   </div>
               </div>
           </div>

           <div className="flex items-center justify-between mb-4 px-2">
               <span className="text-xs font-bold text-gray-400 uppercase">Доступно</span>
               <span className="font-bold dark:text-white">{user.walletBalance || 0} SK</span>
           </div>

           <button 
               onClick={handlePromote}
               disabled={loading || (user.walletBalance || 0) < cost}
               className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-[24px] font-bold text-lg disabled:opacity-50 hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
           >
               {loading ? "Активация..." : `Продвинуть за ${cost} SK`}
           </button>
       </div>
    </div>
  );
};

export const PostItem: React.FC<{
  post: Post;
  currentUserUid: string;
  userProfile: UserProfile | null;
  onLike: () => void;
  onSave: () => void;
  onComment: () => void;
  onViewProfile: (uid: string) => void;
  onMediaClick: (url: string, type: 'image' | 'video') => void;
  onReport: (post: Post) => void;
  onPromote?: (post: Post) => void;
  onToggleFollow: (uid: string, isFollowing: boolean) => void;
}> = ({ post, currentUserUid, userProfile, onLike, onSave, onComment, onViewProfile, onMediaClick, onReport, onPromote, onToggleFollow }) => {
   const displayHandle = post.isRepost ? post.originalAuthorHandle : post.authorHandle;
   const displayPhoto = post.isRepost ? post.originalAuthorPhotoURL : post.authorPhotoURL;
   const displayUid = post.isRepost ? (post.originalAuthorUid || post.authorUid) : post.authorUid;

   const isLiked = post.likes?.includes?.(currentUserUid) ?? false;
   const isSaved = userProfile?.savedPosts?.includes?.(post.id) ?? false;
   const isFollowing = userProfile?.following?.includes?.(displayUid) ?? false;
   const mediaList = post.mediaURLs || (post.mediaURL ? [post.mediaURL] : []);
   
   const [showMenu, setShowMenu] = useState(false);
   const [isEditing, setIsEditing] = useState(false);
   const [editContent, setEditContent] = useState(post.content);
   const [saving, setSaving] = useState(false);
   const [timeLeft, setTimeLeft] = useState<string>('');
   const [isExpired, setIsExpired] = useState(false);

   const isOwner = post.authorUid === currentUserUid;
   const isAdmin = userProfile?.role === 'Admin';
   const isGiveaway = post.type === 'giveaway';
   const isPromoted = post.isPromoted;
   const isAd = post.type === 'ad';
   const isPoll = post.type === 'poll';
   const canDelete = isOwner || isAdmin;

   const authorVerified = post.authorVerified ?? false;

   useEffect(() => {
       if (!isGiveaway || !post.giveawayEndsAt) return;

       const checkTime = () => {
           const now = Date.now();
           const diff = post.giveawayEndsAt! - now;
           if (diff <= 0) {
               setTimeLeft('Завершен');
               setIsExpired(true);
               
               if (!post.winnerUid && !post.isGiveawayProcessed) {
                   processGiveawayWinner(post.id).catch(console.error);
               }
           } else {
               const hours = Math.floor(diff / (1000 * 60 * 60));
               const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
               setTimeLeft(`${hours}ч ${mins}м`);
           }
       };

       checkTime();
       const interval = setInterval(checkTime, 60000);
       return () => clearInterval(interval);
   }, [isGiveaway, post.giveawayEndsAt, post.winnerUid, post.id, post.isGiveawayProcessed]);

   const handleUpdate = async () => {
     if (editContent.trim() === post.content) { setIsEditing(false); return; }
     setSaving(true);
     try { await updatePost(post.id, editContent); setIsEditing(false); } 
     catch (e) { console.error(e); } 
     finally { setSaving(false); }
   };

   const handleDelete = async () => {
     if (window.confirm("Удалить этот сигнал навсегда?")) {
       try { await deletePost(post.id); } catch (e: any) { alert(e.message); }
     }
   };

   const handleRepost = async (e: React.MouseEvent) => {
     e.stopPropagation();
     if (!userProfile) return;
     if (window.confirm("Сделать репост этого сигнала?")) {
       try { await repostPost(post, userProfile); alert("Репост опубликован!"); } 
       catch (e) { console.error("Repost failed", e); }
     }
   };

   const handleVote = async (index: number) => {
     if (!userProfile) return;
     try {
       await voteInPoll(post.id, index, userProfile.uid);
     } catch (e) {
       console.error(e);
     }
   };

    return (
     <div className={clsx("bg-white border-b border-gray-100 p-4 relative group/post transition-all hover:bg-gray-50/50", 
         isPromoted ? "bg-blue-50/30" : ""
     )}>
       <div className="flex gap-3">
          {/* Left: Avatar */}
          <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 cursor-pointer" onClick={() => onViewProfile(displayUid)}>
                  {displayPhoto ? <img src={displayPhoto} alt={displayHandle} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-200"><User size={20} className="text-gray-400"/></div>}
              </div>
          </div>

          {/* Right: Content */}
          <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1 min-w-0">
                      <div className="flex items-center gap-1 cursor-pointer overflow-hidden" onClick={() => onViewProfile(displayUid)}>
                          <span className="font-bold text-black truncate hover:underline">{displayHandle}</span>
                          <VerificationBadge isVerified={authorVerified} handle={displayHandle} size={14} />
                          <span className="text-gray-500 text-sm truncate">@{displayHandle}</span>
                      </div>
                      <span className="text-gray-500 text-sm">·</span>
                      <span className="text-gray-500 text-sm truncate">
                          {post.createdAt ? formatDistanceToNow(post.createdAt, { addSuffix: false, locale: ru }) : ''}
                      </span>
                      {displayUid !== currentUserUid && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onToggleFollow(displayUid, isFollowing); }}
                          className={clsx(
                            "ml-2 text-[10px] font-bold uppercase tracking-widest transition-all hover:opacity-70 active:scale-95",
                            isFollowing ? "text-gray-400" : "text-vk-blue"
                          )}
                        >
                          {isFollowing ? 'Подписан' : 'Подписаться'}
                        </button>
                      )}
                  </div>

                  <div className="relative">
                      <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} className="p-2 text-gray-400 hover:text-black rounded-full hover:bg-gray-100 transition-colors">
                        <MoreHorizontal size={18} />
                      </button>
                      {showMenu && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
                          <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 py-2 w-48 z-20 animate-in fade-in zoom-in-95 duration-200">
                             {isOwner && onPromote && !post.isRepost && !isGiveaway && <button onClick={(e) => { e.stopPropagation(); onPromote(post); setShowMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm font-medium"><Rocket size={16} /> Продвигать</button>}
                             {isOwner && !post.isRepost && <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); setShowMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm font-medium"><Edit2 size={16} /> Редактировать</button>}
                             {(canDelete) && <button onClick={(e) => { e.stopPropagation(); handleDelete(); setShowMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-500 flex items-center gap-3 text-sm font-medium"><Trash2 size={16} /> Удалить</button>}
                             {!isOwner && (
                                 <button onClick={(e) => { e.stopPropagation(); onReport(post); setShowMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm font-medium">
                                    <Flag size={16} /> Пожаловаться
                                 </button>
                             )}
                          </div>
                        </>
                      )}
                  </div>
              </div>

              {/* Repost info */}
              {post.isRepost && (
                 <div className="flex items-center gap-2 mb-2 text-gray-500 text-xs font-bold">
                    <Repeat size={12} />
                    <span>{post.authorHandle === userProfile?.handle ? 'Вы репостнули' : `@${post.authorHandle} репостнул(а)`}</span>
                 </div>
              )}

              {/* Special Badges */}
              {isPromoted && (
                  <div className="flex items-center gap-2 mb-2 bg-blue-50 text-blue-600 py-1 px-2 rounded-lg w-max">
                      <Zap size={10} fill="currentColor" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Premium Signal</span>
                  </div>
              )}

              {isAd && (
                  <div className="flex items-center gap-2 mb-2 bg-blue-50 text-blue-600 py-1 px-2 rounded-lg w-max">
                      <Megaphone size={10} fill="currentColor" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Реклама</span>
                  </div>
              )}

              {/* Giveaway */}
              {isGiveaway && (
                  <div className="mb-3 bg-yellow-50 border border-yellow-100 rounded-xl p-3 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600">
                              <Gift size={16} />
                          </div>
                          <div>
                              <p className="text-[10px] font-bold uppercase text-yellow-700 tracking-wide leading-none">Giveaway</p>
                              <p className="text-sm font-bold text-black">{post.prizePool} SK</p>
                          </div>
                      </div>
                      <div className="text-right">
                          <p className="text-[10px] text-gray-500 uppercase leading-none mb-1">До конца</p>
                          <p className="font-mono font-bold text-xs">{timeLeft}</p>
                      </div>
                  </div>
              )}

              {/* Winner */}
              {post.winnerUid && (
                  <div className="mb-3 bg-green-50 border border-green-100 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                          <Trophy size={16} />
                      </div>
                      <div>
                          <p className="text-[10px] font-bold uppercase text-green-700 leading-none">Победитель</p>
                          <p className="text-sm font-bold text-black cursor-pointer hover:underline" onClick={() => onViewProfile(post.winnerUid!)}>
                              {post.winnerHandle}
                          </p>
                      </div>
                  </div>
              )}

              {/* Text Content */}
              {isEditing ? (
                <div className="mb-3">
                   <textarea className="w-full p-3 bg-gray-50 rounded-xl resize-none outline-none focus:ring-1 focus:ring-black min-h-[80px] text-sm" value={editContent} onChange={e => setEditContent(e.target.value)} onClick={e => e.stopPropagation()}/>
                   <div className="flex gap-2 mt-2 justify-end">
                      <button onClick={(e) => { e.stopPropagation(); setIsEditing(false); }} className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-bold hover:bg-gray-200">Отмена</button>
                      <button onClick={(e) => { e.stopPropagation(); handleUpdate(); }} disabled={saving || !editContent.trim()} className="px-3 py-1 bg-black text-white rounded-lg text-xs font-bold hover:bg-gray-800 disabled:opacity-50">{saving ? '...' : 'Сохранить'}</button>
                   </div>
                </div>
              ) : (
                <div className="mb-3 text-black whitespace-pre-wrap text-[15px] leading-normal">
                   <RichText text={post.content} onViewProfile={onViewProfile} />
                   
                   {isPoll && post.poll && (
                     <div className="mt-3 space-y-2">
                       {post.poll.options.map((opt, idx) => {
                         const totalVotes = post.poll!.options.reduce((acc, o) => acc + o.votes.length, 0);
                         const percentage = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                         const hasVoted = opt.votes.includes(currentUserUid);
                         
                         return (
                           <button 
                             key={idx}
                             onClick={(e) => { e.stopPropagation(); handleVote(idx); }}
                             className="w-full relative h-9 rounded-lg overflow-hidden bg-gray-100 border border-transparent transition-all active:scale-[0.98]"
                           >
                             <div 
                               className={clsx(
                                 "absolute inset-y-0 left-0 transition-all duration-500",
                                 hasVoted ? "bg-black opacity-10" : "bg-gray-300 opacity-10"
                               )}
                               style={{ width: `${percentage}%` }}
                             />
                             <div className="absolute inset-0 flex items-center justify-between px-3">
                               <span className={clsx("text-sm font-medium", hasVoted ? "text-black" : "text-gray-700")}>
                                 {opt.text}
                               </span>
                               <span className="text-xs font-bold text-gray-500">{percentage}%</span>
                             </div>
                           </button>
                         );
                       })}
                     </div>
                   )}

                   {isAd && post.adLink && (
                     <a 
                       href={post.adLink} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="mt-3 block p-2 bg-black text-white rounded-lg text-xs font-bold text-center hover:bg-gray-800 transition-colors"
                       onClick={(e) => e.stopPropagation()}
                     >
                       Перейти
                     </a>
                   )}
                </div>
              )}

              {/* Media */}
              {mediaList.length > 0 && (
                <div className="flex overflow-x-auto snap-x snap-mandatory gap-2 pb-2 no-scrollbar mb-3 rounded-2xl overflow-hidden border border-gray-100">
                  {mediaList.map((url, index) => (
                     <div key={index} className="flex-shrink-0 w-full rounded-xl overflow-hidden bg-gray-50 relative flex items-center justify-center cursor-zoom-in group snap-center" onClick={(e) => { e.stopPropagation(); onMediaClick(url, post.mediaType || 'image'); }}>
                       {post.mediaType === 'video' ? (
                         <div className="relative w-full h-full flex items-center justify-center">
                            <video src={url} className="w-full max-h-80 object-contain" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/5 group-hover:bg-black/10 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg"><Maximize2 size={18} className="text-black"/></div>
                            </div>
                         </div>
                       ) : <img src={url} alt={`Content ${index}`} className="w-full h-auto max-h-80 object-cover"/>}
                     </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between max-w-xs">
                  <button onClick={(e) => { e.stopPropagation(); onComment(); }} className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors group">
                    <div className="p-2 group-hover:bg-blue-50 rounded-full transition-colors">
                        <MessageCircle size={18} />
                    </div>
                    <span className="text-xs font-medium">{post.commentsCount || 0}</span>
                  </button>

                  <button onClick={handleRepost} className="flex items-center gap-2 text-gray-500 hover:text-green-500 transition-colors group">
                    <div className="p-2 group-hover:bg-green-50 rounded-full transition-colors">
                        <Repeat size={18} />
                    </div>
                  </button>

                  <button onClick={(e) => { e.stopPropagation(); onLike(); }} className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors group">
                    <div className="p-2 group-hover:bg-red-50 rounded-full transition-colors">
                        <Heart size={18} className={clsx("transition-all", isLiked && "fill-red-500 text-red-500")} />
                    </div>
                    <span className={clsx("text-xs font-medium", isLiked && "text-red-500")}>{post.likes?.length || 0}</span>
                  </button>

                  <button onClick={(e) => { e.stopPropagation(); onSave(); }} className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors group">
                    <div className="p-2 group-hover:bg-blue-50 rounded-full transition-colors">
                        <Bookmark size={18} className={clsx("transition-all", isSaved && "fill-blue-500 text-blue-500")} />
                    </div>
                  </button>
              </div>
          </div>
       </div>
    </div>
  );
};

// --- Components ---

export const Feed: React.FC<FeedProps> = ({ currentUserUid, onNavigate, onViewProfile, onToggleNavbar }) => {
  const [activeTab, setActiveTab] = useState<'popular' | 'following'>('popular');
  const [posts, setPosts] = useState<Post[]>([]);
  const [promotedPosts, setPromotedPosts] = useState<Post[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  // Modals state
  const [promotePostData, setPromotePostData] = useState<Post | null>(null);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [viewingMedia, setViewingMedia] = useState<{ url: string, type: 'image' | 'video' } | null>(null);
  
  // Report state
  const [reportPost, setReportPost] = useState<Post | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    if (onToggleNavbar) {
      onToggleNavbar(!commentPostId);
    }
  }, [commentPostId, onToggleNavbar]);

  useEffect(() => {
    getUserProfile(currentUserUid).then(setCurrentUser);
    const unsubUser = subscribeToUserProfile(currentUserUid, setCurrentUser);
    return () => unsubUser();
  }, [currentUserUid]);

  useEffect(() => {
    // Subscribe to promoted posts
    const unsubPromoted = subscribeToPromotedPosts((data) => {
        setPromotedPosts(Array.isArray(data) ? data : []);
    });
    return () => unsubPromoted();
  }, []);

  useEffect(() => {
    let unsubFeed: () => void;
    if (currentUser) {
        setIsInitialLoading(true);
        unsubFeed = subscribeToFeed(activeTab, currentUser.following, (data) => {
            const postsData = Array.isArray(data) ? data : [];
            setPosts(postsData);
            
            // If posts are empty, keep loading for 7 seconds as requested
            if (postsData.length === 0) {
              setTimeout(() => {
                setIsInitialLoading(false);
              }, 7000);
            } else {
              setIsInitialLoading(false);
            }
        });
    }
    return () => { if(unsubFeed) unsubFeed(); };
  }, [activeTab, currentUser?.following]);

  // Handler for reporting
  const handleSubmitReport = async (reason: string) => {
      if (!reportPost) return;
      try {
          await submitReport({
              type: 'post',
              targetId: reportPost.id,
              reason,
              reportedBy: currentUserUid,
              targetContent: reportPost.content.substring(0, 50) + '...'
          });
          alert("Жалоба отправлена.");
          setReportPost(null);
      } catch (e) {
          console.error(e);
      }
  };

  const handleToggleFollow = async (targetUid: string, isFollowing: boolean) => {
    try {
      if (isFollowing) {
        await unfollowUser(currentUserUid, targetUid);
      } else {
        await followUser(currentUserUid, targetUid);
      }
    } catch (e) {
      console.error("Follow toggle failed", e);
    }
  };

  if (!currentUser) return <div className="p-8 text-center text-gray-400">Loading...</div>;

   return (
    <div className="pb-32 pt-6 px-6 max-w-2xl mx-auto min-h-screen relative bg-[#F5F5F7]">
       {/* Tabs */}
       <div className="flex bg-white/50 backdrop-blur-md rounded-full p-1 mb-8 shadow-sm w-fit mx-auto">
           <button 
             onClick={() => setActiveTab('popular')}
             className={clsx("px-6 py-2 rounded-full text-xs font-bold transition-all", activeTab === 'popular' ? "bg-black text-white shadow-md" : "text-gray-400 hover:text-black")}
           >
               Popular
           </button>
           <button 
             onClick={() => setActiveTab('following')}
             className={clsx("px-6 py-2 rounded-full text-xs font-bold transition-all", activeTab === 'following' ? "bg-black text-white shadow-md" : "text-gray-400 hover:text-black")}
           >
               Following
           </button>
       </div>

       {/* Promoted Section */}
       {promotedPosts.length > 0 && activeTab === 'popular' && (
           <div className="mb-8 space-y-4">
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2 flex items-center gap-1">
                   <Flame size={12} className="text-orange-500" /> Premium Signals
               </h3>
               {promotedPosts.map(post => (
                   <PostItem 
                     key={`promo-${post.id}`} 
                     post={post} 
                     currentUserUid={currentUserUid} 
                     userProfile={currentUser}
                     onLike={() => toggleLike(post.id, currentUserUid, !!post.likes?.includes(currentUserUid))}
                     onSave={() => toggleSavePost(post.id, currentUserUid, !!currentUser.savedPosts?.includes(post.id))}
                     onComment={() => setCommentPostId(post.id)}
                     onViewProfile={onViewProfile}
                     onMediaClick={(url, type) => setViewingMedia({ url, type })}
                     onReport={setReportPost}
                     onPromote={setPromotePostData}
                     onToggleFollow={handleToggleFollow}
                   />
               ))}
               <div className="border-b border-gray-100 dark:border-gray-800 my-4" />
           </div>
       )}

       {/* Main Feed */}
       <div className="space-y-6">
           {isInitialLoading ? (
               <div className="flex flex-col items-center justify-center py-20 space-y-4">
                   <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
                   <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 animate-pulse">Загрузка сигналов...</p>
               </div>
           ) : posts.length === 0 ? (
               <div className="text-center text-gray-400 py-10">
                   <p>Здесь пока тихо.</p>
                   {activeTab === 'following' && <p className="text-sm mt-2 text-blue-500 cursor-pointer" onClick={() => onNavigate('search')}>Найти людей</p>}
               </div>
           ) : (
               posts.map(post => (
                   <PostItem 
                     key={post.id} 
                     post={post} 
                     currentUserUid={currentUserUid} 
                     userProfile={currentUser}
                     onLike={() => toggleLike(post.id, currentUserUid, !!post.likes?.includes(currentUserUid))}
                     onSave={() => toggleSavePost(post.id, currentUserUid, !!currentUser.savedPosts?.includes(post.id))}
                     onComment={() => setCommentPostId(post.id)}
                     onViewProfile={onViewProfile}
                     onMediaClick={(url, type) => setViewingMedia({ url, type })}
                     onReport={setReportPost}
                     onPromote={setPromotePostData}
                     onToggleFollow={handleToggleFollow}
                   />
               ))
           )}
       </div>

       {/* Modals */}
       {promotePostData && (
           <PromoteModal 
              post={promotePostData} 
              user={currentUser} 
              onClose={() => setPromotePostData(null)} 
           />
       )}

       {commentPostId && (
           <CommentsModal 
              postId={commentPostId} 
              currentUserUid={currentUserUid} 
              userHandle={currentUser.handle} 
              userPhoto={currentUser.photoURL}
              onClose={() => setCommentPostId(null)} 
           />
       )}

       {reportPost && (
           <ReportModal 
               type="post"
               onClose={() => setReportPost(null)}
               onSubmit={handleSubmitReport}
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
    </div>
  );
};