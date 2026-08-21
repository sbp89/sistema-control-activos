'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  History, 
  Eye, 
  Download, 
  Coins, 
  DollarSign, 
  Package, 
  ArrowRight
} from 'lucide-react';
import RegistroForm from '@/components/RegistroForm';
import ReceiptModal from '@/components/ReceiptModal';
import { getStoredRegistros } from '@/lib/db';
import { Registro } from '@/lib/types';
import { formatDate, formatMoney } from '@/lib/utils';
import { downloadActaPdf } from '@/lib/pdf-generator';

export default function HomePage() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [selectedRegistro, setSelectedRegistro] = useState<Registro | null>(null);

  const reloadData = () => {
    setRegistros(getStoredRegistros());
  };

  useEffect(() => {
    reloadData();
  }, []);

  const ultimosRegistros = registros.slice(0, 5);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Formulario Principal de Registro */}
      <section>
        <RegistroForm onRegistroCreado={() => reloadData()} />
      </section>

      {/* Movimientos Recientes */}
      {ultimosRegistros.length > 0 && (
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-4 h-4 text-emerald-600" />
              <span>Últimos Movimientos</span>
            </h3>
            <Link
              href="/historial"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>Ver todos ({registros.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {ultimosRegistros.map((reg) => {
              const isEntrega = reg.tipoOperacion === 'ENTREGA';
              return (
                <div
                  key={reg.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        isEntrega
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          : 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300'
                      }`}
                    >
                      {reg.tipoOperacion}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                          {reg.folio}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500">{formatDate(reg.fechaHora)}</span>
                      </div>

                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 flex flex-wrap gap-2">
                        {reg.oro && reg.oro.gramos > 0 && (
                          <span className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                            <Coins className="w-3 h-3 text-amber-600" />
                            {reg.oro.gramos.toFixed(2)} g Oro ({formatMoney(reg.oro.valorLiquidacion, reg.oro.moneda)})
                          </span>
                        )}
                        {reg.dinero && reg.dinero.monto > 0 && (
                          <span className="font-bold text-emerald-600 flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {formatMoney(reg.dinero.monto, reg.dinero.moneda)}
                          </span>
                        )}
                        {reg.materiales && reg.materiales.length > 0 && (
                          <span className="text-slate-500 flex items-center gap-1">
                            <Package className="w-3 h-3 text-slate-400" />
                            {reg.materiales.length} ítem(s)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <button
                      onClick={() => setSelectedRegistro(reg)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Acta</span>
                    </button>
                    <button
                      onClick={() => downloadActaPdf(reg)}
                      className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
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

      {/* Modal de Comprobante */}
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
