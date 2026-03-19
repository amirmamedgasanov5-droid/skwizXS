import React from 'react';
import { ArrowLeft, Shield, Zap, Eye, Scale, Ban } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface RulesProps {
  onBack: () => void;
}

export const Rules: React.FC<RulesProps> = ({ onBack }) => {
  const rules = [
    {
      icon: <Zap className="text-yellow-500" />,
      title: "СИГНАЛ СВЯЩЕНЕН",
      description: "Не загрязняйте ленту шумом. SQUWIZ — это пространство для качественного контента и важных сигналов. Спам и низкокачественный контент будут удалены."
    },
    {
      icon: <Shield className="text-blue-500" />,
      title: "УВАЖЕНИЕ К ЭЛИТЕ",
      description: "Premium-пользователи и верифицированные сущности — столпы нашего сообщества. Соблюдайте субординацию и этику общения."
    },
    {
      icon: <Eye className="text-purple-500" />,
      title: "ПУЛЬС ИСТИНЫ",
      description: "SQUWIZ — это территория правды. Распространение заведомо ложной информации или манипуляция мнением ведет к немедленному отключению от матрицы."
    },
    {
      icon: <Scale className="text-green-500" />,
      title: "ЭКОНОМИЧЕСКАЯ ЦЕЛОСТНОСТЬ",
      description: "Все транзакции (SK Coins, NFT, Реклама) должны проходить строго по протоколам системы. Попытки обхода или мошенничества караются баном."
    },
    {
      icon: <Ban className="text-red-500" />,
      title: "ВЛАСТЬ АРХИТЕКТОРА",
      description: "Архитектор оставляет за собой право устранять любые аномалии. Жалобы рассматриваются беспристрастно, решение окончательно."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-black p-6 pb-24 animate-in fade-in duration-500">
      <div className="max-w-md mx-auto">
        <button onClick={onBack} className="mb-8 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
          <ArrowLeft size={24} />
        </button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-black tracking-tighter mb-2 italic">КОДЕКС SQUWIZ</h1>
          <p className="text-gray-500 text-sm uppercase tracking-widest font-bold">Правила реальности</p>
        </div>

        <div className="space-y-8">
          {rules.map((rule, i) => (
            <div key={i} className="flex gap-4 group">
              <div className="flex-shrink-0 w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                {rule.icon}
              </div>
              <div>
                <h3 className="font-black text-sm mb-1 tracking-tight">{rule.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {rule.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 p-6 bg-black text-white rounded-[32px] text-center">
          <p className="text-xs font-mono uppercase tracking-[0.2em] mb-4 opacity-50">System Status: Protected</p>
          <p className="text-sm mb-6 italic">«Порядок — это не отсутствие хаоса, а умение им управлять.»</p>
          <Button onClick={onBack} className="w-full bg-white text-black hover:bg-gray-200">Я принимаю кодекс</Button>
        </div>
      </div>
    </div>
  );
};
