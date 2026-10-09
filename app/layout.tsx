import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Shell } from '@/components/shell';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Grievance Prioritization System',
  description:
    'AI-powered citizen complaint management — automatic categorization, priority scoring, duplicate detection, and routing.',
  openGraph: {
    title: 'Grievance Prioritization System',
    description:
      'AI-powered citizen complaint management — automatic categorization, priority scoring, duplicate detection, and routing.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
