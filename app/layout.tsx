import React from 'react';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'UTV — Каталог контента',
  description: 'Современная экосистема качественного документального и научно-популярного контента',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          }
          body {
            font-family: var(--font-sans);
          }
        `}} />
      </head>
      <body className="flex min-h-screen flex-col bg-white text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}