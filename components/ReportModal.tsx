import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button';

interface ReportModalProps {
  onClose: () => void;
  onSubmit: (reason: string) => void;
  type: 'post' | 'user';
}

export const ReportModal: React.FC<ReportModalProps> = ({ onClose, onSubmit, type }) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customText, setCustomText] = useState('');

  const reasons = [
    'Спам или реклама',
    'Оскорбления и травля',
    'Мошенничество',
    'Враждебные высказывания',
    'Нелегальный контент',
    'Другое'
  ];

  const handleSubmit = () => {
    if (!selectedReason) return;
    
    let finalReason = selectedReason;
    if (selectedReason === 'Другое') {
        if (!customText.trim()) {
            alert("Пожалуйста, опишите причину.");
            return;
        }
        finalReason = `Другое: ${customText}`;
    }

    onSubmit(finalReason);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-[32px] p-6 relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 text-red-500">
                <AlertTriangle size={24} />
                <h2 className="text-xl font-bold text-black dark:text-white">Пожаловаться</h2>
            </div>
            <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <X size={20} className="dark:text-white" />
            </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
            Почему вы хотите пожаловаться на этот {type === 'post' ? 'сигнал' : 'профиль'}?
        </p>

        <div className="space-y-2 mb-6">
            {reasons.map((r) => (
                <button
                    key={r}
                    onClick={() => setSelectedReason(r)}
                    className={`w-full p-4 rounded-xl text-left text-sm font-bold transition-all border ${
                        selectedReason === r 
                        ? 'bg-black text-white border-black dark:bg-white dark:text-black' 
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                >
                    {r}
                </button>
            ))}
        </div>

        {selectedReason === 'Другое' && (
            <div className="mb-6 animate-in slide-in-from-top-2 fade-in">
                <textarea 
                    className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-sm outline-none border-2 border-transparent focus:border-black dark:focus:border-white resize-none h-24 dark:text-white"
                    placeholder="Опишите проблему подробно..."
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                />
            </div>
        )}

        <Button 
            onClick={handleSubmit} 
            disabled={!selectedReason}
            variant="danger"
        >
            Отправить жалобу
        </Button>
      </div>
    </div>
  );
};