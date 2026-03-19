import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet as WalletIcon, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowLeft,
  CreditCard, 
  Gift as GiftIcon, 
  TrendingUp, 
  TrendingDown,
  ChevronRight,
  Plus,
  Send,
  History,
  Info,
  CheckCircle2,
  AlertCircle,
  X,
  Zap,
  Copy
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, WalletTransaction, Gift, NFTInstance, NFTTemplate, UserGift } from '../types';
import { auth, db, getUserProfile, updateWalletBalance, createWalletTransaction, subscribeToSystemStatus, subscribeToMyNfts, subscribeToMarketplace, mintNft, buySecondaryNft, NFT_TEMPLATES, submitPaymentRequest, transferSkCoins, sendGift, submitWithdrawalRequest, subscribeToWalletTransactions, subscribeToUserGifts, exchangeGift, toggleGiftPin, GIFTS } from '../services/firebase';
import { NFTVisual } from '../components/ui/NFTVisual';
import clsx from 'clsx';

interface WalletProps {
  user: UserProfile;
  onBack?: () => void;
}

// Mock price history for the chart
const generatePriceHistory = (currentPrice: number) => {
  const history = [];
  const now = Date.now();
  for (let i = 20; i >= 0; i--) {
    history.push({
      time: new Date(now - i * 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      price: currentPrice * (0.9 + Math.random() * 0.2)
    });
  }
  return history;
};

const PREMIUM_TIERS = [
  { id: 'p1', name: 'Старт', coins: 1000, price: 99, bonus: 0 },
  { id: 'p2', name: 'Плюс', coins: 5000, price: 449, bonus: 500 },
  { id: 'p3', name: 'Про', coins: 15000, price: 1290, bonus: 2000 },
  { id: 'p4', name: 'Макс', coins: 50000, price: 3990, bonus: 10000 },
];

export const Wallet: React.FC<WalletProps> = ({ user, onBack }) => {
  const [balance, setBalance] = useState(user.walletBalance || 0);
  const [currentPrice, setCurrentPrice] = useState(0.000123);
  const [priceHistory, setPriceHistory] = useState(generatePriceHistory(0.000123));
  const [activeTab, setActiveTab] = useState<'main' | 'transfer' | 'withdraw' | 'buy' | 'gifts' | 'inventory' | 'market' | 'gifts_inventory'>('main');
  const [marketSubTab, setMarketSubTab] = useState<'primary' | 'secondary'>('primary');
  const [myNfts, setMyNfts] = useState<NFTInstance[]>([]);
  const [userGifts, setUserGifts] = useState<UserGift[]>([]);
  const [marketNfts, setMarketNfts] = useState<NFTInstance[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // Form states
  const [transferId, setTransferId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [withdrawCard, setWithdrawCard] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [buyAmountSk, setBuyAmountSk] = useState('');
  const [buySenderName, setBuySenderName] = useState('');
  
  const walletId = user.walletId || `SK-${user.uid.slice(0, 6).toUpperCase()}`;

  useEffect(() => {
    // Subscribe to real price from Firestore
    const unsub = subscribeToSystemStatus((status) => {
      setCurrentPrice(status.skCoinPrice);
      setPriceHistory(prev => [
        ...prev.slice(1),
        { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), price: status.skCoinPrice }
      ]);
    });

    const unsubMy = subscribeToMyNfts(user.uid, setMyNfts);
    const unsubMarket = subscribeToMarketplace(setMarketNfts);
    const unsubTrans = subscribeToWalletTransactions(user.uid, setTransactions);
    const unsubGifts = subscribeToUserGifts(user.uid, setUserGifts);

    return () => {
      unsub();
      unsubMy();
      unsubMarket();
      unsubTrans();
      unsubGifts();
    };
  }, [user.uid]);

  useEffect(() => {
    setBalance(user.walletBalance || 0);
  }, [user.walletBalance]);

  const handleMint = async (template: NFTTemplate) => {
    if (!window.confirm(`Create artifact "${template.name}" for ${template.price} SK?`)) return;
    setLoading(true);
    try { 
      await mintNft(user.uid, template); 
      setMessage({ text: "Artifact created!", type: 'success' });
    } catch (e: any) {
      setMessage({ text: e.message || "Error creating artifact", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleBuySecondary = async (nft: NFTInstance) => {
    if (!window.confirm(`Buy artifact for ${nft.listPrice} SK?`)) return;
    setLoading(true);
    try {
      await buySecondaryNft(user.uid, nft.id);
      setMessage({ text: "Artifact purchased!", type: 'success' });
    } catch (e: any) {
      setMessage({ text: e.message || "Error purchasing artifact", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    const amount = parseInt(transferAmount);
    if (!transferId || isNaN(amount) || amount <= 0) {
      setMessage({ text: 'Введите корректные данные', type: 'error' });
      return;
    }
    if (amount > balance) {
      setMessage({ text: 'Недостаточно средств', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      await transferSkCoins(user.uid, transferId, amount);
      setMessage({ text: `Перевод ${amount} SK успешно отправлен`, type: 'success' });
      setTransferAmount('');
      setTransferId('');
    } catch (e: any) {
      setMessage({ text: e.message || 'Ошибка перевода', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount);
    if (amount < 10000) {
      setMessage({ text: 'Минимальная сумма вывода 10,000 SK', type: 'error' });
      return;
    }
    if (amount > balance) {
      setMessage({ text: 'Недостаточно средств', type: 'error' });
      return;
    }
    if (withdrawCard.length < 16) {
      setMessage({ text: 'Некорректный номер карты', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      await submitWithdrawalRequest(user.uid, amount, withdrawCard);
      setMessage({ text: 'Заявка на вывод создана. Ожидайте зачисления.', type: 'success' });
      setWithdrawAmount('');
      setWithdrawCard('');
    } catch (e: any) {
      setMessage({ text: e.message || 'Ошибка вывода', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBuyRequest = async () => {
    const amountSk = parseInt(buyAmountSk);
    if (!buySenderName || isNaN(amountSk) || amountSk <= 0) {
      setMessage({ text: 'Введите корректные данные', type: 'error' });
      return;
    }
    
    setLoading(true);
    try {
      // Assuming 1 SK = $0.000123 as per previous changes, 
      // but let's just let the user pay whatever they agreed with the admin.
      // Or we can show a suggested price in RUB.
      // Let's say 1000 SK = 10 RUB for simplicity in the UI, or just let them enter.
      const suggestedRub = Math.ceil(amountSk * currentPrice * 100); // Rough conversion to RUB (assuming 1 USD = 100 RUB)
      
      await submitPaymentRequest(user.uid, buySenderName, suggestedRub, amountSk);
      setMessage({ text: 'Заявка отправлена! После оплаты Архитектор пополнит ваш баланс.', type: 'success' });
      setBuyAmountSk('');
      setBuySenderName('');
      setActiveTab('main');
    } catch (e) {
      setMessage({ text: 'Ошибка отправки заявки', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendGift = async (gift: Gift) => {
    if (balance < gift.price) {
      setMessage({ text: 'Недостаточно средств для подарка', type: 'error' });
      return;
    }

    const recipientId = window.prompt("Введите Handle или Wallet ID получателя:");
    if (!recipientId) return;

    setLoading(true);
    try {
      await sendGift(user.uid, recipientId, gift);
      setMessage({ text: `Подарок "${gift.name}" успешно отправлен!`, type: 'success' });
    } catch (e: any) {
      setMessage({ text: e.message || 'Ошибка отправки подарка', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleExchangeGift = async (userGiftId: string) => {
    if (!window.confirm("Вы уверены, что хотите обменять этот подарок на SK Coins? Вы получите 80% от его стоимости.")) return;
    setLoading(true);
    try {
      await exchangeGift(user.uid, userGiftId);
      setMessage({ text: "Подарок успешно обменян!", type: 'success' });
    } catch (e: any) {
      setMessage({ text: e.message || "Ошибка при обмене", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePin = async (userGiftId: string, isPinned: boolean) => {
    try {
      await toggleGiftPin(user.uid, userGiftId, !isPinned);
    } catch (e: any) {
      alert(e.message || "Ошибка при закреплении");
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-black pb-24">
      <div className="p-6 max-w-screen-md mx-auto space-y-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-black transition-colors font-bold text-sm"
        >
          <ArrowLeft size={16} /> Back to Profile
        </button>
        {/* Main Balance Card */}
        <AnimatePresence mode="wait">
          {activeTab === 'main' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              <div className="bg-black rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-black/10">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Zap size={160} />
                </div>
                
                <div className="relative z-10 space-y-10">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-zinc-400 text-xs font-semibold tracking-wide mb-1">Total Balance</p>
                      <div className="flex items-baseline gap-2">
                        <h2 className="text-6xl font-bold tracking-tighter">{balance.toLocaleString()}</h2>
                        <span className="text-zinc-500 font-medium text-xl">SK</span>
                      </div>
                    </div>
                    <div className="bg-zinc-800/50 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2">
                      <div className={clsx(
                        "w-2 h-2 rounded-full",
                        currentPrice >= 0.000123 ? "bg-emerald-500" : "bg-rose-500"
                      )} />
                      <span className="text-[10px] font-bold tracking-wider uppercase">Live</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-3xl p-5">
                      <p className="text-zinc-500 text-[10px] font-bold uppercase mb-1">SK Rate</p>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">${currentPrice.toFixed(6)}</span>
                        <div className={clsx(
                          "flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full",
                          currentPrice >= 0.000123 ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                        )}>
                          {currentPrice >= 0.000123 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {Math.abs((currentPrice - 0.000123) / 0.000123 * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-3xl p-5">
                      <p className="text-zinc-500 text-[10px] font-bold uppercase mb-1">Wallet ID</p>
                      <span className="text-sm font-mono font-bold tracking-wider opacity-80">{walletId}</span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => setActiveTab('transfer')}
                      className="flex-1 bg-white text-black h-16 rounded-3xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
                    >
                      <Send size={18} /> Send
                    </button>
                    <button 
                      onClick={() => setActiveTab('buy')}
                      className="w-16 h-16 bg-zinc-800 rounded-3xl flex items-center justify-center hover:bg-zinc-700 transition-all active:scale-95"
                    >
                      <Plus size={28} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Price Chart */}
              <div className="bg-white rounded-[32px] p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-bold text-sm uppercase tracking-widest text-gray-400">Market Activity</h3>
                  <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl">
                    {['1H', '1D', '1W'].map(p => (
                      <button key={p} className={clsx(
                        "px-4 py-1.5 rounded-xl text-[10px] font-bold transition-all",
                        p === '1H' ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600"
                      )}>{p}</button>
                    ))}
                  </div>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={priceHistory}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#000" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#000" opacity={0.03} />
                      <XAxis dataKey="time" hide />
                      <YAxis domain={['auto', 'auto']} hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '16px', fontSize: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#000" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorPrice)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-2 gap-6">
                <button 
                  onClick={() => setActiveTab('transfer')}
                  className="bg-white p-8 rounded-[32px] shadow-sm flex flex-col gap-6 hover:shadow-md transition-all group active:scale-95"
                >
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Send size={28} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-lg">Send</p>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Transfer SK</p>
                  </div>
                </button>
                <button 
                  onClick={() => setActiveTab('withdraw')}
                  className="bg-white p-8 rounded-[32px] shadow-sm flex flex-col gap-6 hover:shadow-md transition-all group active:scale-95"
                >
                  <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CreditCard size={28} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-lg">Withdraw</p>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">To Card</p>
                  </div>
                </button>
                <button 
                  onClick={() => setActiveTab('inventory')}
                  className="bg-white p-8 rounded-[32px] shadow-sm flex flex-col gap-6 hover:shadow-md transition-all group active:scale-95"
                >
                  <div className="w-14 h-14 bg-yellow-50 text-yellow-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Zap size={28} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-lg">Artifacts</p>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Inventory</p>
                  </div>
                </button>
                <button 
                  onClick={() => setActiveTab('market')}
                  className="bg-white p-8 rounded-[32px] shadow-sm flex flex-col gap-6 hover:shadow-md transition-all group active:scale-95"
                >
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <TrendingUp size={28} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-lg">Market</p>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Shop</p>
                  </div>
                </button>
                <button 
                  onClick={() => setActiveTab('buy')}
                  className="bg-white p-8 rounded-[32px] shadow-sm flex flex-col gap-6 hover:shadow-md transition-all group active:scale-95"
                >
                  <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus size={28} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-lg">Buy SK</p>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Top Up</p>
                  </div>
                </button>
                <button 
                  onClick={() => setActiveTab('gifts')}
                  className="bg-white p-8 rounded-[32px] shadow-sm flex flex-col gap-6 hover:shadow-md transition-all group active:scale-95"
                >
                  <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <GiftIcon size={28} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-lg">Gifts</p>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Send Joy</p>
                  </div>
                </button>
                <button 
                  onClick={() => setActiveTab('gifts_inventory')}
                  className="bg-white p-8 rounded-[32px] shadow-sm flex flex-col gap-6 hover:shadow-md transition-all group active:scale-95"
                >
                  <div className="w-14 h-14 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <History size={28} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-lg">My Gifts</p>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Inventory</p>
                  </div>
                </button>
              </div>

              {/* Recent Transactions */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="font-bold text-sm uppercase tracking-widest text-gray-400">Activity</h3>
                  <button className="text-[10px] font-bold text-gray-400 hover:text-black transition-colors">See All</button>
                </div>
                <div className="space-y-4">
                  {transactions.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-6 bg-white rounded-[28px] shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                        <div className={clsx(
                          "w-12 h-12 rounded-2xl flex items-center justify-center",
                          t.type === 'purchase' || t.type === 'transfer_in' || t.type === 'gift_receive' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                        )}>
                          {t.type === 'purchase' ? <Zap size={20} /> : 
                           t.type === 'transfer_in' ? <ArrowDownLeft size={20} /> : 
                           t.type === 'gift_receive' ? <GiftIcon size={20} /> :
                           t.type === 'gift_send' ? <GiftIcon size={20} /> :
                           t.type === 'withdrawal' ? <CreditCard size={20} /> :
                           <ArrowUpRight size={20} />}
                        </div>
                        <div>
                          <p className="font-bold text-base">
                            {t.type === 'purchase' ? 'Purchase' : 
                             t.type === 'transfer_in' ? 'Received' : 
                             t.type === 'gift_receive' ? 'Gift Received' :
                             t.type === 'gift_send' ? 'Gift Sent' :
                             t.type === 'withdrawal' ? 'Withdrawal' :
                             'Sent'}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] text-gray-400 font-semibold">{new Date(t.createdAt).toLocaleDateString()}</p>
                            {t.status === 'pending' && (
                              <span className="text-[8px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Pending</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={clsx(
                          "font-bold text-lg",
                          t.type === 'purchase' || t.type === 'transfer_in' || t.type === 'gift_receive' ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {t.type === 'purchase' || t.type === 'transfer_in' || t.type === 'gift_receive' ? '+' : '-'}{t.amount.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-gray-400 font-semibold">SK</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'inventory' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Your Artifacts</h2>
                <button onClick={() => setActiveTab('main')} className="text-sm font-bold text-gray-400">Back</button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {myNfts.length === 0 ? (
                  <div className="bg-white p-12 rounded-[32px] text-center">
                    <p className="text-gray-400 font-medium">No artifacts found.</p>
                  </div>
                ) : (
                  myNfts.map(nft => (
                    <div key={nft.id} className="bg-white p-6 rounded-[32px] shadow-sm flex items-center gap-6">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden relative">
                        <NFTVisual templateId={nft.templateId} className="w-full h-full" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{nft.name}</h3>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">#{nft.serialNumber}</p>
                      </div>
                      {user.selectedNftId === nft.id && (
                        <span className="bg-black text-white px-3 py-1 rounded-full text-[10px] font-bold">EQUIPPED</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'gifts_inventory' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Ваши подарки</h2>
                <button onClick={() => setActiveTab('main')} className="text-sm font-bold text-gray-400">Назад</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {userGifts.length === 0 ? (
                  <div className="col-span-2 bg-white p-12 rounded-[32px] text-center">
                    <p className="text-gray-400 font-medium">У вас пока нет подарков.</p>
                  </div>
                ) : (
                  userGifts.map(gift => {
                    const giftData = GIFTS.find(g => g.id === gift.giftId);
                    return (
                      <div 
                        key={gift.id} 
                        className="bg-white p-4 rounded-[32px] shadow-sm flex flex-col items-center gap-3 relative overflow-hidden"
                        style={gift.background ? { background: gift.background } : {}}
                      >
                        {gift.background && (
                          <motion.div 
                            className="absolute inset-0 opacity-30"
                            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                            transition={{ duration: 5, repeat: Infinity }}
                            style={{ background: gift.background, filter: 'blur(20px)' }}
                          />
                        )}
                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center relative z-10">
                          <motion.div 
                            className="text-5xl"
                            animate={
                              giftData?.animation === 'bounce' ? { y: [0, -10, 0] } :
                              giftData?.animation === 'launch' ? { y: [0, -20, 0], x: [0, 5, 0] } :
                              giftData?.animation === 'float' ? { y: [0, -5, 0], x: [0, 5, 0] } :
                              {}
                            }
                            transition={{ repeat: Infinity, duration: 2 }}
                          >
                            {giftData?.icon || "🎁"}
                          </motion.div>
                        </div>
                        <div className="text-center relative z-10">
                          <h3 className="font-bold text-sm">{giftData?.name}</h3>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            {gift.isPinned ? "Закреплено" : "В инвентаре"}
                          </p>
                        </div>
                        <div className="flex gap-2 w-full relative z-10">
                          <button 
                            onClick={() => handleTogglePin(gift.id, gift.isPinned)}
                            className={clsx(
                              "flex-1 py-2 rounded-xl text-[10px] font-bold uppercase transition-all",
                              gift.isPinned ? "bg-gray-100 text-gray-400" : "bg-black text-white"
                            )}
                          >
                            {gift.isPinned ? "Открепить" : "Закрепить"}
                          </button>
                          <button 
                            onClick={() => handleExchangeGift(gift.id)}
                            className="p-2 bg-gray-100 text-black rounded-xl hover:bg-gray-200 transition-colors"
                            title="Обменять на SK"
                          >
                            <WalletIcon size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'market' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Market</h2>
                <div className="flex bg-white rounded-full p-1 shadow-sm">
                  <button 
                    onClick={() => setMarketSubTab('primary')}
                    className={clsx("px-4 py-1.5 rounded-full text-xs font-bold transition-all", marketSubTab === 'primary' ? "bg-black text-white" : "text-gray-400")}
                  >
                    Mint
                  </button>
                  <button 
                    onClick={() => setMarketSubTab('secondary')}
                    className={clsx("px-4 py-1.5 rounded-full text-xs font-bold transition-all", marketSubTab === 'secondary' ? "bg-black text-white" : "text-gray-400")}
                  >
                    Secondary
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {marketSubTab === 'primary' ? (
                  NFT_TEMPLATES.map(tmpl => (
                    <div key={tmpl.id} className="bg-white p-6 rounded-[32px] shadow-sm space-y-4">
                      <div className="h-48 rounded-2xl overflow-hidden relative">
                        <NFTVisual templateId={tmpl.id} className="w-full h-full" />
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-bold text-xl">{tmpl.name}</h3>
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{tmpl.rarity}</p>
                        </div>
                        <button 
                          onClick={() => handleMint(tmpl)}
                          disabled={loading || (user.walletBalance || 0) < tmpl.price}
                          className="px-6 py-3 bg-black text-white rounded-2xl font-bold text-sm disabled:opacity-50"
                        >
                          {tmpl.price} SK
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  marketNfts.length === 0 ? (
                    <div className="bg-white p-12 rounded-[32px] text-center">
                      <p className="text-gray-400 font-medium">Market is empty.</p>
                    </div>
                  ) : (
                    marketNfts.map(nft => (
                      <div key={nft.id} className="bg-white p-6 rounded-[32px] shadow-sm flex items-center gap-6">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden relative">
                          <NFTVisual templateId={nft.templateId} className="w-full h-full" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{nft.name}</h3>
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">#{nft.serialNumber}</p>
                        </div>
                        <button 
                          onClick={() => handleBuySecondary(nft)}
                          disabled={loading || nft.ownerUid === user.uid}
                          className="px-6 py-3 bg-black text-white rounded-2xl font-bold text-sm disabled:opacity-50"
                        >
                          {nft.listPrice} SK
                        </button>
                      </div>
                    ))
                  )
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'transfer' && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setActiveTab('main')} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                  <ChevronRight className="rotate-180" size={20} />
                </button>
                <h2 className="text-2xl font-bold">Перевод по ID</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-4">Wallet ID получателя</label>
                  <input 
                    type="text" 
                    placeholder="SK-XXXXXX"
                    value={transferId}
                    onChange={(e) => setTransferId(e.target.value.toUpperCase())}
                    className="w-full h-16 bg-gray-50 dark:bg-zinc-900 rounded-2xl px-6 font-bold focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-4">Сумма SK</label>
                  <input 
                    type="number" 
                    placeholder="0"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full h-16 bg-gray-50 dark:bg-zinc-900 rounded-2xl px-6 font-bold text-2xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                  />
                  <p className="text-[10px] text-gray-500 ml-4">Доступно: {balance.toLocaleString()} SK</p>
                </div>

                <div className="bg-blue-500/5 p-4 rounded-2xl border border-blue-500/10 flex gap-3">
                  <Info size={18} className="text-blue-500 shrink-0" />
                  <p className="text-xs text-blue-500/80 leading-relaxed">
                    Переводы по ID моментальны. Обратите внимание, что каждый перевод влияет на рыночный курс SK Coin.
                  </p>
                </div>

                <button 
                  onClick={handleTransfer}
                  disabled={loading}
                  className="w-full h-16 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? 'Обработка...' : 'Подтвердить перевод'}
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'withdraw' && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setActiveTab('main')} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                  <ChevronRight className="rotate-180" size={20} />
                </button>
                <h2 className="text-2xl font-bold">Вывод на карту</h2>
              </div>

              <div className="bg-zinc-900 rounded-3xl p-6 text-white border border-zinc-800 mb-8">
                <div className="flex justify-between items-center mb-4">
                  <CreditCard size={32} className="text-zinc-500" />
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase text-zinc-500">Минимум</p>
                    <p className="font-bold">10,000 SK</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <input 
                      type="text" 
                      placeholder="0000 0000 0000 0000"
                      value={withdrawCard}
                      onChange={(e) => setWithdrawCard(e.target.value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                      maxLength={19}
                      className="w-full bg-transparent border-b border-zinc-700 py-2 text-xl font-mono tracking-widest focus:outline-none focus:border-white transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <input 
                      type="number" 
                      placeholder="Сумма вывода"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full bg-transparent border-b border-zinc-700 py-2 text-xl font-bold focus:outline-none focus:border-white transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">К получению (ориентировочно)</span>
                  <span className="font-bold text-emerald-500">
                    ${((parseInt(withdrawAmount) || 0) * currentPrice).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>Включая комиссию сети 2.5%</span>
                  <span>-${((parseInt(withdrawAmount) || 0) * currentPrice * 0.025).toFixed(2)}</span>
                </div>

                <button 
                  onClick={handleWithdraw}
                  disabled={loading}
                  className="w-full h-16 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? 'Выполняется...' : 'Вывести средства'}
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'buy' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setActiveTab('main')} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                  <ChevronRight className="rotate-180" size={20} />
                </button>
                <h2 className="text-2xl font-bold">Пополнение SK</h2>
              </div>

              <div className="bg-zinc-900 rounded-3xl p-8 text-white border border-zinc-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <CreditCard size={120} />
                </div>
                
                <div className="relative z-10 space-y-6">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Реквизиты для оплаты (Сбербанк)</p>
                    <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
                      <span className="text-xl font-mono font-bold tracking-wider">7 926 888 41 16</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText('79268884116');
                          setMessage({ text: 'Номер скопирован!', type: 'success' });
                        }}
                        className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                      >
                        <Copy size={20} className="text-emerald-500" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-2">Ваше Имя (как в банке)</label>
                      <input 
                        type="text" 
                        placeholder="Иван И."
                        value={buySenderName}
                        onChange={(e) => setBuySenderName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold focus:outline-none focus:border-white transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-2">Сумма SK для покупки</label>
                      <input 
                        type="number" 
                        placeholder="500"
                        value={buyAmountSk}
                        onChange={(e) => setBuyAmountSk(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold text-2xl focus:outline-none focus:border-white transition-all"
                      />
                    </div>
                    {parseInt(buyAmountSk) > 0 && (
                      <div className="bg-white/10 p-4 rounded-2xl border border-white/20 flex justify-between items-center">
                        <span className="text-sm font-bold text-zinc-300">К оплате:</span>
                        <span className="text-xl font-bold text-white">
                          {Math.ceil(parseInt(buyAmountSk) * 0.64)} ₽
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                    <p className="text-xs text-emerald-400 leading-relaxed">
                      Переведите указанную сумму на номер выше. После этого создайте заявку здесь. Архитектор проверит перевод и пополнит ваш баланс. (Курс: 500 SK = 320 ₽)
                    </p>
                  </div>

                  <button 
                    onClick={handleSubmitBuyRequest}
                    disabled={loading || !buyAmountSk || !buySenderName}
                    className="w-full h-16 bg-white text-black rounded-2xl font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {loading ? 'Отправка...' : 'Создать заявку'}
                  </button>
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800">
                <p className="text-[10px] text-gray-500 text-center uppercase font-bold tracking-widest">
                  Покупки без границ. Любая сумма SK доступна по запросу.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'gifts' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setActiveTab('main')} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                  <ChevronRight className="rotate-180" size={20} />
                </button>
                <h2 className="text-2xl font-bold">Магазин подарков</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {GIFTS.map(gift => (
                  <div key={gift.id} className="bg-zinc-50 dark:bg-zinc-900 rounded-3xl p-4 border border-zinc-100 dark:border-zinc-800 flex flex-col gap-4 group">
                    <div className="aspect-square rounded-2xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 relative flex items-center justify-center">
                      <motion.span 
                        className="text-5xl"
                        animate={
                          gift.animation === 'float' ? { y: [0, -10, 0] } :
                          gift.animation === 'pulse' ? { scale: [1, 1.2, 1] } :
                          gift.animation === 'launch' ? { y: [0, -20, 0], x: [0, 10, 0], opacity: [1, 0.8, 1] } :
                          gift.animation === 'bounce' ? { y: [0, -15, 0] } :
                          gift.animation === 'spin' ? { rotate: [0, 360] } :
                          gift.animation === 'pop' ? { scale: [1, 1.3, 1] } : {}
                        }
                        transition={{
                          duration: gift.animation === 'spin' ? 4 : 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        {gift.icon}
                      </motion.span>
                      <div className={clsx(
                        "absolute top-2 right-2 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest",
                        gift.rarity === 'common' ? "bg-gray-500 text-white" :
                        gift.rarity === 'rare' ? "bg-blue-500 text-white" :
                        gift.rarity === 'epic' ? "bg-purple-500 text-white" :
                        "bg-amber-500 text-white"
                      )}>
                        {gift.rarity}
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-sm truncate">{gift.name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Zap size={12} className="text-amber-500" />
                        <span className="font-bold text-xs">{gift.price.toLocaleString()} SK</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleSendGift(gift)}
                      disabled={loading}
                      className="w-full py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl text-xs font-bold hover:opacity-90 active:scale-95 transition-all"
                    >
                      Отправить
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-28 left-6 right-6 z-[100]"
          >
            <div className={clsx(
              "p-4 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-xl",
              message.type === 'success' ? "bg-emerald-500/90 border-emerald-400 text-white" : "bg-rose-500/90 border-rose-400 text-white"
            )}>
              {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <p className="font-bold text-sm flex-1">{message.text}</p>
              <button onClick={() => setMessage(null)}><X size={18} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
