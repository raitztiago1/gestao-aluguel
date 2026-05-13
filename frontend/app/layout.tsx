import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gestão de Aluguel',
  description: 'Front-end simples para gestão de aluguel com API Spring Boot'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='pt-BR'>
      <body>{children}</body>
    </html>
  );
}
