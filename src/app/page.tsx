'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  History, 
  FileText, 
  Download, 
  Eye, 
  Cloud, 
  ShieldCheck,
  Package,
  DollarSign
} from 'lucide-react';
import DashboardStats from '@/components/DashboardStats';
import RegistroForm from '@/components/RegistroForm';
import ReceiptModal from '@/components/ReceiptModal';
import { getStoredRegistros, getEstadisticas } from '@/lib/db';
import { Registro, ResumenEstadisticas } from '@/lib/types';
import { formatDate, formatMoney } from '@/lib/utils';
import { downloadActaPdf } from '@/lib/pdf-generator';

export default function HomePage() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [stats, setStats] = useState<ResumenEstadisticas>({
    totalRegistros: 0,
    totalEntregas: 0,
    totalRecepciones: 0,
    totalDineroEntregado: {},
    totalDineroRecibido: {},
    totalMaterialesEntregados: 0,
    totalMaterialesRecibidos: 0,
  });
  const [selectedRegistro, setSelectedRegistro] = useState<Registro | null>(null);

  const reloadData = () => {
    const list = getStoredRegistros();
    setRegistros(list);
    setStats(getEstadisticas(list));
  };

  useEffect(() => {
    reloadData();
  }, []);

  const handleRegistroCreado = (nuevo: Registro) => {
    reloadData();
  };

  const ultimosRegistros = registros.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Sección de Estadísticas y Métricas */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
            Resumen General de Operaciones
          </h2>
          <Link
            href="/historial"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group"
          >
            <span>Ver historial completo</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        <DashboardStats stats={stats} />
      </section>

      {/* Formulario de Nuevo Registro */}
      <section>
        <RegistroForm onRegistroCreado={handleRegistroCreado} />
      </section>

      {/* Últimos Registros Realizados */}
      {ultimosRegistros.length > 0 && (
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-600" />
                <span>Movimientos Recientes</span>
              </h3>
              <p className="text-xs text-slate-500">
                Últimas 5 actas generadas en el sistema.
              </p>
            </div>
            <Link
              href="/historial"
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
            >
              Ver todas ({registros.length})
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {ultimosRegistros.map((reg) => {
              const isEntrega = reg.tipoOperacion === 'ENTREGA';
              return (
                <div
                  key={reg.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase mt-0.5 ${
                        isEntrega
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          : 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300'
                      }`}
                    >
                      {reg.tipoOperacion}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {reg.folio}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500">
                          {formatDate(reg.fechaHora)}
                        </span>
                      </div>

                      <div className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
                        {reg.dinero && reg.dinero.monto > 0 && (
                          <span className="font-semibold text-emerald-600 flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {formatMoney(reg.dinero.monto, reg.dinero.moneda)}
                          </span>
                        )}
                        {reg.materiales && reg.materiales.length > 0 && (
                          <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                            <Package className="w-3 h-3 text-emerald-600" />
                            {reg.materiales.length} ítem{reg.materiales.length > 1 ? 's' : ''}
                          </span>
                        )}
                        <span className="text-slate-500">
                          De: {reg.entregaPor?.nombre || 'Confidencial'} ➔ A: {reg.recibePor?.nombre || 'Confidencial'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => setSelectedRegistro(reg)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                      title="Ver Comprobante"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Acta</span>
                    </button>

                    <button
                      onClick={() => downloadActaPdf(reg)}
                      className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400 transition-colors"
                      title="Descargar PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Modal de Comprobante si se selecciona uno */}
      {selectedRegistro && (
        <ReceiptModal
          registro={selectedRegistro}
          onClose={() => setSelectedRegistro(null)}
          onUpdateRegistro={() => reloadData()}
        />
      )}
    </div>
  );
}
