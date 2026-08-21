import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';

export const metadata: Metadata = {
  title: 'Control de Custodia | Entrega y Recepción',
  description: 'Sistema oficial para registro y actas de entrega/recepción de oro, dinero y materiales.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <AuthGuard>
          <Navbar />
          <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6">
            {children}
          </main>
          <footer className="border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-400">
            <div className="max-w-5xl mx-auto px-4">
              Sistema de Control de Custodia &copy; 2026
            </div>
          </footer>
        </AuthGuard>
      </body>
    </html>
  );
}
