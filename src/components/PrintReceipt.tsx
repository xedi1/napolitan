'use client';

import { useOrderStore } from '@/store';
import { formatPrice, formatTime } from '@/lib/utils';
import { useEffect } from 'react';

interface PrintReceiptProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrintReceipt({ isOpen, onClose }: PrintReceiptProps) {
  const { currentOrder } = useOrderStore();

  useEffect(() => {
    if (isOpen && currentOrder && currentOrder.items.length > 0) {
      // Auto-trigger print dialog after a short delay (only if there are items)
      const timer = setTimeout(() => {
        window.print();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentOrder]);

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
  };

  const hasItems = currentOrder && currentOrder.items.length > 0;

  return (
    <>
      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-receipt, #print-receipt * {
            visibility: visible;
          }
          #print-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            padding: 5mm;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
      `}</style>

      {/* Receipt Preview Modal */}
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80"
        onClick={handleClose}
      >
        <div 
          className="bg-white text-black rounded-lg overflow-hidden shadow-2xl max-w-md w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-[var(--accent)] p-4 text-center">
            <h2 className="text-xl font-bold text-black">فاکتور</h2>
            <p className="text-sm text-black/70">کافه ناپلیتین</p>
          </div>

          {/* Receipt Content */}
          <div id="print-receipt" className="p-4 font-mono text-sm bg-white text-black">
            {!hasItems ? (
              /* Empty State */
              <div className="text-center py-8">
                <p className="text-4xl mb-4">🧾</p>
                <p className="font-bold text-lg mb-2">فاکتور خالی</p>
                <p className="text-gray-500 text-sm">هنوز آیتمی به سفارش اضافه نشده</p>
              </div>
            ) : (
              <>
                {/* Logo Header */}
                <div className="text-center border-b border-dashed border-gray-300 pb-3 mb-3">
                  {/* Napolitan Logo with styled text */}
                  <div className="flex justify-center items-center mb-2">
                    <img 
                      src="/assets/logoNAp.png" 
                      alt="Logo" 
                      className="h-16 object-contain"
                    />
                  </div>
                  <div className="text-center mb-2">
                    <span style={{ fontStyle: 'italic', fontWeight: 'bold', fontSize: '18px', letterSpacing: '2px' }}>
                      <span style={{ color: '#228B22' }}>Nap</span>
                      <span style={{ color: '#FFFFFF', textShadow: '0 0 1px #000' }}>oli</span>
                      <span style={{ color: '#DC143C' }}>tan</span>
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">کافه ناپلیتین</p>
                  <p className="text-xs text-gray-500">طبقه اول - کافه ناپل</p>
                  <p className="text-xs text-gray-500 mt-1">
                    تاریخ: {new Date().toLocaleDateString('fa-IR')} | ساعت: {formatTime(Date.now())}
                  </p>
                </div>

                {/* Table Info */}
                <div className="border-b border-dashed border-gray-300 pb-3 mb-3">
                  <div className="flex justify-between">
                    <span>میز:</span>
                    <span className="font-bold">شماره {currentOrder.tableId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>شماره فاکتور:</span>
                    <span>#{currentOrder.id.slice(-6).toUpperCase()}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="border-b border-dashed border-gray-300 pb-3 mb-3">
                  <div className="flex justify-between font-bold border-b border-gray-200 pb-1 mb-1">
                    <span>کالا</span>
                    <span>مبلغ</span>
                  </div>
                  {currentOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between py-1">
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <span>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-b border-dashed border-gray-300 pb-3 mb-3">
                  <div className="flex justify-between">
                    <span>جمع کل:</span>
                    <span>{formatPrice(currentOrder.subtotal)}</span>
                  </div>
                  {currentOrder.discount && currentOrder.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>تخفیف:</span>
                      <span>- {formatPrice(currentOrder.discount)}</span>
                    </div>
                  )}
                  {currentOrder.tax && currentOrder.tax > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>مالیات (۹٪):</span>
                      <span>+ {formatPrice(currentOrder.tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-2 mt-2">
                    <span>مبلغ نهایی:</span>
                    <span className="text-green-600">{formatPrice(currentOrder.total)}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-gray-500">
                  <p>با تشکر از سفارش شما</p>
                  <p>☕ به ما فرصت سرویس‌دهی دادید</p>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 bg-gray-100 flex gap-3">
            <button
              onClick={hasItems ? () => window.print() : handleClose}
              className={`flex-1 py-3 font-bold rounded-lg transition-opacity flex items-center justify-center gap-2 ${
                hasItems 
                  ? 'bg-[var(--accent)] text-black hover:opacity-90' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!hasItems}
            >
              {hasItems ? '🖨️ چاپ فاکتور' : 'بستن'}
            </button>
            {!hasItems && (
              <button
                onClick={handleClose}
                className="flex-1 py-3 bg-gray-300 text-black font-bold rounded-lg hover:bg-gray-400 transition-colors"
              >
                بستن
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
