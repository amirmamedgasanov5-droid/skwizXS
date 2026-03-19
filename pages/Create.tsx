import React, { useState } from 'react';
import { createPost, createGiveawayPost, uploadFile, compressImage, promotePost, createAdPost } from '../services/firebase';
import { UserProfile } from '../types';
import { Button } from '../components/ui/Button';
import { Image as ImageIcon, Video as VideoIcon, X, Zap, Gift, Clock, Link as LinkIcon, Megaphone, Brain } from 'lucide-react';
import clsx from 'clsx';

interface CreateProps {
  user: UserProfile;
  onPostCreated: () => void;
}

export const Create: React.FC<CreateProps> = ({ user, onPostCreated }) => {
  const [mode, setMode] = useState<'regular' | 'giveaway' | 'ad' | 'poll'>('regular');
  const [content, setContent] = useState('');
  const [adLink, setAdLink] = useState('');
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [promotionDuration, setPromotionDuration] = useState<'1h' | '24h' | null>(null);

  // Giveaway State
  const [giveawayAmount, setGiveawayAmount] = useState('');
  const [giveawayTime, setGiveawayTime] = useState(1); // Hours

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handlePreSubmit = () => {
     if (!content.trim() && files.length === 0) return;
     
     if (mode === 'giveaway') {
         if (!giveawayAmount || parseFloat(giveawayAmount) <= 0) {
             alert("Укажите сумму розыгрыша.");
             return;
         }
         handleFinalPublish(false);
     } else if (mode === 'ad') {
         if (!adLink.trim()) {
             alert("Укажите ссылку для рекламы.");
             return;
         }
         if ((user.walletBalance || 0) < 200) {
             alert("Недостаточно SK Coins для рекламы (нужно 200 SK).");
             return;
         }
         handleFinalPublish(false);
     } else if (mode === 'poll') {
         if (!pollQuestion.trim() || pollOptions.some(o => !o.trim())) {
             alert("Заполните вопрос и все варианты ответа.");
             return;
         }
         handleFinalPublish(false);
     } else {
         // Show the choice modal for regular posts
         setShowPromoteModal(true);
     }
  };

  const handleFinalPublish = async (shouldPromote: boolean) => {
    // If promoting, verify funds
    let cost = 0;
    let hours = 0;

    if (shouldPromote && promotionDuration) {
       cost = promotionDuration === '1h' ? 10 : 100;
       hours = promotionDuration === '1h' ? 1 : 24;
       
       if ((user.walletBalance || 0) < cost) {
           alert("Недостаточно SK Coins для продвижения.");
           return;
       }
    }

    setShowPromoteModal(false);
    setLoading(true);

    try {
      const mediaURLs: string[] = [];
      let mediaType: 'image' | 'video' = 'image';

      // Upload all files
      for (const file of files) {
        let fileToUpload: File | Blob = file;
        const currentMediaType = file.type.startsWith('video/') ? 'video' : 'image';
        
        // Simple logic: if any file is video, mark post as video type
        if (currentMediaType === 'video') mediaType = 'video';

        // Compress if image
        if (currentMediaType === 'image') {
          try {
             fileToUpload = await compressImage(file);
          } catch (err) {
            console.warn("Compression failed, using original file", err);
          }
        }

        const url = await uploadFile(fileToUpload, `posts/${user.uid}/${Date.now()}_${file.name}`);
        mediaURLs.push(url);
      }

      const postPayload: any = {
        authorUid: user.uid,
        authorHandle: user.handle,
        authorPhotoURL: user.photoURL || null,
        authorIsVerified: user.isVerified || false,
        content,
        mediaURLs, 
        mediaURL: mediaURLs.length > 0 ? mediaURLs[0] : null, 
        mediaType: mediaURLs.length > 0 ? mediaType : null 
      };

      if (mode === 'giveaway') {
          const amount = parseFloat(giveawayAmount);
          await createGiveawayPost(postPayload, amount, giveawayTime);
      } else if (mode === 'ad') {
          await createAdPost(postPayload, adLink);
      } else if (mode === 'poll') {
          const pollData = {
              question: pollQuestion,
              options: pollOptions.map(o => ({ text: o, votes: [] })),
              expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
          };
          await createPost({ ...postPayload, poll: pollData });
      } else {
          // Create Regular Post
          const postId = await createPost(postPayload);
          // If promotion was selected
          if (shouldPromote && postId && hours > 0) {
              await promotePost(postId, user.uid, hours, cost);
          }
      }

      setContent('');
      setFiles([]);
      setGiveawayAmount('');
      setMode('regular');
      onPostCreated();
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Ошибка при создании поста');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto h-full flex flex-col relative">
      <h1 className="text-xl font-bold mb-6 text-black">Создать сигнал</h1>
      
      {/* Mode Switcher */}
      <div className="flex bg-[#EBEDF0] rounded-lg p-1 mb-6 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setMode('regular')}
            className={clsx("flex-1 py-1.5 px-4 rounded-md text-xs font-bold transition-all whitespace-nowrap", mode === 'regular' ? "bg-white shadow-sm text-black" : "text-vk-secondary")}
          >
              Обычный
          </button>
          <button 
            onClick={() => setMode('giveaway')}
            className={clsx("flex-1 py-1.5 px-4 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1 whitespace-nowrap", mode === 'giveaway' ? "bg-vk-blue text-white shadow-sm" : "text-vk-secondary")}
          >
              <Gift size={12} /> Giveaway
          </button>
          <button 
            onClick={() => setMode('ad')}
            className={clsx("flex-1 py-1.5 px-4 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1 whitespace-nowrap", mode === 'ad' ? "bg-orange-500 text-white shadow-sm" : "text-vk-secondary")}
          >
              <Megaphone size={12} /> Реклама
          </button>
          <button 
            onClick={() => setMode('poll')}
            className={clsx("flex-1 py-1.5 px-4 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1 whitespace-nowrap", mode === 'poll' ? "bg-purple-500 text-white shadow-sm" : "text-vk-secondary")}
          >
              <Brain size={12} /> Опрос
          </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <textarea
          className="w-full h-40 p-4 bg-white border border-vk-border rounded-xl resize-none focus:ring-2 focus:ring-vk-blue outline-none text-base text-black"
          placeholder={mode === 'giveaway' ? "Опишите условия розыгрыша..." : mode === 'ad' ? "Текст рекламного объявления..." : "Что происходит в реальности?"}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        {mode === 'ad' && (
            <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-100 space-y-4">
                <div>
                    <label className="text-[10px] font-bold uppercase text-orange-700 block mb-1 flex items-center gap-1"><LinkIcon size={12}/> Ссылка</label>
                    <input 
                       type="text"
                       className="w-full bg-white rounded-lg p-2.5 outline-none border border-orange-200 focus:border-orange-500 text-sm"
                       placeholder="https://example.com"
                       value={adLink}
                       onChange={e => setAdLink(e.target.value)}
                    />
                </div>
                <div className="text-[10px] text-orange-800 leading-tight">
                    * Стоимость размещения: 200 SK. Ваше объявление будет выделено в ленте.
                </div>
            </div>
        )}

        {mode === 'poll' && (
            <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-100 space-y-4">
                <div>
                    <label className="text-[10px] font-bold uppercase text-purple-700 block mb-1">Вопрос</label>
                    <input 
                       type="text"
                       className="w-full bg-white rounded-lg p-2.5 outline-none border border-purple-200 focus:border-purple-500 text-sm"
                       placeholder="Ваш вопрос..."
                       value={pollQuestion}
                       onChange={e => setPollQuestion(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-purple-700 block mb-1">Варианты</label>
                    {pollOptions.map((opt, idx) => (
                        <input 
                           key={idx}
                           type="text"
                           className="w-full bg-white rounded-lg p-2.5 outline-none border border-purple-200 focus:border-purple-500 text-sm"
                           placeholder={`Вариант ${idx + 1}`}
                           value={opt}
                           onChange={e => {
                               const newOpts = [...pollOptions];
                               newOpts[idx] = e.target.value;
                               setPollOptions(newOpts);
                           }}
                        />
                    ))}
                    {pollOptions.length < 4 && (
                        <button 
                            onClick={() => setPollOptions([...pollOptions, ''])}
                            className="text-[10px] font-bold text-purple-600 hover:underline"
                        >
                            + Добавить вариант
                        </button>
                    )}
                </div>
            </div>
        )}

        {mode === 'giveaway' && (
            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-4">
                <div>
                    <label className="text-[10px] font-bold uppercase text-vk-blue block mb-1">Сумма приза (SK)</label>
                    <input 
                       type="number"
                       className="w-full bg-white rounded-lg p-2.5 outline-none border border-blue-200 focus:border-vk-blue font-bold text-sm"
                       placeholder="0"
                       value={giveawayAmount}
                       onChange={e => setGiveawayAmount(e.target.value)}
                    />
                    <p className="text-[10px] text-vk-secondary mt-1">Доступно: {user.walletBalance || 0} SK</p>
                </div>
                <div>
                    <label className="text-[10px] font-bold uppercase text-vk-blue block mb-1 flex items-center gap-1"><Clock size={12}/> Таймер (Часов)</label>
                    <div className="flex gap-2">
                        {[1, 3, 6, 12, 24].map(h => (
                            <button 
                                key={h}
                                onClick={() => setGiveawayTime(h)}
                                className={clsx("px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all", giveawayTime === h ? "bg-vk-blue text-white border-vk-blue" : "bg-white text-vk-blue border-blue-200")}
                            >
                                {h}ч
                            </button>
                        ))}
                    </div>
                </div>
                <div className="text-[10px] text-vk-blue leading-tight">
                    * Сумма будет заблокирована на счете поста. Победитель будет выбран автоматически из лайкнувших.
                </div>
            </div>
        )}

        {files.length > 0 && (
          <div className="mt-4 flex gap-2 flex-wrap">
            {files.map((file, idx) => (
               <div key={idx} className="p-2 bg-[#F2F3F5] rounded-lg flex items-center gap-2 relative border border-vk-border">
                  <span className="text-xs truncate max-w-[100px] text-black">{file.name}</span>
                  <button onClick={() => removeFile(idx)} className="p-1 bg-white rounded-full hover:bg-red-50 shadow-sm"><X size={12}/></button>
               </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <label className="p-2.5 bg-[#F2F3F5] rounded-lg cursor-pointer hover:bg-gray-200 transition-colors flex items-center gap-2 text-vk-blue">
            <ImageIcon size={18} />
            <span className="text-xs font-bold">Фото</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFileSelect(e, 'image')} />
          </label>
          <label className="p-2.5 bg-[#F2F3F5] rounded-lg cursor-pointer hover:bg-gray-200 transition-colors flex items-center gap-2 text-vk-blue">
            <VideoIcon size={18} />
            <span className="text-xs font-bold">Видео</span>
            <input type="file" accept="video/mp4,video/quicktime" multiple className="hidden" onChange={(e) => handleFileSelect(e, 'video')} />
          </label>
        </div>
      </div>

      <div className="mt-auto pt-6 pb-20">
        <button 
          onClick={handlePreSubmit} 
          disabled={loading || ((!content && files.length === 0 && mode !== 'poll') || (mode === 'giveaway' && !giveawayAmount) || (mode === 'ad' && !adLink) || (mode === 'poll' && !pollQuestion))}
          className="w-full py-3 bg-vk-blue text-white rounded-lg font-bold text-sm hover:bg-blue-600 transition-colors shadow-sm disabled:opacity-50"
        >
          {loading ? "Публикация..." : mode === 'giveaway' ? `Запустить за ${giveawayAmount || 0} SK` : mode === 'ad' ? "Запустить рекламу (200 SK)" : mode === 'poll' ? "Создать опрос" : "Опубликовать"}
        </button>
      </div>

      {/* Promotion Choice Modal */}
      {showPromoteModal && (
         <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPromoteModal(false)} />
            <div className="bg-white border border-vk-border w-full max-w-sm rounded-xl p-6 relative z-10 shadow-2xl animate-in slide-in-from-bottom duration-300">
               
               <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                     <Zap size={24} className="text-vk-blue fill-vk-blue" />
                     <h2 className="text-lg font-bold text-black">Продвижение</h2>
                  </div>
                  <button onClick={() => setShowPromoteModal(false)} className="p-2 bg-[#F2F3F5] rounded-full hover:bg-gray-200"><X size={18} className="text-vk-secondary"/></button>
               </div>

               <p className="text-xs text-vk-secondary mb-6">
                   Сделайте ваш сигнал громче. Выберите Premium продвижение или опубликуйте как обычно.
               </p>

               <div className="space-y-3 mb-6">
                   <div 
                       onClick={() => setPromotionDuration('1h')}
                       className={clsx(
                           "flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all",
                           promotionDuration === '1h' ? "border-vk-blue bg-blue-50" : "border-transparent bg-[#F2F3F5]"
                       )}
                   >
                       <span className="font-bold text-sm text-black">1 Час</span>
                       <span className="font-bold text-sm text-vk-blue">10 SK</span>
                   </div>

                   <div 
                       onClick={() => setPromotionDuration('24h')}
                       className={clsx(
                           "flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all",
                           promotionDuration === '24h' ? "border-vk-blue bg-blue-50" : "border-transparent bg-[#F2F3F5]"
                       )}
                   >
                       <span className="font-bold text-sm text-black">24 Часа</span>
                       <div className="text-right">
                          <span className="block font-bold text-sm text-vk-blue">100 SK</span>
                          <span className="text-[10px] text-green-600 font-bold uppercase">Выгодно</span>
                       </div>
                   </div>
               </div>

               <div className="flex flex-col gap-3">
                   <button 
                       onClick={() => handleFinalPublish(true)}
                       disabled={!promotionDuration}
                       className="w-full py-3 bg-vk-blue text-white rounded-lg font-bold text-sm disabled:opacity-50 transition-all hover:bg-blue-600"
                   >
                       Опубликовать с Promo
                   </button>
                   <button 
                       onClick={() => handleFinalPublish(false)}
                       className="w-full py-2 text-vk-secondary hover:text-black font-bold text-xs transition-colors"
                   >
                       Пропустить и опубликовать
                   </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};