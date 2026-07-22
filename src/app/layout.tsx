import type { Metadata, Viewport } from 'next';
import { Vazirmatn } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { Providers } from './providers';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { OfflineIndicator } from '@/components/offline/OfflineIndicator';
import { PWAUpdateNotification } from '@/components/offline/PWAUpdateNotification';
import { PWAPlaceholderIcons } from '@/components/offline/PWAPlaceholder';

const vazirmatn = Vazirmatn({
  subsets: ['arabic', 'latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-vazirmatn',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Cafe Napolitan | سیستم مدیریت کافه',
  description: 'سیستم مدیریت هوشمند کافه ناپلitan - مدیریت میزها، سفارشات و آشپزخانه',
  keywords: ['کافه', 'رستوران', 'مدیریت', 'سفارش', 'نرم‌افزار'],
  authors: [{ name: 'Cafe Napolitan' }],
  robots: 'noindex, nofollow',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Napolitan',
  },
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1a1a1a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" className={vazirmatn.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="font-sans antialiased">
        <ErrorBoundary>
          <Providers>
            {children}
            <Toaster
              position="top-center"
              dir="rtl"
              theme="dark"
              richColors
              closeButton
              toastOptions={{
                style: {
                  background: 'rgba(42, 42, 42, 0.95)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                },
              }}
            />
            {/* PWA Components */}
            <OfflineIndicator />
            <PWAUpdateNotification />
            <PWAPlaceholderIcons />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
