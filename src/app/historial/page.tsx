'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  History, 
  Search, 
  FileSpreadsheet, 
  Eye, 
  Trash2, 
  Download, 
  Coins, 
  DollarSign, 
  Package, 
  FileText 
} from 'lucide-react';
import { Registro, TipoOperacion, CategoriaOperacion } from '@/lib/types';
import { getStoredRegistros, deleteRegistro } from '@/lib/db';
import { formatDate, formatMoney } from '@/lib/utils';
import { downloadActaPdf } from '@/lib/pdf-generator';
import ReceiptModal from '@/components/ReceiptModal';

export default function HistorialPage() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<'TODOS' | TipoOperacion>('TODOS');
  const [catFiltro, setCatFiltro] = useState<'TODOS' | CategoriaOperacion>('TODOS');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [selectedRegistro, setSelectedRegistro] = useState<Registro | null>(null);

  const loadData = () => {
    setRegistros(getStoredRegistros());
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRegistros = useMemo(() => {
    return registros.filter((reg) => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const mFolio = reg.folio.toLowerCase().includes(q);
        const mEnt = reg.entregaPor?.nombre?.toLowerCase().includes(q) || reg.entregaPor?.documento?.toLowerCase().includes(q);
        const mRec = reg.recibePor?.nombre?.toLowerCase().includes(q) || reg.recibePor?.documento?.toLowerCase().includes(q);
        const mConc = reg.dinero?.concepto?.toLowerCase().includes(q) || reg.oro?.tipoPieza?.toLowerCase().includes(q);
        const mMat = reg.materiales?.some((m) => m.descripcion.toLowerCase().includes(q) || m.numeroSerie?.toLowerCase().includes(q));

        if (!mFolio && !mEnt && !mRec && !mConc && !mMat) return false;
      }

      if (tipoFiltro !== 'TODOS' && reg.tipoOperacion !== tipoFiltro) return false;
      if (catFiltro !== 'TODOS' && reg.categoria !== catFiltro) return false;

      if (fechaDesde && new Date(reg.fechaHora) < new Date(fechaDesde)) return false;
      if (fechaHasta && new Date(reg.fechaHora) > new Date(fechaHasta + 'T23:59:59')) return false;

      return true;
    });
  }, [registros, searchTerm, tipoFiltro, catFiltro, fechaDesde, fechaHasta]);

  const handleDelete = (id: string, folio: string) => {
    if (confirm(`¿Eliminar el registro ${folio}?`)) {
      deleteRegistro(id);
      loadData();
    }
  };

  const handleExportCsv = () => {
    if (filteredRegistros.length === 0) {
      alert('No hay registros para exportar.');
      return;
    }

    const headers = [
      'Folio',
      'Tipo Operación',
      'Categoría',
      'Fecha / Hora',
      'Sede',
      'Entregado Por',
      'Recibido Por',
      'Oro (Gramos)',
      'Oro (Liquidación)',
      'Monto Dinero',
      'Método Pago',
      'Materiales',
      'Observaciones',
    ];

    const rows = filteredRegistros.map((r) => [
      r.folio,
      r.tipoOperacion,
      r.categoria,
      formatDate(r.fechaHora, true),
      r.ubicacion?.sede || '',
      r.entregaPor?.nombre || 'Confidencial',
      r.recibePor?.nombre || 'Confidencial',
      r.oro ? r.oro.gramos : '',
      r.oro ? r.oro.valorLiquidacion : '',
      r.dinero ? r.dinero.monto : '',
      r.dinero ? r.dinero.metodoPago : '',
      r.materiales ? r.materiales.map((m) => `${m.cantidad} ${m.unidad} ${m.descripcion}`).join('; ') : '',
      r.observacionesGenerales || '',
    ]);

    const csvContent = '\uFEFF' + [
      headers.map((h) => `"${h}"`).join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Historial_Actas_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-600" />
            <span>Historial de Actas</span>
          </h1>
          <p className="text-xs text-slate-500">
            Consulta, descarga actas en PDF o exporta a Excel.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Exportar a Excel</span>
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="sm:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por folio, nombre, concepto..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value as any)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="TODOS">Todos los Tipos</option>
              <option value="ENTREGA">Entregas</option>
              <option value="RECEPCION">Recepciones</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={catFiltro}
              onChange={(e) => setCatFiltro(e.target.value as any)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="TODOS">Todas las Categorías</option>
              <option value="ORO">Oro</option>
              <option value="DINERO">Dinero</option>
              <option value="MATERIAL">Materiales</option>
              <option value="MIXTO">Mixto</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="w-full px-2 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              title="Fecha inicial"
            />
          </div>
        </div>
      </div>

      {/* Tabla de Registros */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredRegistros.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No hay registros</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Folio</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Participantes</th>
                  <th className="p-3">Detalle (Oro / Dinero / Bienes)</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRegistros.map((reg) => {
                  const isEntrega = reg.tipoOperacion === 'ENTREGA';
                  return (
                    <tr key={reg.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold">{reg.folio}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          isEntrega ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-100 text-teal-800'
                        }`}>
                          {reg.tipoOperacion}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{formatDate(reg.fechaHora)}</td>
                      <td className="p-3">
                        <div><span className="text-emerald-600 font-semibold">De:</span> {reg.entregaPor?.nombre || 'Confidencial'}</div>
                        <div><span className="text-teal-600 font-semibold">A:</span> {reg.recibePor?.nombre || 'Confidencial'}</div>
                      </td>
                      <td className="p-3">
                        {reg.oro && reg.oro.gramos > 0 && (
                          <div className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                            <Coins className="w-3 h-3 text-amber-600" />
                            {reg.oro.gramos.toFixed(2)} g Oro ({formatMoney(reg.oro.valorLiquidacion, reg.oro.moneda)})
                          </div>
                        )}
                        {reg.dinero && reg.dinero.monto > 0 && (
                          <div className="font-bold text-emerald-600 flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {formatMoney(reg.dinero.monto, reg.dinero.moneda)}
                          </div>
                        )}
                        {reg.materiales && reg.materiales.length > 0 && (
                          <div className="text-slate-500 flex items-center gap-1">
                            <Package className="w-3 h-3 text-slate-400" />
                            {reg.materiales.length} ítem(s)
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedRegistro(reg)}
                            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            title="Ver Acta"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => downloadActaPdf(reg)}
                            className="p-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                            title="Descargar PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(reg.id, reg.folio)}
                            className="p-1 rounded-lg text-red-400 hover:text-red-600"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Comprobante */}
      {selectedRegistro && (
        <ReceiptModal
          registro={selectedRegistro}
          onClose={() => setSelectedRegistro(null)}
          onUpdateRegistro={() => loadData()}
        />
      )}
    </div>
  );
}
