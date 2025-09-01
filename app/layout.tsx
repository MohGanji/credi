import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Credi',
  description: 'Cut through the noise and find which voices are actually credible and worth trusting.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}