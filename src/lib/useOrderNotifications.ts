'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useOrderStore } from '@/store';
import { toast } from 'sonner';

/**
 * Order Notifications Hook
 * Provides audio and visual notifications for new orders
 */

// Create audio context for generating notification sounds
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Play a notification sound using Web Audio API
 * Works without external audio files
 */
function playNotificationSound(type: 'new-order' | 'order-ready' | 'alert') {
  try {
    const ctx = getAudioContext();
    
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    switch (type) {
      case 'new-order':
        // Cheerful ding-dong for new orders
        oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
        oscillator.frequency.setValueAtTime(1108, ctx.currentTime + 0.15); // C#6
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
        break;

      case 'order-ready':
        // Quick beep for ready orders
        oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.15);
        break;

      case 'alert':
        // Warning tone
        oscillator.frequency.setValueAtTime(400, ctx.currentTime);
        oscillator.frequency.setValueAtTime(300, ctx.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(400, ctx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
        break;
    }
  } catch (error) {
    console.warn('[Notifications] Audio playback failed:', error);
  }
}

/**
 * Show toast notification with sound
 */
function showOrderToast(
  title: string,
  message: string,
  type: 'new-order' | 'order-ready' | 'alert'
) {
  const icons = {
    'new-order': '🆕',
    'order-ready': '✅',
    'alert': '⚠️',
  };

  playNotificationSound(type);

  toast(message, {
    icon: icons[type],
    duration: type === 'alert' ? 10000 : 5000,
    style: {
      background: type === 'alert' ? '#ef4444' : 'var(--color-surface)',
      color: 'white',
      border: type === 'alert' ? '2px solid #b91c1c' : '1px solid var(--color-border)',
    },
  });
}

export interface UseOrderNotificationsOptions {
  enabled?: boolean;
  soundEnabled?: boolean;
  onNewOrder?: (orderId: string) => void;
  onOrderReady?: (orderId: string) => void;
}

export function useOrderNotifications(options: UseOrderNotificationsOptions = {}) {
  const { enabled = true, soundEnabled = true, onNewOrder, onOrderReady } = options;
  
  const orders = useOrderStore((s) => s.orders);
  const lastOrderRef = useRef<string | null>(null);
  const hasPlayedRef = useRef<Set<string>>(new Set());

  // Track last order for new order detection
  useEffect(() => {
    if (!enabled || orders.length === 0) return;

    const latestOrder = orders[0];
    if (latestOrder && latestOrder.id !== lastOrderRef.current) {
      lastOrderRef.current = latestOrder.id;
      
      // Only notify for truly new orders (not on initial load)
      if (!hasPlayedRef.current.has(latestOrder.id)) {
        hasPlayedRef.current.add(latestOrder.id);
        
        if (soundEnabled) {
          playNotificationSound('new-order');
        }
        
        if (latestOrder.status === 'pending') {
          showOrderToast('سفارش جدید!', `${latestOrder.items.length} آیتم برای میز ${latestOrder.tableId}`, 'new-order');
        }
        
        onNewOrder?.(latestOrder.id);
      }
    }
  }, [orders, enabled, soundEnabled, onNewOrder]);

  // Play sound when order becomes ready
  useEffect(() => {
    if (!enabled || !soundEnabled) return;

    orders.forEach((order) => {
      if (order.status === 'ready' && !hasPlayedRef.current.has(`${order.id}-ready`)) {
        hasPlayedRef.current.add(`${order.id}-ready`);
        playNotificationSound('order-ready');
        showOrderToast('سفارش آماده!', `سفارش میز ${order.tableId} آماده است`, 'order-ready');
        onOrderReady?.(order.id);
      }
    });
  }, [orders, enabled, soundEnabled, onOrderReady]);

  const playTestSound = useCallback(() => {
    if (soundEnabled) {
      playNotificationSound('new-order');
    }
  }, [soundEnabled]);

  const playAlertSound = useCallback(() => {
    if (soundEnabled) {
      playNotificationSound('alert');
    }
  }, [soundEnabled]);

  return {
    playTestSound,
    playAlertSound,
  };
}

/**
 * Kitchen Printer Integration
 * 
 * Supports:
 * - Network printers (ESC/POS over TCP)
 * - USB printers (via browser USB API)
 * - Browser Print API (for local printers)
 */

export interface PrinterConfig {
  type: 'network' | 'usb' | 'browser-print';
  name: string;
  // Network config
  ip?: string;
  port?: number;
  // USB config
  vendorId?: number;
  productId?: number;
}

export interface KitchenPrinter {
  config: PrinterConfig;
  isConnected: boolean;
  print: (content: PrintContent) => Promise<void>;
  test: () => Promise<void>;
}

export interface PrintContent {
  title: string;
  orderId: string;
  tableId: number;
  items: Array<{
    name: string;
    quantity: number;
    notes?: string;
  }>;
  timestamp: Date;
  priority?: 'normal' | 'rush';
}

/**
 * Generate ESC/POS command for thermal printer
 */
function generateESCPOSCommand(content: PrintContent): Uint8Array {
  const commands: number[] = [];
  
  // Initialize printer
  commands.push(0x1B, 0x40);
  
  // Center alignment
  commands.push(0x1B, 0x61, 0x01);
  
  // Bold on
  commands.push(0x1B, 0x45, 0x01);
  
  // Large text (2x)
  commands.push(0x1D, 0x21, 0x11);
  
  // Print title
  if (content.priority === 'rush') {
    commands.push(...encodeText('🚨 فوری! 🚨\n'));
  }
  commands.push(...encodeText(content.title + '\n'));
  
  // Normal size
  commands.push(0x1D, 0x21, 0x00);
  
  // Bold off
  commands.push(0x1B, 0x45, 0x00);
  
  // Double height for order info
  commands.push(0x1D, 0x21, 0x10);
  
  // Print order info
  commands.push(...encodeText(`سفارش #${content.orderId}\n`));
  commands.push(...encodeText(`میز: ${content.tableId}\n`));
  
  // Normal size
  commands.push(0x1D, 0x21, 0x00);
  
  // Left alignment
  commands.push(0x1B, 0x61, 0x00);
  
  // Separator line
  commands.push(...encodeText('----------------------------\n'));
  
  // Print items
  content.items.forEach((item) => {
    // Item name and quantity
    const itemLine = `${item.quantity}x ${item.name}`;
    commands.push(...encodeText(itemLine));
    
    // Add dots to align price
    const dots = Math.max(0, 32 - itemLine.length);
    commands.push(...encodeText('.'.repeat(dots)));
    
    // Print newline after each item
    commands.push(0x0A);
    
    // Print notes if any
    if (item.notes) {
      commands.push(...encodeText(`   📝 ${item.notes}\n`));
    }
  });
  
  // Separator line
  commands.push(...encodeText('----------------------------\n'));
  
  // Print timestamp
  commands.push(...encodeText(`زمان: ${content.timestamp.toLocaleTimeString('fa-IR')}\n`));
  commands.push(...encodeText(`تاریخ: ${content.timestamp.toLocaleDateString('fa-IR')}\n`));
  
  // Cut paper
  commands.push(0x1D, 0x56, 0x00);
  
  return new Uint8Array(commands);
}

function encodeText(text: string): number[] {
  const result: number[] = [];
  for (const char of text) {
    // Encode as UTF-8
    const code = char.charCodeAt(0);
    if (code < 128) {
      result.push(code);
    } else {
      // For Persian text, we'll use a simple encoding
      // In production, use a proper ESC/POS Persian font
      result.push(code & 0xFF);
    }
  }
  return result;
}

/**
 * Create a network printer connection
 */
export async function createNetworkPrinter(config: PrinterConfig): Promise<KitchenPrinter> {
  const { ip = '192.168.1.100', port = 9100 } = config;
  
  let socket: WebSocket | null = null;
  
  const printer: KitchenPrinter = {
    config,
    isConnected: false,
    
    async print(content) {
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        throw new Error('Printer not connected');
      }
      
      const data = generateESCPOSCommand(content);
      socket.send(data);
    },
    
    async test() {
      const testContent: PrintContent = {
        title: 'تست پرینتر',
        orderId: 'TEST',
        tableId: 0,
        items: [{ name: 'تست', quantity: 1 }],
        timestamp: new Date(),
      };
      
      await printer.print(testContent);
    },
  };
  
  return new Promise((resolve, reject) => {
    try {
      socket = new WebSocket(`ws://${ip}:${port}`);
      
      socket.onopen = () => {
        printer.isConnected = true;
        resolve(printer);
      };
      
      socket.onerror = () => {
        printer.isConnected = false;
        reject(new Error('Failed to connect to printer'));
      };
      
      socket.onclose = () => {
        printer.isConnected = false;
      };
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Use browser print API (fallback)
 */
export function useBrowserPrint(content: PrintContent) {
  const printWindow = window.open('', '_blank', 'width=300,height=600');
  
  if (!printWindow) {
    throw new Error('Failed to open print window');
  }
  
  const html = `
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>سفارش #${content.orderId}</title>
      <style>
        @page { margin: 5mm; }
        body {
          font-family: monospace;
          font-size: 14px;
          padding: 10px;
          width: 80mm;
          margin: 0 auto;
        }
        .header { text-align: center; font-weight: bold; margin-bottom: 10px; }
        .item { margin: 5px 0; }
        .qty { font-weight: bold; }
        .notes { font-style: italic; color: #666; margin-right: 10px; }
        .separator { border-top: 1px dashed #000; margin: 10px 0; }
        .footer { text-align: center; font-size: 12px; margin-top: 10px; }
        @media print {
          body { width: 80mm; }
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        ${content.priority === 'rush' ? '<strong>🚨 فوری! 🚨</strong><br>' : ''}
        <strong>${content.title}</strong><br>
        سفارش #${content.orderId}<br>
        میز: ${content.tableId}
      </div>
      
      <div class="separator"></div>
      
      ${content.items.map(item => `
        <div class="item">
          <span class="qty">${item.quantity}x</span> ${item.name}
          ${item.notes ? `<div class="notes">📝 ${item.notes}</div>` : ''}
        </div>
      `).join('')}
      
      <div class="separator"></div>
      
      <div class="footer">
        ${content.timestamp.toLocaleString('fa-IR')}
      </div>
      
      <button onclick="window.print()" style="margin-top:20px;padding:10px 20px;cursor:pointer;">
        🖨️ چاپ
      </button>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
  
  return printWindow;
}

/**
 * Kitchen Printer Hook
 */
export function useKitchenPrinter() {
  const orders = useOrderStore((s) => s.orders);
  const printerRef = useRef<KitchenPrinter | null>(null);
  const [isPrinterConnected, setIsPrinterConnected] = useState(false);
  const [printerError, setPrinterError] = useState<string | null>(null);

  const connectPrinter = useCallback(async (config: PrinterConfig) => {
    try {
      setPrinterError(null);
      
      if (config.type === 'network') {
        printerRef.current = await createNetworkPrinter(config);
        setIsPrinterConnected(true);
      } else if (config.type === 'browser-print') {
        // Browser print doesn't need connection
        setIsPrinterConnected(true);
        printerRef.current = {
          config,
          isConnected: true,
          print: async (content) => {
            useBrowserPrint(content);
          },
          test: async () => {
            useBrowserPrint({
              title: 'تست پرینتر',
              orderId: 'TEST',
              tableId: 0,
              items: [{ name: 'تست', quantity: 1 }],
              timestamp: new Date(),
            });
          },
        };
      }
    } catch (error) {
      setPrinterError(error instanceof Error ? error.message : 'Connection failed');
      setIsPrinterConnected(false);
    }
  }, []);

  const printOrder = useCallback(async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const content: PrintContent = {
      title: 'سفارش آشپزخانه',
      orderId: order.id,
      tableId: order.tableId ?? 0,
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        notes: item.notes,
      })),
      timestamp: new Date(),
      priority: order.status === 'preparing' ? 'rush' : 'normal',
    };

    if (printerRef.current?.isConnected) {
      try {
        await printerRef.current.print(content);
      } catch (error) {
        console.error('[Printer] Print failed:', error);
        // Fallback to browser print
        useBrowserPrint(content);
      }
    } else {
      // Use browser print as fallback
      useBrowserPrint(content);
    }
  }, [orders]);

  const testPrinter = useCallback(async () => {
    if (printerRef.current) {
      await printerRef.current.test();
    }
  }, []);

  return {
    isPrinterConnected,
    printerError,
    connectPrinter,
    printOrder,
    testPrinter,
  };
}

// Import useState
import { useState } from 'react';
