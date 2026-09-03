import type { Metadata } from 'next';
import './globals.css';
import { Geist } from 'next/font/google';
import { Providers } from '@/lib/providers';
import { cn } from '@/lib/utils';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'MotusFit',
  description: 'Treino de força, rotinas e evolução em um só lugar.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={cn('h-full antialiased', 'font-sans', geist.variable)}>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
