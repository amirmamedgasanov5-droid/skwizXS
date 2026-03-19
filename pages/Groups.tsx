import React, { useEffect, useState, useRef } from 'react';
import { subscribeToGroups, createGroup, joinGroup, subscribeToGroupMessages, sendGroupMessage } from '../services/firebase';
import { Group, UserProfile, GroupMessage } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Users, Plus, Upload, X, ArrowLeft, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

interface GroupsProps {
  user: UserProfile;
}

export const Groups: React.FC<GroupsProps> = ({ user }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToGroups((data) => setGroups(Array.isArray(data) ? data : []));
    return () => unsubscribe();
  }, []);

  if (activeGroupId) {
    const activeGroup = groups.find(g => g.id === activeGroupId);
    if (!activeGroup) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-white fixed inset-0 z-[60]">
           <div className="w-12 h-12 border-4 border-vk-blue border-t-transparent rounded-full animate-spin mb-4" />
           <p className="text-vk-secondary text-sm font-bold">Загрузка сообщества...</p>
           <button onClick={() => setActiveGroupId(null)} className="mt-4 text-vk-blue text-sm font-bold">Назад</button>
        </div>
      );
    }
    return <GroupChat group={activeGroup} user={user} onBack={() => setActiveGroupId(null)} />;
  }

  return (
    <div className="pb-24 pt-4 px-4 space-y-4 max-w-2xl mx-auto min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-black">Сообщества</h1>
        <button 
          onClick={() => setIsCreating(true)} 
          className="p-2 bg-vk-blue text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
        >
          <Plus size={24} />
        </button>
      </div>

      {isCreating && <CreateGroupModal user={user} onClose={() => setIsCreating(false)} />}

      <div className="space-y-3">
        {groups.length === 0 ? (
          <div className="text-center text-vk-secondary mt-20">
             <div className="w-16 h-16 bg-[#F2F3F5] rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={32} />
             </div>
             <p className="text-sm">Создайте первое сообщество.</p>
          </div>
        ) : (
          groups.map(group => (
            <div 
              key={group.id} 
              onClick={() => setActiveGroupId(group.id)}
              className="bg-white border border-vk-border rounded-xl p-3 flex items-center gap-3 hover:bg-gray-50 transition-all cursor-pointer shadow-sm"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-full flex-shrink-0 overflow-hidden border border-vk-border">
                {group.photoURL ? (
                    <img src={group.photoURL} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Users size={20} />
                    </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-vk-blue truncate">{group.name}</h3>
                <p className="text-xs text-vk-secondary truncate">{group.lastMessage || group.description}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                 {group.lastMessageTime && (
                    <span className="text-[10px] text-vk-secondary whitespace-nowrap">
                       {formatDistanceToNow(group.lastMessageTime)}
                    </span>
                 )}
                 <div className="px-2 py-0.5 bg-[#F2F3F5] rounded-full text-[10px] font-bold text-vk-secondary">
                    {group.members?.length ?? 0}
                 </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const CreateGroupModal: React.FC<{ user: UserProfile, onClose: () => void }> = ({ user, onClose }) => {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
     if (!name.trim()) return;
     setLoading(true);
     await createGroup({
         name, 
         description: desc,
         createdBy: user.uid,
         members: [user.uid]
     }, avatar || undefined);
     setLoading(false);
     onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
       <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
       <div className="bg-white rounded-[32px] p-6 w-full max-w-md relative z-10 shadow-2xl">
          <h2 className="text-2xl font-bold mb-6">Новое сообщество</h2>
          
          <div className="flex justify-center mb-6">
             <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden relative group cursor-pointer">
                {avatar ? (
                    <img src={URL.createObjectURL(avatar)} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Users size={32} />
                    </div>
                )}
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files && setAvatar(e.target.files[0])} />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload className="text-white" size={20} />
                </div>
             </div>
          </div>

          <div className="space-y-4">
             <Input placeholder="Название" value={name} onChange={e => setName(e.target.value)} />
             <Input placeholder="Описание (манифест)" value={desc} onChange={e => setDesc(e.target.value)} />
             <Button onClick={handleCreate} isLoading={loading}>Создать</Button>
          </div>
          
          <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100"><X size={20}/></button>
       </div>
    </div>
  );
};

const GroupChat: React.FC<{ group: Group, user: UserProfile, onBack: () => void }> = ({ group, user, onBack }) => {
    const [messages, setMessages] = useState<GroupMessage[]>([]);
    const [text, setText] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);
    // SAFEGUARD: ?.includes with fallback
    const [isMember, setIsMember] = useState(group.members?.includes?.(user.uid) ?? false);

    useEffect(() => {
        const unsubscribe = subscribeToGroupMessages(group.id, (msgs) => setMessages(Array.isArray(msgs) ? msgs : []));
        return () => unsubscribe();
    }, [group.id]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleJoin = async () => {
        await joinGroup(group.id, user.uid);
        setIsMember(true);
    };

    const handleSend = async () => {
        if (!text.trim()) return;
        await sendGroupMessage(group.id, user, text);
        setText('');
    };

  return (
    <div className="flex flex-col h-screen bg-white fixed inset-0 z-[60]">
      <div className="flex items-center gap-3 p-3 bg-white border-b border-vk-border relative z-10 shadow-sm">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-vk-blue"><ArrowLeft size={20}/></button>
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-vk-border">
              {group.photoURL ? <img src={group.photoURL} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200" />}
           </div>
           <div>
              <h2 className="font-bold text-sm text-black leading-tight">{group.name}</h2>
              <p className="text-[10px] text-vk-secondary">{group.members?.length ?? 0} участников</p>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#EBEDF0] pb-32">
        {!isMember && (
          <div className="flex flex-col items-center justify-center h-40 gap-4">
            <p className="text-vk-secondary text-sm">Вступайте в сообщество, чтобы писать.</p>
            <button onClick={handleJoin} className="px-6 py-2 bg-vk-blue text-white rounded-lg font-bold text-sm shadow-sm">Вступить</button>
          </div>
        )}
        
        {messages.map(msg => {
          const isMe = msg.senderUid === user.uid;
          return (
            <div key={msg.id} className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
               {!isMe && (
                 <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 mt-auto border border-vk-border">
                    {msg.senderPhotoURL ? <img src={msg.senderPhotoURL} className="w-full h-full object-cover"/> : null}
                 </div>
               )}
               <div className={clsx("max-w-[75%] p-3 rounded-xl shadow-sm", isMe ? "bg-[#CCE4FF] text-black rounded-tr-none" : "bg-white text-black rounded-tl-none")}>
                   {!isMe && <p className="text-[10px] font-bold text-vk-blue mb-1">{msg.senderHandle}</p>}
                   <p className="text-sm">{msg.text}</p>
               </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {isMember && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-vk-border flex gap-2 z-[70]">
          <input 
            className="flex-1 bg-[#EBEDF0] rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-vk-blue"
            placeholder="Написать в сообщество..."
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button onClick={handleSend} className="p-2.5 bg-vk-blue text-white rounded-lg hover:bg-blue-600 shadow-sm">
            <Send size={20} />
          </button>
        </div>
      )}
    </div>
  );
};