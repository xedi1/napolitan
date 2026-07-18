import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cafe Napoli - سیستم مدیریت رستوران',
  description: 'سیستم مدیریت سالن کافه ناپل با نمای سه‌بعدی',
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#1a1a1a',
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
