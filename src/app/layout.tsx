import type { Metadata, Viewport } from 'next';
import { Vazirmatn } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { Providers } from './providers';

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
        </Providers>
      </body>
    </html>
  );
}
