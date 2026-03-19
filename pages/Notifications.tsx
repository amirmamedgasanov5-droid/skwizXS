import React, { useEffect, useState } from 'react';
import { subscribeToNotifications, markAllNotificationsAsRead, markNotificationAsRead } from '../services/firebase';
import { AppNotification } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Bell, Heart, UserPlus, MessageSquare, ArrowRightLeft, Gift, AtSign, Check } from 'lucide-react';
import clsx from 'clsx';

interface NotificationsProps {
  uid: string;
  onViewProfile: (uid: string) => void;
  onViewPost: (postId: string) => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ uid, onViewProfile, onViewPost }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToNotifications(uid, (data) => {
      setNotifications(data);
      setLoading(false);
    });
    return () => unsub();
  }, [uid]);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead(uid);
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await markNotificationAsRead(notif.id);
    }
    
    if (notif.type === 'follow') {
      onViewProfile(notif.senderUid);
    } else if (notif.targetId) {
      onViewPost(notif.targetId);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart size={16} className="text-red-500 fill-red-500" />;
      case 'follow': return <UserPlus size={16} className="text-blue-500" />;
      case 'comment': return <MessageSquare size={16} className="text-green-500" />;
      case 'transfer': return <ArrowRightLeft size={16} className="text-orange-500" />;
      case 'gift': return <Gift size={16} className="text-purple-500" />;
      case 'mention': return <AtSign size={16} className="text-yellow-500" />;
      default: return <Bell size={16} className="text-gray-500" />;
    }
  };

  const getMessage = (notif: AppNotification) => {
    switch (notif.type) {
      case 'like': return 'оценил ваш сигнал';
      case 'follow': return 'подписался на вас';
      case 'comment': return `прокомментировал: "${notif.text}"`;
      case 'transfer': return `отправил вам перевод: ${notif.text}`;
      case 'gift': return 'отправил вам подарок';
      case 'mention': return 'упомянул вас';
      default: return 'уведомление';
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-10 h-10 bg-gray-100 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="pb-24 pt-2 px-4 max-w-2xl mx-auto min-h-screen">
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-2">
          <Bell className="text-black" size={24} />
          <h1 className="text-xl font-bold text-black">Уведомления</h1>
        </div>
        {notifications.some(n => !n.isRead) && (
          <button 
            onClick={handleMarkAllRead}
            className="text-xs font-bold text-gray-400 hover:text-black flex items-center gap-1 transition-colors"
          >
            <Check size={14} /> Прочитать все
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Bell size={32} className="text-gray-200" />
          </div>
          <p className="text-gray-400 font-medium">У вас пока нет уведомлений</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map((notif) => (
            <div 
              key={notif.id} 
              onClick={() => handleNotificationClick(notif)}
              className={clsx(
                "p-3 rounded-2xl flex gap-3 transition-all cursor-pointer active:scale-[0.98]",
                notif.isRead ? "bg-white opacity-70" : "bg-gray-50 shadow-sm"
              )}
            >
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border border-gray-100">
                  {notif.senderPhotoURL ? (
                    <img src={notif.senderPhotoURL} alt={notif.senderHandle} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-200" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-50">
                  {getIcon(notif.type)}
                </div>
              </div>

              <div className="flex-1 min-w-0 py-0.5">
                <p className="text-sm leading-tight">
                  <span className="font-bold text-black">{notif.senderHandle}</span>{' '}
                  <span className="text-gray-600">{getMessage(notif)}</span>
                </p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                  {formatDistanceToNow(notif.createdAt, { addSuffix: true, locale: ru })}
                </p>
              </div>
              
              {!notif.isRead && (
                <div className="w-2 h-2 bg-black rounded-full mt-2 self-start" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
