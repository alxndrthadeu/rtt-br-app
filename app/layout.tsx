import type { Metadata } from 'next';
import { Oswald } from 'next/font/google';
import './globals.css';

const oswald = Oswald({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-oswald',
});

export const metadata: Metadata = {
  title: 'Alcance o Topo',
  description: 'Monte seu time dos sonhos com as lendas do futebol brasileiro',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${oswald.variable} font-oswald min-h-screen relative`}>
        {children}
      </body>
    </html>
  );
}
