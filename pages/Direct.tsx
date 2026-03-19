import React, { useEffect, useState, useRef } from 'react';
import { subscribeToChats, subscribeToDirectMessages, sendDirectMessage, markChatAsRead, uploadFile, NFT_TEMPLATES, getUserProfile, getChat, sendGift, GIFTS } from '../services/firebase';
import { Chat, DirectMessage, UserProfile } from '../types';
import { auth } from '../services/firebase';
import { MessageCircle, Send, ArrowLeft, Mic, Square, Play, Pause, Trash2, Gift as GiftIcon, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';

interface DirectProps {
  openedChatId?: string | null;
  onCloseChat: () => void;
  onNavigate?: (page: string) => void;
}

export const Direct: React.FC<DirectProps> = ({ openedChatId, onCloseChat, onNavigate }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToChats(user.uid, (data) => setChats(Array.isArray(data) ? data : []));
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (openedChatId) {
      const found = chats.find(c => c.id === openedChatId);
      if (found) {
        setActiveChat(found);
      } else {
        getChat(openedChatId).then(chat => {
          if (chat) setActiveChat(chat);
        });
      }
    }
  }, [openedChatId, chats]);

  if (!user) return null;

  if (activeChat) {
    return <ChatView chat={activeChat} currentUid={user.uid} onBack={() => { setActiveChat(null); onCloseChat(); }} />;
  }

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-black">Мессенджер</h1>
        <button 
          onClick={() => onNavigate && onNavigate('search')}
          className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          title="Начать новый чат"
        >
          <MessageCircle size={20} />
        </button>
      </div>
      <div className="space-y-2">
        {chats.length === 0 ? (
          <div className="text-center text-vk-secondary mt-10">
            <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-sm">Нет сообщений.</p>
            <p className="text-xs">Найдите пользователя и напишите ему.</p>
          </div>
        ) : (
          chats.map(chat => {
            // SAFEGUARD: Use ?.find and ?. access
            const otherUid = chat.participants?.find?.(p => p !== user.uid) || user.uid;
            const details = chat.participantDetails?.[otherUid];
            const unread = chat.unreadCounts?.[user.uid] ?? 0;
            
            return (
               <div key={chat.id} onClick={() => setActiveChat(chat)} className="flex items-center gap-3 p-3 bg-white border border-vk-border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors shadow-sm">
                  <div className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden relative border border-vk-border">
                     {details?.photoURL ? (
                       <img src={details.photoURL} className="w-full h-full object-cover" />
                     ) : <div className="w-full h-full bg-gray-200" />}
                  </div>
                  <div className="flex-1 min-w-0">
                     <div className="flex justify-between items-center">
                        <h3 className={clsx("font-bold text-sm", unread > 0 ? "text-vk-blue" : "text-black")}>{details?.handle || 'User'}</h3>
                        {unread > 0 && <span className="bg-vk-blue text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unread}</span>}
                     </div>
                     <p className={clsx("text-xs truncate", unread > 0 ? "text-black font-bold" : "text-vk-secondary")}>
                        {chat.lastMessage || 'Начните общение'}
                     </p>
                  </div>
                  {chat.lastMessageTime && (
                    <span className="text-[10px] text-vk-secondary whitespace-nowrap self-start">
                       {formatDistanceToNow(chat.lastMessageTime, { addSuffix: false })}
                    </span>
                  )}
               </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const ChatView: React.FC<{ chat: Chat, currentUid: string, onBack: () => void }> = ({ chat, currentUid, onBack }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  const receiverUid = chat.participants?.find?.(p => p !== currentUid) || currentUid;
  const receiverDetails = chat.participantDetails?.[receiverUid];

  useEffect(() => {
    getUserProfile(currentUid).then(setCurrentUserProfile);
    markChatAsRead(chat.id, currentUid);
    const unsubscribe = subscribeToDirectMessages(chat.id, (msgs) => setMessages(Array.isArray(msgs) ? msgs : []));
    return () => unsubscribe();
  }, [chat.id, currentUid]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
        setAudioBlob(blob);
      };
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (e) {
      console.error(e);
      alert("Микрофон недоступен");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const handleSend = async (giftId?: string, userGiftId?: string, background?: string) => {
    if (!text.trim() && !audioBlob && !giftId) return;
    
    let audioURL = undefined;
    if (audioBlob) {
      const file = new File([audioBlob], `voice_${Date.now()}.ogg`, { type: 'audio/ogg' });
      audioURL = await uploadFile(file, `chats/${chat.id}/voice`);
    }

    await sendDirectMessage(chat.id, currentUid, receiverUid, text || undefined, audioURL, giftId, userGiftId, background);
    setText('');
    setAudioBlob(null);
    setIsGiftModalOpen(false);
  };

  const handleSendGift = async (gift: any) => {
    if (!currentUserProfile) return;
    if ((currentUserProfile.walletBalance || 0) < gift.price) {
      alert("Недостаточно SK Coins");
      return;
    }
    try {
      const { userGiftId, background } = await sendGift(currentUid, receiverUid, gift);
      await handleSend(gift.id, userGiftId, background);
    } catch (e: any) {
      alert(e.message || "Ошибка при отправке подарка");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-screen bg-white fixed inset-0 z-[60]">
       <div className="flex items-center gap-3 p-3 bg-white border-b border-gray-100 relative z-10">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-black"><ArrowLeft size={20}/></button>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-100">
                {receiverDetails?.photoURL && <img src={receiverDetails.photoURL} className="w-full h-full object-cover"/>}
             </div>
             <h2 className="font-bold text-sm text-black">{receiverDetails?.handle || 'Chat'}</h2>
          </div>
       </div>
       
       <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
          {messages.map(msg => (
             <div key={msg.id} className={`flex ${msg.senderUid === currentUid ? 'justify-end' : 'justify-start'}`}>
                <div className={clsx(
                  "max-w-[80%] p-3 rounded-2xl shadow-sm",
                  msg.senderUid === currentUid ? "bg-black text-white rounded-tr-none" : "bg-gray-100 text-black rounded-tl-none"
                )}>
                   {msg.giftId ? (
                     <div className="flex flex-col items-center gap-2 p-2 min-w-[120px]">
                        <div 
                           className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center overflow-hidden relative"
                           style={msg.background ? { background: msg.background } : {}}
                        >
                           {msg.background && (
                             <motion.div 
                               className="absolute inset-0 opacity-50"
                               animate={{ 
                                 scale: [1, 1.5, 1],
                                 opacity: [0.3, 0.6, 0.3]
                               }}
                               transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                               style={{ background: msg.background, filter: 'blur(10px)' }}
                             />
                           )}
                           <motion.div 
                             className="text-4xl relative z-10"
                             animate={
                               GIFTS.find(g => g.id === msg.giftId)?.animation === 'bounce' ? { y: [0, -10, 0] } :
                               GIFTS.find(g => g.id === msg.giftId)?.animation === 'launch' ? { y: [0, -20, 0], x: [0, 5, 0] } :
                               GIFTS.find(g => g.id === msg.giftId)?.animation === 'float' ? { y: [0, -5, 0], x: [0, 5, 0] } :
                               {}
                             }
                             transition={{ 
                               repeat: Infinity, 
                               duration: GIFTS.find(g => g.id === msg.giftId)?.animation === 'launch' ? 1 : 2,
                               ease: "easeInOut"
                             }}
                           >
                              {GIFTS.find(g => g.id === msg.giftId)?.icon || "🎁"}
                           </motion.div>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-center">
                          {GIFTS.find(g => g.id === msg.giftId)?.name || "Подарок"}
                        </p>
                     </div>
                   ) : (
                     <>
                       {msg.text && <p className="text-sm">{msg.text}</p>}
                       {msg.audioURL && (
                         <audio src={msg.audioURL} controls className={clsx("mt-1 h-8 w-48", msg.senderUid === currentUid ? "filter invert" : "")} />
                       )}
                     </>
                   )}
                </div>
             </div>
          ))}
          <div ref={bottomRef} />
       </div>

       <div className="p-3 pb-8 border-t border-gray-100 flex flex-col gap-2 bg-white">
          <div className="flex gap-2 items-center">
            <button 
              onClick={() => setIsGiftModalOpen(true)}
              className="p-2.5 bg-gray-50 text-black rounded-full hover:bg-gray-100"
            >
              <GiftIcon size={20} />
            </button>
            
            {isRecording ? (
              <div className="flex-1 flex items-center justify-between bg-red-50 p-2.5 rounded-full animate-pulse border border-red-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <span className="text-red-500 font-bold text-sm">{formatTime(recordingTime)}</span>
                </div>
                <button onClick={stopRecording} className="p-1.5 bg-red-500 text-white rounded-full"><Square size={16} fill="currentColor"/></button>
              </div>
            ) : (
              <>
                <input 
                   className="flex-1 bg-gray-50 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-black"
                   placeholder="Сообщение..."
                   value={text}
                   onChange={e => setText(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && handleSend()}
                   disabled={!!audioBlob}
                />
                {!text.trim() && !audioBlob ? (
                  <button onClick={startRecording} className="p-2.5 bg-gray-50 text-black rounded-full hover:bg-gray-100">
                    <Mic size={20} />
                  </button>
                ) : (
                  <button onClick={handleSend} className="p-2.5 bg-black text-white rounded-full hover:bg-gray-900 shadow-sm">
                    <Send size={20} />
                  </button>
                )}
              </>
            )}
          </div>
       </div>

       {isGiftModalOpen && (
         <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-3xl p-6 animate-in slide-in-from-bottom duration-300">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold">Отправить подарок</h3>
                  <button onClick={() => setIsGiftModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
               </div>
               <div className="grid grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto no-scrollbar pb-4">
                  {GIFTS.map(gift => (
                    <div 
                      key={gift.id} 
                      onClick={() => handleSendGift(gift)}
                      className="p-3 border border-gray-100 rounded-2xl hover:border-black transition-all cursor-pointer group flex flex-col items-center"
                    >
                       <div className="w-12 h-12 bg-gray-50 rounded-xl mb-2 flex items-center justify-center group-hover:scale-110 transition-transform text-2xl">
                          {gift.icon}
                       </div>
                       <p className="text-[10px] font-bold mb-1 truncate">{gift.name}</p>
                       <p className="text-[8px] text-gray-400 font-bold">{gift.price} SK</p>
                    </div>
                  ))}
               </div>
            </div>
         </div>
       )}
    </div>
  );
};
