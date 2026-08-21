'use client';

import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  DollarSign, 
  Package, 
  TrendingUp, 
  CheckCircle2, 
  ShieldCheck 
} from 'lucide-react';
import { ResumenEstadisticas } from '@/lib/types';
import { formatMoney } from '@/lib/utils';

interface DashboardStatsProps {
  stats: ResumenEstadisticas;
  onFilterChange?: (tipo: 'TODOS' | 'ENTREGA' | 'RECEPCION') => void;
}

export default function DashboardStats({ stats, onFilterChange }: DashboardStatsProps) {
  // Dinero consolidado en COP o moneda principal
  const copEntregado = stats.totalDineroEntregado['COP'] || 0;
  const copRecibido = stats.totalDineroRecibido['COP'] || 0;
  const usdEntregado = stats.totalDineroEntregado['USD'] || 0;
  const usdRecibido = stats.totalDineroRecibido['USD'] || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Tarjeta 1: Total Entregas */}
      <div 
        onClick={() => onFilterChange?.('ENTREGA')}
        className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-500/50 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Actas de Entrega
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {stats.totalEntregas}
          </span>
          <span className="text-xs text-slate-400 ml-1.5 font-medium">registros</span>
        </div>
        <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
          <span>Salidas y asignaciones</span>
        </p>
      </div>

      {/* Tarjeta 2: Total Recepciones */}
      <div 
        onClick={() => onFilterChange?.('RECEPCION')}
        className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-teal-500/50 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Actas de Recepción
          </span>
          <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {stats.totalRecepciones}
          </span>
          <span className="text-xs text-slate-400 ml-1.5 font-medium">registros</span>
        </div>
        <p className="text-xs text-teal-600 font-semibold mt-1 flex items-center gap-1">
          <span>Entradas y devoluciones</span>
        </p>
      </div>

      {/* Tarjeta 3: Dinero en Custodia */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Dinero Movilizado
          </span>
          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2 space-y-1">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-slate-500">Entregado:</span>
            <span className="font-bold text-emerald-600">
              {formatMoney(copEntregado, 'COP')}
            </span>
          </div>
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-slate-500">Recibido:</span>
            <span className="font-bold text-teal-600">
              {formatMoney(copRecibido, 'COP')}
            </span>
          </div>
          {usdEntregado > 0 || usdRecibido > 0 ? (
            <div className="text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-1 flex justify-between">
              <span>USD:</span>
              <span>{formatMoney(usdEntregado + usdRecibido, 'USD')}</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Tarjeta 4: Materiales & Equipos */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Materiales / Equipos
          </span>
          <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2 space-y-1">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-slate-500">Entregados:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {stats.totalMaterialesEntregados} ítems
            </span>
          </div>
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-slate-500">Recibidos:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {stats.totalMaterialesRecibidos} ítems
            </span>
          </div>
          <p className="text-[11px] text-emerald-600 font-medium pt-1">
            Total histórico: {stats.totalRegistros} actas
          </p>
        </div>
      </div>
    </div>
  );
}
