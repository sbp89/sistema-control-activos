import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Sistema de Control de Activos | Entrega & Recepción',
  description: 'Sistema oficial para registro, custodia y actas de entrega/recepción de dinero y materiales con respaldo en Google Drive (Trabajo/Mono).',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>Sistema de Control y Custodia de Activos &copy; 2026</span>
            <span className="text-emerald-600 font-medium">
              Almacenamiento en Google Drive: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Trabajo/Mono</code>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
