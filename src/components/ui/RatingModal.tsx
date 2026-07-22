'use client';

import { useState } from 'react';
import { useOrderStore } from '@/store';
import { toast } from 'sonner';

interface RatingModalProps {
  orderId: string;
  tableId: number | null;
  onClose: () => void;
}

export function RatingModal({ orderId, tableId, onClose }: RatingModalProps) {
  const { rateOrder } = useOrderStore();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error('لطفاً امتیاز انتخاب کنید');
      return;
    }
    rateOrder(orderId, rating, note || undefined);
    toast.success('ممنون از امتیاز شما! ⭐');
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  const tableLabel = tableId ? `میز ${tableId}` : 'سفارش';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl w-full max-w-md mx-4 p-6 animate-slideUp">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">😊</div>
          <h2 className="text-xl font-bold text-white mb-2">
            نظر شما درباره {tableLabel}
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            لطفاً تجربه خود را با ما به اشتراک بگذارید
          </p>
        </div>

        {/* Stars Rating */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="text-5xl transition-transform hover:scale-110 active:scale-95"
              >
                <span className={`
                  ${(hoverRating || rating) >= star 
                    ? 'text-yellow-400' 
                    : 'text-gray-600'
                  }
                  transition-colors
                `}>
                  ★
                </span>
              </button>
            ))}
          </div>
          <p className="text-center mt-3 text-sm text-[var(--color-text-secondary)]">
            {rating === 0 && 'روی ستاره‌ها کلیک کنید'}
            {rating === 1 && '😞 بسیار ضعیف'}
            {rating === 2 && '😕 ضعیف'}
            {rating === 3 && '😐 متوسط'}
            {rating === 4 && '😊 خوب'}
            {rating === 5 && '😍 عالی!'}
          </p>
        </div>

        {/* Note Input */}
        <div className="mb-6">
          <label className="block text-sm text-[var(--color-text-secondary)] mb-2">
            توضیحات (اختیاری)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="نظر یا پیشنهاد خود را بنویسید..."
            className="w-full h-24 p-3 bg-[var(--color-surface-light)] border border-[var(--color-border)] rounded-xl text-white placeholder:text-[var(--color-text-muted)] resize-none focus:outline-none focus:border-[var(--color-accent)] transition-colors"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 py-3 bg-[var(--color-surface-light)] hover:bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] rounded-xl font-medium transition-all"
          >
            بعداً
          </button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${
              rating === 0
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-white'
            }`}
          >
            ثبت امتیاز
          </button>
        </div>
      </div>
    </div>
  );
}

export default RatingModal;
