import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1a1a1a',
};

export const metadata: Metadata = {
  title: 'Napolitian - سیستم مدیریت کافه',
  description: 'سیستم مدیریت سالن کافه ناپلیتین با نمای سه‌بعدی',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className="min-h-screen bg-[var(--bg-dark)]">
        {children}
      </body>
    </html>
  );
}
