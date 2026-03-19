import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Check, Copy, ArrowLeft, ShieldCheck, Zap, MessageSquare, Star, Crown } from 'lucide-react';
import { submitPaymentRequest } from '../services/firebase';
import { UserProfile } from '../types';

interface PremiumProps {
  user: UserProfile;
  onBack: () => void;
}

export const Premium: React.FC<PremiumProps> = ({ user, onBack }) => {
  const [senderName, setSenderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const cardNumber = "+7 926 888 41 16";

  const handleCopy = () => {
    navigator.clipboard.writeText(cardNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    if (!senderName.trim()) {
      alert("Пожалуйста, введите имя отправителя");
      return;
    }

    setLoading(true);
    try {
      await submitPaymentRequest(user.uid, senderName, 650, 0);
      setSuccess(true);
    } catch (e) {
      console.error(e);
      alert("Ошибка при отправке заявки");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-vk-bg text-black p-6 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
          <Check size={40} className="text-green-600" />
        </div>
        <h1 className="text-2xl font-bold mb-4 text-black">Заявка отправлена!</h1>
        <p className="text-sm text-vk-secondary mb-8 max-w-xs leading-relaxed">
          Ваша заявка на Premium-статус принята. Мы проверим перевод и активируем подписку в течение 24 часов.
        </p>
        <button 
          onClick={onBack} 
          className="w-full max-w-xs py-2.5 bg-vk-blue text-white rounded-lg font-bold text-sm hover:bg-blue-600 transition-colors shadow-sm"
        >
          Вернуться
        </button>
      </div>
    );
  }

  const benefits = [
    { icon: <ShieldCheck size={18} />, text: "Верифицированная галочка" },
    { icon: <Zap size={18} />, text: "Приоритет в ленте и поиске" },
    { icon: <MessageSquare size={18} />, text: "Закрепление комментариев" },
    { icon: <Star size={18} />, text: "Эксклюзивные артефакты" },
    { icon: <Crown size={18} />, text: "Отсутствие рекламы" },
  ];

  const isPremiumActive = user.role === 'Premium' && user.premiumUntil && user.premiumUntil > Date.now();

  if (isPremiumActive) {
    const expiryDate = new Date(user.premiumUntil!).toLocaleDateString('ru-RU');
    return (
      <div className="min-h-screen bg-white text-black p-6 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mb-6">
          <Crown size={40} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-4">Premium активен!</h1>
        <p className="text-sm text-gray-500 mb-8 max-w-xs">
          Ваш статус Premium действителен до <span className="font-bold text-black">{expiryDate}</span>.
          Повторная покупка будет доступна после истечения срока.
        </p>
        <Button onClick={onBack} className="max-w-xs">
          Вернуться
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black p-6 pb-24 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-md mx-auto">
        <button onClick={onBack} className="mb-8 p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors text-black">
          <ArrowLeft size={24} />
        </button>

        <div className="text-center mb-10">
          <div className="inline-block p-3 bg-black rounded-2xl mb-4 shadow-lg shadow-black/10">
            <Crown size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">SQUWIZ PREMIUM</h1>
          <p className="text-gray-500 text-sm">Станьте частью элиты нового поколения</p>
        </div>

        <div className="bg-white rounded-xl p-6 mb-8 border border-gray-200">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            Преимущества
          </h2>
          <div className="space-y-4">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
                <div className="text-black">{b.icon}</div>
                {b.text}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 mb-8 border border-gray-200">
          <h2 className="text-base font-bold mb-4">Оплата</h2>
          <div className="space-y-6">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-2">Реквизиты</p>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <p className="text-[10px] text-gray-400">Сбербанк</p>
                  <p className="font-mono font-bold text-sm">{cardNumber}</p>
                </div>
                <button 
                  onClick={handleCopy}
                  className="p-2 bg-white rounded-lg hover:bg-gray-50 transition-colors text-black border border-gray-200"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-2">Инструкция</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Переведите <span className="text-black font-bold">650₽</span> за 1 месяц. В поле ниже впишите ваше имя как в банке для подтверждения платежа.
              </p>
            </div>

            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-2">Имя отправителя</p>
              <input 
                placeholder="Иван И." 
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none"
              />
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSubmit} 
          isLoading={loading}
        >
          Я оплатил, отправить заявку
        </Button>
      </div>
    </div>
  );
};
