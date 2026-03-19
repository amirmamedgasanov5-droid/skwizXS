import React, { useEffect, useState } from 'react';
import { subscribeToVerificationRequests, approveVerification, setMaintenanceMode, subscribeToSystemStatus, subscribeToAppStats, subscribeToReports, resolveReport, deletePost, banUser, subscribeToPaymentRequests, approvePaymentRequest, setSkCoinPrice, subscribeToWithdrawalRequests, approveWithdrawalRequest } from '../services/firebase';
import { VerificationRequest, Report, PaymentRequest, WithdrawalRequest } from '../types';
import { Check, X, Hammer, AlertTriangle, Users, Globe, Flag, Trash2, Ban, CreditCard, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const AdminConsole: React.FC = () => {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [skPrice, setSkPrice] = useState(0.000123);
  const [stats, setStats] = useState({ total: 0, online: 0 });
  const [activeTab, setActiveTab] = useState<'requests' | 'reports' | 'payments' | 'withdrawals'>('requests');

  useEffect(() => {
    const unsubscribeReq = subscribeToVerificationRequests((data) => setRequests(data));
    const unsubscribePay = subscribeToPaymentRequests((data) => setPaymentRequests(data));
    const unsubscribeWith = subscribeToWithdrawalRequests((data) => setWithdrawalRequests(data));
    const unsubscribeSys = subscribeToSystemStatus((data) => {
      setIsMaintenance(data.maintenanceMode);
      setSkPrice(data.skCoinPrice);
    });
    const unsubscribeStats = subscribeToAppStats((data) => setStats(data));
    const unsubscribeReports = subscribeToReports((data) => setReports(data));
    
    return () => {
      unsubscribeReq();
      unsubscribePay();
      unsubscribeWith();
      unsubscribeSys();
      unsubscribeStats();
      unsubscribeReports();
    };
  }, []);

  const handleApprove = async (req: VerificationRequest) => {
    await approveVerification(req.id, req.uid);
  };

  const handleApprovePayment = async (req: PaymentRequest) => {
    const message = req.amountSk 
      ? `Подтвердить оплату от ${req.senderName}? Пользователь получит ${req.amountSk.toLocaleString()} SK.`
      : `Подтвердить оплату от ${req.senderName}? Пользователь получит Premium.`;

    if (window.confirm(message)) {
      await approvePaymentRequest(req.id, req.uid, req.amountSk);
      alert("Оплата подтверждена!");
    }
  };

  const handleApproveWithdrawal = async (req: WithdrawalRequest) => {
    if (window.confirm(`Подтвердить вывод ${req.amount.toLocaleString()} SK на карту ${req.card}?`)) {
      await approveWithdrawalRequest(req.id);
      alert("Вывод подтвержден!");
    }
  };

  const toggleMaintenance = async () => {
    const newState = !isMaintenance;
    if (window.confirm(newState ? "Включить технические работы? Пользователи не смогут войти." : "Выключить технические работы?")) {
      await setMaintenanceMode(newState);
    }
  };

  const handleDismissReport = async (reportId: string) => {
      await resolveReport(reportId);
  };

  const handleDeletePost = async (report: Report) => {
      if(window.confirm("Удалить этот пост?")) {
          try {
             await deletePost(report.targetId);
             await resolveReport(report.id);
             alert("Пост удален.");
          } catch(e) {
             console.error(e);
             alert("Ошибка удаления.");
          }
      }
  };

  const handleBanUser = async (report: Report) => {
      if(window.confirm("ЗАБАНИТЬ ПОЛЬЗОВАТЕЛЯ? Аккаунт будет помечен как BANNED.")) {
          try {
              await banUser(report.targetId);
              await resolveReport(report.id);
              alert("Пользователь забанен.");
          } catch (e) {
              console.error(e);
              alert("Ошибка бана.");
          }
      }
  };

  const handlePriceChange = async (delta: number) => {
    const newPrice = Math.max(0.000001, skPrice + delta);
    await setSkCoinPrice(newPrice);
  };

  const handlePriceSet = async () => {
    const val = window.prompt("Введите новый курс SK Coin:", skPrice.toString());
    if (val !== null) {
      const num = parseFloat(val);
      if (!isNaN(num) && num > 0) {
        await setSkCoinPrice(num);
      }
    }
  };

  return (
    <div className="p-6 pb-24 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Консоль Архитектора</h1>
      
      {/* Network Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
         <div className="bg-black text-white p-5 rounded-[24px]">
             <div className="flex items-center gap-2 text-gray-400 mb-2">
                 <Users size={16} />
                 <span className="text-xs font-bold uppercase tracking-widest">Всего в матрице</span>
             </div>
             <p className="text-3xl font-bold">{stats.total}</p>
         </div>
         <div className="bg-white border border-gray-200 p-5 rounded-[24px]">
             <div className="flex items-center gap-2 text-gray-500 mb-2">
                 <Globe size={16} />
                 <span className="text-xs font-bold uppercase tracking-widest">В сети</span>
             </div>
             <p className="text-3xl font-bold text-green-600 flex items-center gap-2">
               {stats.online}
               <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
             </p>
         </div>
      </div>

      {/* Maintenance Controls */}
      <div className="bg-gray-50 border border-gray-200 rounded-[24px] p-6 mb-8">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className={`p-3 rounded-full ${isMaintenance ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  <Hammer size={24} />
               </div>
               <div>
                  <h3 className="font-bold text-lg">Технические работы</h3>
                  <p className="text-sm text-gray-500">
                    {isMaintenance ? "Активен. Доступ закрыт." : "Система работает штатно."}
                  </p>
               </div>
            </div>
            <button 
               onClick={toggleMaintenance}
               className={`px-4 py-2 rounded-full font-bold text-sm transition-colors ${isMaintenance ? 'bg-black text-white hover:bg-gray-800' : 'bg-red-500 text-white hover:bg-red-600'}`}
            >
               {isMaintenance ? "Выключить" : "Запустить"}
            </button>
         </div>
         {isMaintenance && (
           <div className="mt-4 flex items-center gap-2 text-xs text-red-500 font-medium p-3 bg-red-50 rounded-xl">
             <AlertTriangle size={14} />
             <span>Вы видите приложение, потому что вы Админ. Остальные видят заглушку.</span>
           </div>
         )}
      </div>

      {/* Market Control */}
      <div className="bg-zinc-900 text-white rounded-[24px] p-6 mb-8 border border-zinc-800 shadow-xl">
          <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/20 text-emerald-500 rounded-full">
                      <Zap size={24} />
                  </div>
                  <div>
                      <h3 className="font-bold text-lg">Управление Рынком</h3>
                      <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">SK Coin Exchange Rate</p>
                  </div>
              </div>
              <div className="text-right">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Текущий курс</p>
                  <p className="text-2xl font-bold font-mono">${skPrice.toFixed(6)}</p>
              </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => handlePriceChange(0.00001)}
                className="flex flex-col items-center justify-center p-4 bg-zinc-800 rounded-2xl hover:bg-zinc-700 transition-colors group"
              >
                  <TrendingUp className="text-emerald-500 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold">+0.00001</span>
              </button>
              <button 
                onClick={() => handlePriceChange(-0.00001)}
                className="flex flex-col items-center justify-center p-4 bg-zinc-800 rounded-2xl hover:bg-zinc-700 transition-colors group"
              >
                  <TrendingDown className="text-rose-500 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold">-0.00001</span>
              </button>
              <button 
                onClick={handlePriceSet}
                className="flex flex-col items-center justify-center p-4 bg-zinc-800 rounded-2xl hover:bg-zinc-700 transition-colors group"
              >
                  <span className="text-xs font-bold text-emerald-500">SET</span>
                  <span className="text-[10px] opacity-50">CUSTOM</span>
              </button>
              <button 
                onClick={() => setSkCoinPrice(0.000123)}
                className="flex flex-col items-center justify-center p-4 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-colors col-span-3 mt-2"
              >
                  <span className="text-xs font-bold uppercase tracking-widest">Fix Price to $0.000123</span>
                  <span className="text-[8px] opacity-70">(10,000 SK = $1.23)</span>
              </button>
          </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
          <button 
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-full font-bold text-sm ${activeTab === 'requests' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}
          >
             Верификация ({requests.length})
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-full font-bold text-sm ${activeTab === 'reports' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}
          >
             Жалобы ({reports.length})
          </button>
          <button 
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 rounded-full font-bold text-sm ${activeTab === 'payments' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}
          >
             Оплаты ({paymentRequests.length})
          </button>
          <button 
            onClick={() => setActiveTab('withdrawals')}
            className={`px-4 py-2 rounded-full font-bold text-sm ${activeTab === 'withdrawals' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}
          >
             Выводы ({withdrawalRequests.length})
          </button>
      </div>

      {activeTab === 'requests' && (
        <div className="space-y-4">
            {requests.length === 0 ? (
            <p className="text-gray-400">Нет активных заявок.</p>
            ) : (
            requests.map((req) => (
                <div key={req.id} className="bg-white border border-gray-100 rounded-[24px] p-4 flex justify-between items-center shadow-sm">
                <div>
                    <p className="font-bold">{req.handle}</p>
                    <p className="text-xs text-gray-400 font-mono">{req.uid}</p>
                </div>
                <div className="flex gap-2">
                    <button 
                    onClick={() => handleApprove(req)}
                    className="p-2 bg-black text-white rounded-full hover:bg-gray-800"
                    >
                    <Check size={18} />
                    </button>
                </div>
                </div>
            ))
            )}
        </div>
      )}

      {activeTab === 'reports' && (
          <div className="space-y-4">
              {reports.length === 0 ? (
                 <p className="text-gray-400">В Багдаде все спокойно.</p>
              ) : (
                  reports.map(report => (
                      <div key={report.id} className="bg-white border border-gray-100 rounded-[24px] p-5 shadow-sm">
                          <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${report.type === 'post' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                                    {report.type === 'post' ? 'Пост' : 'Пользователь'}
                                </span>
                                <span className="text-xs text-gray-400">{formatDistanceToNow(report.createdAt, { addSuffix: true })}</span>
                              </div>
                              {report.status === 'resolved' && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded text-[10px] font-bold uppercase">
                                    Решено
                                </span>
                              )}
                          </div>
                          
                          <div className="mb-4">
                              <p className="font-bold text-sm mb-1">Причина: <span className="text-red-500">{report.reason}</span></p>
                              {report.targetContent && (
                                  <div className="bg-gray-50 p-2 rounded-lg text-xs italic text-gray-600 border-l-2 border-gray-300">
                                      "{report.targetContent}"
                                  </div>
                              )}
                              {report.targetHandle && (
                                  <p className="text-sm">Цель: <span className="font-bold">{report.targetHandle}</span></p>
                              )}
                              <p className="text-[10px] text-gray-400 mt-1 font-mono">ID: {report.targetId}</p>
                          </div>

                          {report.status !== 'resolved' && (
                            <div className="flex gap-2 justify-end">
                                <button 
                                  onClick={() => handleDismissReport(report.id)}
                                  className="px-3 py-2 bg-gray-100 rounded-lg text-xs font-bold hover:bg-gray-200"
                                >
                                    Отклонить
                                </button>
                                
                                {report.type === 'post' && (
                                    <button 
                                      onClick={() => handleDeletePost(report)}
                                      className="px-3 py-2 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 flex items-center gap-1"
                                    >
                                        <Trash2 size={12} /> Удалить пост
                                    </button>
                                )}
                                
                                {report.type === 'user' && (
                                    <button 
                                      onClick={() => handleBanUser(report)}
                                      className="px-3 py-2 bg-black text-white rounded-lg text-xs font-bold hover:bg-gray-800 flex items-center gap-1"
                                    >
                                        <Ban size={12} /> БАН
                                    </button>
                                )}
                            </div>
                          )}
                      </div>
                  ))
              )}
          </div>
      )}

      {activeTab === 'payments' && (
          <div className="space-y-4">
              {paymentRequests.length === 0 ? (
                  <p className="text-gray-400">Нет новых оплат.</p>
              ) : (
                  paymentRequests.map(req => (
                      <div key={req.id} className="bg-white border border-gray-100 rounded-[24px] p-5 shadow-sm flex justify-between items-center">
                          <div>
                              <div className="flex items-center gap-2 mb-1">
                                  <CreditCard size={14} className="text-orange-500" />
                                  <p className="font-bold text-lg">{req.amount}₽</p>
                                  {req.amountSk && (
                                      <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded text-[10px] font-bold uppercase">
                                          +{req.amountSk.toLocaleString()} SK
                                      </span>
                                  )}
                              </div>
                              <p className="text-sm">Отправитель: <span className="font-bold">{req.senderName}</span></p>
                              <p className="text-[10px] text-gray-400 font-mono mt-1">UID: {req.uid}</p>
                              <p className="text-[10px] text-gray-400 mt-1">{formatDistanceToNow(req.createdAt, { addSuffix: true })}</p>
                          </div>
                          <button 
                            onClick={() => handleApprovePayment(req)}
                            className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20"
                          >
                              <Check size={20} />
                          </button>
                      </div>
                  ))
              )}
          </div>
      )}

      {activeTab === 'withdrawals' && (
          <div className="space-y-4">
              {withdrawalRequests.length === 0 ? (
                  <p className="text-gray-400">Нет новых заявок на вывод.</p>
              ) : (
                  withdrawalRequests.map(req => (
                      <div key={req.id} className="bg-white border border-gray-100 rounded-[24px] p-5 shadow-sm flex justify-between items-center">
                          <div>
                              <div className="flex items-center gap-2 mb-1">
                                  <TrendingDown size={14} className="text-rose-500" />
                                  <p className="font-bold text-lg">{req.amount.toLocaleString()} SK</p>
                              </div>
                              <p className="text-sm">Карта: <span className="font-mono font-bold">{req.card}</span></p>
                              <p className="text-[10px] text-gray-400 font-mono mt-1">UID: {req.uid}</p>
                              <p className="text-[10px] text-gray-400 mt-1">{formatDistanceToNow(req.createdAt, { addSuffix: true })}</p>
                          </div>
                          <button 
                            onClick={() => handleApproveWithdrawal(req)}
                            className="p-3 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20"
                          >
                              <Check size={20} />
                          </button>
                      </div>
                  ))
              )}
          </div>
      )}
    </div>
  );
};
