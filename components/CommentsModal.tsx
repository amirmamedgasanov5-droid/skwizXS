import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageCircle } from 'lucide-react';
import { db, auth, subscribeToComments, addComment } from '../services/firebase';
import { Comment, UserProfile } from '../types';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

interface CommentsModalProps {
  postId: string;
  onClose: () => void;
  currentUserUid: string;
  userHandle: string;
  userPhoto?: string;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({ 
  postId, 
  onClose, 
  currentUserUid,
  userHandle,
  userPhoto
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToComments(postId, (data) => {
      setComments(data.sort((a, b) => b.createdAt - a.createdAt));
    });
    return () => unsubscribe();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || loading) return;

    setLoading(true);
    try {
      await addComment(postId, {
        authorUid: currentUserUid,
        authorHandle: userHandle,
        authorPhotoURL: userPhoto || '',
        text: newComment.trim()
      });
      setNewComment('');
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-[32px] h-[80vh] sm:h-[600px] flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-vk-blue">
              <MessageCircle size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg">Комментарии</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{comments.length} ответов</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-black transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          {comments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
              <MessageCircle size={48} />
              <p className="font-medium">Пока нет комментариев.<br/>Будьте первым!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-4 group">
                <img 
                  src={comment.authorPhotoURL || `https://ui-avatars.com/api/?name=${comment.authorHandle.replace('@', '')}&background=random`} 
                  alt={comment.authorHandle}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-50"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm hover:text-vk-blue cursor-pointer transition-colors">
                      {comment.authorHandle}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-2xl rounded-tl-none p-4 text-sm text-gray-700 leading-relaxed">
                    {comment.text}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="p-6 bg-white border-t border-gray-100">
          <form onSubmit={handleSubmit} className="relative">
            <input 
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Напишите комментарий..."
              className="w-full bg-gray-100 border-none rounded-2xl py-4 pl-6 pr-14 text-sm focus:ring-2 focus:ring-vk-blue/20 outline-none transition-all"
            />
            <button 
              type="submit"
              disabled={!newComment.trim() || loading}
              className={clsx(
                "absolute right-2 top-2 w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                newComment.trim() ? "bg-vk-blue text-white shadow-lg shadow-blue-500/30 scale-100" : "bg-gray-200 text-gray-400 scale-90 opacity-50"
              )}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
