import React, { useState, useEffect } from 'react';
import { 
  X, User, Settings, Wallet, LogOut, Edit3, Save, ArrowLeft, 
  Moon, Sun, Globe, Shield, Lock, Trash2, Bell, Crown, ArrowRightLeft,
  ChevronRight, Info, ShieldAlert, Eye, EyeOff, ShoppingBag, MessageCircle
} from 'lucide-react';
import { UserProfile, NFTInstance, NFTTemplate } from '../types';
import { 
  updateUserBio, updateUserHandle, updatePrivacySettings, 
  updateUserPassword, auth, subscribeToMyNfts, subscribeToMarketplace,
  mintNft, equipNft, transferNft, listNftForSale, delistNft,
  buySecondaryNft, transferSkCoins, NFT_TEMPLATES, deleteUserAccount
} from '../services/firebase';
import { useAppContext } from '../contexts/AppContext';
import { VerificationBadge } from './ui/VerificationBadge';
import { Logo } from './ui/Logo';
import { RichText } from './ui/RichText';
import { NFTVisual } from './ui/NFTVisual';
import clsx from 'clsx';

interface SideMenuProps {
  user: UserProfile;
  onClose: () => void;
  onNavigate: (page: string) => void;
}

const SideMenu: React.FC<SideMenuProps> = ({ user, onClose, onNavigate }) => {
    const [view, setView] = useState<'main' | 'settings' | 'wallet' | 'privacy' | 'account' | 'notifications'>('main');
    const [walletTab, setWalletTab] = useState<'inventory' | 'market'>('inventory');
    const [marketSubTab, setMarketSubTab] = useState<'primary' | 'secondary'>('primary');
    
    // Edit Profile State
    const [bioText, setBioText] = useState(user.bio || '');
    const [handleText, setHandleText] = useState(user.handle || '');
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [showOnline, setShowOnline] = useState(user.privacySettings?.showOnline ?? true);
    const [allowDMs, setAllowDMs] = useState(user.privacySettings?.allowDirectMessages ?? true);
    
    // Change Password State
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // Wallet State
    const [myNfts, setMyNfts] = useState<NFTInstance[]>([]);
    const [marketNfts, setMarketNfts] = useState<NFTInstance[]>([]);
    const [loadingAction, setLoadingAction] = useState(false);
    
    // Modals
    const [selectedMyNft, setSelectedMyNft] = useState<NFTInstance | null>(null);
    const [transferHandle, setTransferHandle] = useState('');
    const [listPrice, setListPrice] = useState('');
    const [sendMoneyHandle, setSendMoneyHandle] = useState('');
    const [sendMoneyAmount, setSendMoneyAmount] = useState('');
    const [isSendingMoney, setIsSendingMoney] = useState(false);

    // Global Context
    const { theme, toggleTheme, language, toggleLanguage, t } = useAppContext();

    useEffect(() => {
        if (view === 'wallet') {
            const unsubMy = subscribeToMyNfts(user.uid, setMyNfts);
            const unsubMarket = subscribeToMarketplace(setMarketNfts);
            return () => { unsubMy(); unsubMarket(); };
        }
    }, [view, user.uid]);

    // Profile Actions
    const handleSaveBio = async () => {
        setLoadingAction(true);
        try { await updateUserBio(user.uid, bioText); setIsEditingBio(false); } catch (e) { console.error(e); }
        setLoadingAction(false);
    };

    const handleSaveSettings = async () => {
      setLoadingAction(true);
      try {
        if (handleText !== user.handle) await updateUserHandle(user.uid, handleText);
        if (bioText !== user.bio) await updateUserBio(user.uid, bioText);
        await updatePrivacySettings(user.uid, { showOnline, allowDirectMessages: allowDMs });
        alert("Настройки сохранены!");
        setView('main');
      } catch (e: any) { alert(e.message || 'Ошибка сохранения'); } finally { setLoadingAction(false); }
    };
    
    const handleChangePassword = async () => {
        if (newPassword.length < 6) {
            alert("Пароль должен быть не менее 6 символов.");
            return;
        }
        if (newPassword !== confirmPassword) {
            alert("Пароли не совпадают.");
            return;
        }
        setLoadingAction(true);
        try {
            await updateUserPassword(newPassword);
            alert("Пароль успешно обновлен!");
            setNewPassword('');
            setConfirmPassword('');
        } catch (e: any) {
            console.error(e);
            alert("Ошибка смены пароля: " + e.message);
        } finally {
            setLoadingAction(false);
        }
    };

    const handleDeleteAccount = async () => {
      if (window.confirm("ВЫ УВЕРЕНЫ? Это действие нельзя отменить. Все ваши данные, посты и SK Coins будут удалены навсегда.")) {
        setLoadingAction(true);
        try {
          await deleteUserAccount(user.uid);
          await auth.signOut();
          window.location.reload();
        } catch (e: any) {
          alert("Ошибка удаления: " + e.message);
        } finally {
          setLoadingAction(false);
        }
      }
    };

    // Wallet Actions
    const handleMint = async (template: NFTTemplate) => {
        if (!window.confirm(`Создать артефакт "${template.name}" за ${template.price} SK?`)) return;
        setLoadingAction(true);
        try { await mintNft(user.uid, template); alert("Артефакт создан!"); } 
        catch (e: any) { alert(e.message); } finally { setLoadingAction(false); }
    };

    const handleEquip = async (nftId: string) => {
        const isEquipped = user.selectedNftId === nftId;
        setLoadingAction(true);
        try { await equipNft(user.uid, isEquipped ? null : nftId); } 
        catch(e) { console.error(e); } finally { setLoadingAction(false); }
    };

    const handleTransferNft = async () => {
        if (!selectedMyNft || !transferHandle) return;
        setLoadingAction(true);
        try { await transferNft(user.uid, transferHandle, selectedMyNft.id); alert("Отправлено!"); setSelectedMyNft(null); } 
        catch (e: any) { alert(e.message); } finally { setLoadingAction(false); }
    };

    const handleListNft = async () => {
        if (!selectedMyNft || !listPrice) return;
        setLoadingAction(true);
        try { await listNftForSale(selectedMyNft.id, user.uid, parseInt(listPrice)); alert("Выставлено на продажу!"); setSelectedMyNft(null); }
        catch (e: any) { alert(e.message); } finally { setLoadingAction(false); }
    };

    const handleDelistNft = async () => {
        if (!selectedMyNft) return;
        setLoadingAction(true);
        try { await delistNft(selectedMyNft.id, user.uid); alert("Снято с продажи!"); setSelectedMyNft(null); }
        catch (e: any) { alert(e.message); } finally { setLoadingAction(false); }
    };

    const handleBuySecondary = async (nft: NFTInstance) => {
        if (!window.confirm(`Купить #${nft.serialNumber} ${nft.name} за ${nft.listPrice} SK?`)) return;
        setLoadingAction(true);
        try { await buySecondaryNft(user.uid, nft.id); alert("Куплено!"); }
        catch (e: any) { alert(e.message); } finally { setLoadingAction(false); }
    };

    const handleSendMoney = async () => {
        if (!sendMoneyHandle || !sendMoneyAmount) return;
        setLoadingAction(true);
        try { await transferSkCoins(user.uid, sendMoneyHandle, parseInt(sendMoneyAmount)); alert("Отправлено!"); setIsSendingMoney(false); }
        catch (e: any) { alert(e.message); } finally { setLoadingAction(false); }
    };

    const ToggleSwitch: React.FC<{ checked: boolean, onChange: () => void }> = ({ checked, onChange }) => (
        <button 
           onClick={onChange}
           className={clsx("w-12 h-7 rounded-full relative transition-colors duration-300 shadow-inner", checked ? "bg-black dark:bg-green-500" : "bg-gray-200 dark:bg-gray-700")}
        >
           <div className={clsx("absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm duration-300", checked ? "left-6" : "left-1")} />
        </button>
    );

    return (
        <div className="fixed inset-0 z-[100] flex">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-[85%] max-w-sm bg-white dark:bg-[#0A0A0B] h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300 border-r border-gray-100 dark:border-white/5">
                <div className="flex justify-between items-center p-6">
                   {view !== 'main' ? (
                       <button onClick={() => setView('main')} className="p-2 -ml-2 rounded-full hover:bg-gray-50 dark:hover:bg-white/5 dark:text-white transition-colors"><ArrowLeft size={22}/></button>
                   ) : (
                       <Logo size={32} className="grayscale brightness-0 dark:invert" />
                   )}
                   <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-gray-50 dark:hover:bg-white/5 dark:text-white transition-colors"><X size={22} /></button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {view === 'main' && (
                      <>
                        <div className="px-6 py-4 flex flex-col h-full">
                          <div className="flex flex-col items-start mb-10">
                              <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-white/5 overflow-hidden mb-4 border border-gray-100 dark:border-white/10 relative">
                                  {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" referrerPolicy="no-referrer"/> : <User size={28} className="m-auto mt-3 text-gray-300"/>}
                              </div>
                              <div className="flex items-center gap-1.5">
                                  <h2 className="font-bold text-lg dark:text-white tracking-tight">{user.handle}</h2>
                                  <VerificationBadge isVerified={user.isVerified} handle={user.handle} size={14} />
                              </div>
                              <p className="text-xs text-gray-400 font-medium">@{user.handle}</p>
                              
                              <div className="flex gap-6 mt-6">
                                  <div className="flex gap-1.5 items-center">
                                      <span className="font-bold text-sm dark:text-white">{user.following?.length || 0}</span>
                                      <span className="text-xs text-gray-400 font-medium">Читаемые</span>
                                  </div>
                                  <div className="flex gap-1.5 items-center">
                                      <span className="font-bold text-sm dark:text-white">{user.followers?.length || 0}</span>
                                      <span className="text-xs text-gray-400 font-medium">Читатели</span>
                                  </div>
                              </div>
                          </div>

                          <div className="space-y-1">
                              <button onClick={() => onNavigate('profile')} className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all group">
                                  <User size={20} className="text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
                                  <span className="font-semibold text-base dark:text-white">Профиль</span>
                              </button>

                              <button onClick={() => onNavigate('wallet')} className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all group">
                                  <Wallet size={20} className="text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
                                  <span className="font-semibold text-base dark:text-white">Кошелек</span>
                              </button>

                              <button onClick={() => setView('wallet')} className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all group">
                                  <ShoppingBag size={20} className="text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
                                  <span className="font-semibold text-base dark:text-white">Артефакты</span>
                              </button>

                              <button onClick={() => onNavigate('direct')} className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all group">
                                  <MessageCircle size={20} className="text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
                                  <span className="font-semibold text-base dark:text-white">Сообщения</span>
                              </button>

                              <button onClick={() => onNavigate('profile')} className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all group">
                                  <Save size={20} className="text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
                                  <span className="font-semibold text-base dark:text-white">Закладки</span>
                              </button>
                          </div>

                          <div className="mt-8 pt-8 border-t border-gray-50 dark:border-white/5 space-y-1">
                              <button onClick={() => setView('settings')} className="w-full px-4 py-3 rounded-2xl text-left font-semibold text-base dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-all">Настройки</button>
                              <button onClick={() => onNavigate('rules')} className="w-full px-4 py-3 rounded-2xl text-left font-semibold text-base dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-all">Справка</button>
                          </div>

                          <div className="mt-auto pt-6 border-t border-gray-50 dark:border-white/5 flex items-center justify-between">
                               <button onClick={toggleTheme} className="p-3 bg-gray-50 dark:bg-white/5 rounded-2xl text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                                  {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                               </button>
                               <button className="p-3 bg-gray-50 dark:bg-white/5 rounded-2xl text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                                  <Globe size={20} />
                               </button>
                          </div>
                        </div>
                        <div className="px-6 pb-6">
                             <button onClick={() => { auth.signOut(); window.location.reload(); }} className="flex items-center gap-3 text-red-500 text-sm font-bold px-4 py-4 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all w-full">
                                 <LogOut size={18} /> Выйти
                             </button>
                        </div>
                      </>
                    )}

                    {view === 'settings' && (
                        <div className="p-6 animate-in slide-in-from-right duration-200">
                            <h2 className="text-2xl font-black mb-8 dark:text-white">Настройки профиля</h2>
                            
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-2">Имя пользователя</label>
                                    <div className="relative">
                                        <input 
                                            className="w-full bg-zinc-50 dark:bg-zinc-900 dark:text-white rounded-[20px] px-6 py-4 font-bold outline-none border border-transparent focus:border-black dark:focus:border-white transition-all"
                                            value={handleText}
                                            onChange={e => setHandleText(e.target.value)}
                                            placeholder="@username"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-2">О себе</label>
                                    <textarea 
                                        className="w-full bg-zinc-50 dark:bg-zinc-900 dark:text-white rounded-[20px] px-6 py-4 font-bold outline-none border border-transparent focus:border-black dark:focus:border-white transition-all min-h-[120px] resize-none"
                                        value={bioText}
                                        onChange={e => setBioText(e.target.value)}
                                        placeholder="Расскажите о себе..."
                                        maxLength={150}
                                    />
                                </div>

                                <div className="pt-4">
                                    <button 
                                        onClick={handleSaveSettings}
                                        disabled={loadingAction}
                                        className="w-full py-5 bg-black dark:bg-white text-white dark:text-black rounded-[24px] font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {loadingAction ? "Сохранение..." : "Сохранить изменения"}
                                    </button>
                                </div>

                                <div className="pt-8 border-t border-zinc-100 dark:border-zinc-800">
                                    <button onClick={() => setView('account')} className="w-full flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 rounded-[20px] hover:bg-zinc-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Lock size={18} className="text-zinc-400" />
                                            <span className="text-sm font-bold dark:text-white">Безопасность и пароль</span>
                                        </div>
                                        <ChevronRight size={18} className="text-zinc-300" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {view === 'privacy' && (
                        <div className="p-6 animate-in slide-in-from-right duration-200">
                            <h2 className="text-2xl font-black mb-8 dark:text-white">Приватность</h2>
                            
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-5 bg-zinc-50 dark:bg-zinc-900 rounded-[24px]">
                                    <div>
                                        <p className="font-bold text-sm dark:text-white">Статус "В сети"</p>
                                        <p className="text-xs text-zinc-400">Показывать, когда вы онлайн</p>
                                    </div>
                                    <ToggleSwitch checked={showOnline} onChange={() => setShowOnline(!showOnline)} />
                                </div>

                                <div className="flex items-center justify-between p-5 bg-zinc-50 dark:bg-zinc-900 rounded-[24px]">
                                    <div>
                                        <p className="font-bold text-sm dark:text-white">Личные сообщения</p>
                                        <p className="text-xs text-zinc-400">Кто может писать вам в Direct</p>
                                    </div>
                                    <ToggleSwitch checked={allowDMs} onChange={() => setAllowDMs(!allowDMs)} />
                                </div>

                                <div className="p-5 bg-zinc-50 dark:bg-zinc-900 rounded-[24px] space-y-4">
                                    <p className="font-bold text-sm dark:text-white">Заблокированные пользователи</p>
                                    <p className="text-xs text-zinc-400 italic">Список пуст.</p>
                                </div>

                                <button 
                                    onClick={handleSaveSettings}
                                    className="w-full py-5 bg-black dark:bg-white text-white dark:text-black rounded-[24px] font-black text-lg mt-8"
                                >
                                    Применить
                                </button>
                            </div>
                        </div>
                    )}

                    {view === 'account' && (
                        <div className="p-6 animate-in slide-in-from-right duration-200">
                            <h2 className="text-2xl font-black mb-8 dark:text-white">Безопасность</h2>
                            
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-2">Новый пароль</label>
                                    <input 
                                        type="password"
                                        className="w-full bg-zinc-50 dark:bg-zinc-900 dark:text-white rounded-[20px] px-6 py-4 font-bold outline-none"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-2">Подтвердите пароль</label>
                                    <input 
                                        type="password"
                                        className="w-full bg-zinc-50 dark:bg-zinc-900 dark:text-white rounded-[20px] px-6 py-4 font-bold outline-none"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                    />
                                </div>

                                <button 
                                    onClick={handleChangePassword}
                                    disabled={loadingAction || !newPassword}
                                    className="w-full py-5 bg-black dark:bg-white text-white dark:text-black rounded-[24px] font-black text-lg shadow-xl"
                                >
                                    Обновить пароль
                                </button>

                                <div className="pt-12 border-t border-zinc-100 dark:border-zinc-800">
                                    <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-4 ml-2">Опасная зона</p>
                                    <button 
                                        onClick={handleDeleteAccount}
                                        className="w-full flex items-center justify-center gap-3 p-5 border-2 border-red-500 text-red-500 rounded-[24px] font-bold hover:bg-red-50 transition-colors"
                                    >
                                        <Trash2 size={20} /> Удалить аккаунт навсегда
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {view === 'notifications' && (
                        <div className="p-6 animate-in slide-in-from-right duration-200">
                            <h2 className="text-2xl font-black mb-8 dark:text-white">Уведомления</h2>
                            
                            <div className="space-y-4">
                                {['Лайки', 'Комментарии', 'Новые подписчики', 'Сообщения в Direct', 'Системные новости'].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-5 bg-zinc-50 dark:bg-zinc-900 rounded-[24px]">
                                        <span className="font-bold text-sm dark:text-white">{item}</span>
                                        <ToggleSwitch checked={true} onChange={() => {}} />
                                    </div>
                                ))}
                                <p className="text-[10px] text-zinc-400 text-center mt-8 uppercase tracking-widest font-bold">Push-уведомления включены</p>
                            </div>
                        </div>
                    )}

                    {view === 'wallet' && (
                        <div className="p-6 animate-in slide-in-from-right duration-200">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-black dark:text-white">Кошелек</h2>
                                <button onClick={() => setIsSendingMoney(true)} className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full text-xs font-bold shadow-lg">Отправить</button>
                            </div>

                            <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-1 mb-6">
                                <button 
                                    onClick={() => setWalletTab('inventory')}
                                    className={clsx("flex-1 py-3 rounded-xl text-xs font-bold transition-all", walletTab === 'inventory' ? "bg-white dark:bg-zinc-800 shadow-sm dark:text-white" : "text-zinc-400")}
                                >
                                    Инвентарь
                                </button>
                                <button 
                                    onClick={() => setWalletTab('market')}
                                    className={clsx("flex-1 py-3 rounded-xl text-xs font-bold transition-all", walletTab === 'market' ? "bg-white dark:bg-zinc-800 shadow-sm dark:text-white" : "text-zinc-400")}
                                >
                                    Маркет
                                </button>
                            </div>

                            {walletTab === 'inventory' && (
                                <div className="grid grid-cols-1 gap-4">
                                    {myNfts.length === 0 ? (
                                        <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900 rounded-[32px] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                                            <ShoppingBag size={40} className="mx-auto text-zinc-200 mb-4" />
                                            <p className="text-sm font-bold text-zinc-400">У вас пока нет артефактов</p>
                                        </div>
                                    ) : (
                                        myNfts.map(nft => (
                                            <div 
                                                key={nft.id}
                                                onClick={() => setSelectedMyNft(nft)}
                                                className="relative h-48 rounded-[32px] overflow-hidden shadow-xl group cursor-pointer"
                                            >
                                                <NFTVisual templateId={nft.templateId} className="absolute inset-0" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                                <div className="absolute inset-0 p-6 flex flex-col justify-between">
                                                    <div className="flex justify-between items-start">
                                                        <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">#{nft.serialNumber}</span>
                                                        {user.selectedNftId === nft.id && <div className="bg-white text-black text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest">Equipped</div>}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xl font-black text-white tracking-tight uppercase">{nft.name}</h4>
                                                        <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest">{nft.rarity}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {walletTab === 'market' && (
                                <div className="space-y-6">
                                    <div className="flex gap-2">
                                        <button onClick={() => setMarketSubTab('primary')} className={clsx("px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-all", marketSubTab === 'primary' ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white" : "border-zinc-100 text-zinc-400")}>Первичный</button>
                                        <button onClick={() => setMarketSubTab('secondary')} className={clsx("px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-all", marketSubTab === 'secondary' ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white" : "border-zinc-100 text-zinc-400")}>Вторичный</button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        {marketSubTab === 'primary' ? (
                                            NFT_TEMPLATES.map(tmpl => (
                                                <div key={tmpl.id} className="bg-zinc-50 dark:bg-zinc-900 rounded-[32px] p-4 border border-zinc-100 dark:border-zinc-800">
                                                    <div className="h-40 rounded-2xl overflow-hidden mb-4 relative">
                                                        <NFTVisual templateId={tmpl.id} className="w-full h-full" />
                                                    </div>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <h4 className="font-black text-sm dark:text-white uppercase">{tmpl.name}</h4>
                                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{tmpl.rarity}</span>
                                                    </div>
                                                    <p className="text-xs text-zinc-500 mb-4">{tmpl.description}</p>
                                                    <button 
                                                        onClick={() => handleMint(tmpl)}
                                                        disabled={loadingAction || (user.walletBalance || 0) < tmpl.price}
                                                        className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-50 shadow-lg"
                                                    >
                                                        Купить за {tmpl.price} SK
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            marketNfts.length === 0 ? (
                                                <div className="text-center py-20 text-zinc-400 font-bold">Рынок пуст</div>
                                            ) : (
                                                marketNfts.map(nft => (
                                                    <div key={nft.id} className="bg-zinc-50 dark:bg-zinc-900 rounded-[32px] p-4 border border-zinc-100 dark:border-zinc-800">
                                                        <div className="h-40 rounded-2xl overflow-hidden mb-4 relative">
                                                            <NFTVisual templateId={nft.templateId} className="w-full h-full" />
                                                            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white">#{nft.serialNumber}</div>
                                                        </div>
                                                        <h4 className="font-black text-sm mb-1 dark:text-white uppercase">{nft.name}</h4>
                                                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-4">Владелец: {nft.ownerUid.slice(0, 8)}</p>
                                                        <button 
                                                            onClick={() => handleBuySecondary(nft)}
                                                            disabled={loadingAction || nft.ownerUid === user.uid}
                                                            className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-50 shadow-lg"
                                                        >
                                                            {nft.ownerUid === user.uid ? "Ваш лот" : `Купить за ${nft.listPrice} SK`}
                                                        </button>
                                                    </div>
                                                ))
                                            )
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Overlays (NFT Detail, Send Money) */}
                {selectedMyNft && (
                    <div className="absolute inset-0 bg-white dark:bg-black z-[110] flex flex-col animate-in slide-in-from-bottom duration-300">
                        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                            <h3 className="font-black text-xl dark:text-white uppercase tracking-tight">Детали артефакта</h3>
                            <button onClick={() => setSelectedMyNft(null)} className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-full dark:text-white"><X size={20} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="h-64 rounded-[40px] overflow-hidden relative mb-8 shadow-2xl">
                                <NFTVisual templateId={selectedMyNft.templateId} className="w-full h-full" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute bottom-6 left-6">
                                    <h4 className="text-3xl font-black text-white tracking-tighter uppercase">{selectedMyNft.name}</h4>
                                    <p className="text-xs font-bold text-white/70 uppercase tracking-[0.3em]">#{selectedMyNft.serialNumber}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <button 
                                    onClick={() => handleEquip(selectedMyNft.id)}
                                    className={clsx("w-full py-5 rounded-[24px] font-black text-lg transition-all shadow-xl", user.selectedNftId === selectedMyNft.id ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400" : "bg-black dark:bg-white text-white dark:text-black")}
                                >
                                    {user.selectedNftId === selectedMyNft.id ? "Снять" : "Надеть"}
                                </button>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <input 
                                            type="number"
                                            className="w-full bg-zinc-50 dark:bg-zinc-900 dark:text-white rounded-[20px] p-4 text-sm font-bold outline-none"
                                            placeholder="Цена SK"
                                            value={listPrice}
                                            onChange={e => setListPrice(e.target.value)}
                                        />
                                        <button onClick={handleListNft} className="w-full py-4 bg-zinc-100 dark:bg-zinc-800 dark:text-white rounded-[20px] text-xs font-black uppercase tracking-widest">Продать</button>
                                    </div>
                                    <div className="space-y-2">
                                        <input 
                                            className="w-full bg-zinc-50 dark:bg-zinc-900 dark:text-white rounded-[20px] p-4 text-sm font-bold outline-none"
                                            placeholder="@handle"
                                            value={transferHandle}
                                            onChange={e => setTransferHandle(e.target.value)}
                                        />
                                        <button onClick={handleTransferNft} className="w-full py-4 bg-zinc-100 dark:bg-zinc-800 dark:text-white rounded-[20px] text-xs font-black uppercase tracking-widest">Подарить</button>
                                    </div>
                                </div>
                                
                                {selectedMyNft.isListed && (
                                    <button onClick={handleDelistNft} className="w-full py-4 text-red-500 font-bold text-sm">Снять с продажи</button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {isSendingMoney && (
                    <div className="absolute inset-0 bg-white dark:bg-black z-[110] flex flex-col animate-in slide-in-from-bottom duration-300">
                         <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                            <h3 className="font-black text-xl dark:text-white uppercase tracking-tight">Отправить SK Coin</h3>
                            <button onClick={() => setIsSendingMoney(false)} className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-full dark:text-white"><X size={20} /></button>
                        </div>
                        <div className="p-8">
                            <div className="bg-zinc-50 dark:bg-zinc-900 p-10 rounded-[40px] text-center mb-10 border border-zinc-100 dark:border-zinc-800">
                                <h4 className="text-4xl font-black dark:text-white tracking-tighter">{user.walletBalance || 0} <span className="text-lg text-zinc-400">SK</span></h4>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em] mt-2">Доступно для перевода</p>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-4">Получатель</label>
                                    <input 
                                        className="w-full bg-zinc-50 dark:bg-zinc-900 dark:text-white rounded-[24px] px-6 py-5 font-bold outline-none border border-transparent focus:border-black dark:focus:border-white transition-all"
                                        value={sendMoneyHandle}
                                        onChange={e => setSendMoneyHandle(e.target.value)}
                                        placeholder="@username"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-4">Сумма SK</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-zinc-50 dark:bg-zinc-900 dark:text-white rounded-[24px] px-6 py-5 font-bold outline-none border border-transparent focus:border-black dark:focus:border-white transition-all text-2xl"
                                        value={sendMoneyAmount}
                                        onChange={e => setSendMoneyAmount(e.target.value)}
                                        placeholder="0"
                                    />
                                </div>
                                <button 
                                    onClick={handleSendMoney}
                                    disabled={loadingAction || !sendMoneyHandle || !sendMoneyAmount}
                                    className="w-full py-6 bg-black dark:bg-white text-white dark:text-black rounded-[32px] font-black text-lg disabled:opacity-50 mt-4 shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    {loadingAction ? "Отправка..." : "Подтвердить перевод"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SideMenu;
