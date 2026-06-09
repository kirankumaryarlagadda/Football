import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FWC Picks 2026',
  description: 'Predict FIFA World Cup 2026 match results, compete with friends, and climb the leaderboard!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#f7fafc] min-h-screen">
        {children}
      </body>
    </html>
  );
}
