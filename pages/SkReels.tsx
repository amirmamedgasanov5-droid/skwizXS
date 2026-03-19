import React, { useEffect, useState } from 'react';
import { subscribeToSkReels, toggleLike } from '../services/firebase';
import { Post } from '../types';
import { Heart, MessageCircle } from 'lucide-react';
import { auth } from '../services/firebase';

interface SkReelsProps {
  onViewProfile: (uid: string) => void;
}

export const SkReels: React.FC<SkReelsProps> = ({ onViewProfile }) => {
  const [reels, setReels] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToSkReels((data) => {
      setReels(Array.isArray(data) ? data : []);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="h-screen bg-black text-white flex items-center justify-center">Загрузка SkReels...</div>;
  }

  if (reels.length === 0) {
     return <div className="h-screen bg-black text-white flex items-center justify-center">Нет SkReels. Создайте первый!</div>;
  }

  return (
    <div className="h-screen w-full bg-black overflow-y-scroll snap-y snap-mandatory no-scrollbar pb-20">
      {reels.map((reel) => (
        <ReelItem key={reel.id} post={reel} currentUserUid={auth.currentUser?.uid || ''} onViewProfile={onViewProfile} />
      ))}
    </div>
  );
};

const ReelItem: React.FC<{ post: Post; currentUserUid: string; onViewProfile: (uid: string) => void }> = ({ post, currentUserUid, onViewProfile }) => {
  // SAFEGUARD: ?.includes with boolean fallback
  const isLiked = post.likes?.includes?.(currentUserUid) ?? false;

  return (
    <div className="relative h-full w-full snap-start flex items-center justify-center bg-black">
      {post.mediaURL ? (
        <video 
           src={post.mediaURL} 
           className="w-full h-full object-cover" 
           loop 
           muted={false}
           playsInline
           controls={false}
           onClick={(e) => {
             const v = e.currentTarget;
             v.paused ? v.play() : v.pause();
           }}
           autoPlay
        />
      ) : (
        <div className="text-white">Video failed to load</div>
      )}
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 pointer-events-none" />
      
      <div className="absolute bottom-24 left-4 right-4 text-white z-10 pointer-events-auto">
         <div className="flex items-center gap-3 mb-4 cursor-pointer" onClick={() => onViewProfile(post.authorUid)}>
             <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
               {post.authorPhotoURL ? <img src={post.authorPhotoURL} className="w-full h-full object-cover" /> : <div className="bg-gray-500 w-full h-full" />}
             </div>
             <span className="font-bold">{post.authorHandle}</span>
         </div>
         <p className="mb-4 text-sm opacity-90">{post.content}</p>
      </div>

      <div className="absolute bottom-24 right-4 flex flex-col gap-6 items-center z-20 pointer-events-auto">
         <button onClick={() => toggleLike(post.id, currentUserUid, isLiked)} className="flex flex-col items-center gap-1">
            <Heart size={32} className={isLiked ? "fill-red-500 text-red-500" : "text-white"} />
            <span className="text-white text-xs font-bold">{post.likes?.length ?? 0}</span>
         </button>
         <button className="flex flex-col items-center gap-1">
            <MessageCircle size={32} className="text-white" />
            <span className="text-white text-xs font-bold">{post.commentsCount ?? 0}</span>
         </button>
      </div>
    </div>
  );
};