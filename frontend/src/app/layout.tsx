import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ensaladas Fresh',
  description: 'Las mejores ensaladas personalizadas',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
