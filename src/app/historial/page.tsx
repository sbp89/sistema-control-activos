'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  FileSpreadsheet, 
  Eye, 
  Trash2, 
  Cloud, 
  CheckCircle2, 
  RefreshCw, 
  DollarSign, 
  Package, 
  FileText,
  Calendar,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { Registro, TipoOperacion, CategoriaOperacion } from '@/lib/types';
import { getStoredRegistros, deleteRegistro, getGoogleDriveConfig, saveRegistro } from '@/lib/db';
import { formatDate, formatMoney } from '@/lib/utils';
import { downloadActaPdf } from '@/lib/pdf-generator';
import { syncRegistroToDrive } from '@/lib/drive-service';
import ReceiptModal from '@/components/ReceiptModal';

export default function HistorialPage() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<'TODOS' | TipoOperacion>('TODOS');
  const [catFiltro, setCatFiltro] = useState<'TODOS' | CategoriaOperacion>('TODOS');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [syncFiltro, setSyncFiltro] = useState<'TODOS' | 'SYNC' | 'PENDIENTE'>('TODOS');

  const [selectedRegistro, setSelectedRegistro] = useState<Registro | null>(null);
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);
  const [bulkSyncMsg, setBulkSyncMsg] = useState<string | null>(null);

  const loadData = () => {
    setRegistros(getStoredRegistros());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrado reactivo en memoria
  const filteredRegistros = useMemo(() => {
    return registros.filter((reg) => {
      // 1. Búsqueda por texto
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchFolio = reg.folio.toLowerCase().includes(query);
        const matchEntregado = reg.entregaPor?.nombre?.toLowerCase().includes(query) ||
                               reg.entregaPor?.documento?.toLowerCase().includes(query);
        const matchRecibido = reg.recibePor?.nombre?.toLowerCase().includes(query) ||
                              reg.recibePor?.documento?.toLowerCase().includes(query);
        const matchConcepto = reg.dinero?.concepto?.toLowerCase().includes(query);
        const matchSede = reg.ubicacion?.sede?.toLowerCase().includes(query) ||
                          reg.ubicacion?.proyecto?.toLowerCase().includes(query);
        const matchMateriales = reg.materiales?.some((m) =>
          m.descripcion.toLowerCase().includes(query) ||
          m.numeroSerie?.toLowerCase().includes(query) ||
          m.codigoInventario?.toLowerCase().includes(query)
        );

        if (!matchFolio && !matchEntregado && !matchRecibido && !matchConcepto && !matchSede && !matchMateriales) {
          return false;
        }
      }

      // 2. Filtro Tipo de Operación
      if (tipoFiltro !== 'TODOS' && reg.tipoOperacion !== tipoFiltro) {
        return false;
      }

      // 3. Filtro Categoría
      if (catFiltro !== 'TODOS' && reg.categoria !== catFiltro) {
        return false;
      }

      // 4. Filtro Fechas
      if (fechaDesde && new Date(reg.fechaHora) < new Date(fechaDesde)) {
        return false;
      }
      if (fechaHasta && new Date(reg.fechaHora) > new Date(fechaHasta + 'T23:59:59')) {
        return false;
      }

      // 5. Filtro Drive Sync
      if (syncFiltro === 'SYNC' && !reg.sincronizadoDrive) return false;
      if (syncFiltro === 'PENDIENTE' && reg.sincronizadoDrive) return false;

      return true;
    });
  }, [registros, searchTerm, tipoFiltro, catFiltro, fechaDesde, fechaHasta, syncFiltro]);

  const handleDelete = (id: string, folio: string) => {
    if (confirm(`¿Estás seguro de eliminar el registro ${folio}? Esta acción no se puede deshacer.`)) {
      deleteRegistro(id);
      loadData();
    }
  };

  // Exportar a Excel (CSV con UTF-8 BOM para apertura perfecta con acentos)
  const handleExportCsv = () => {
    if (filteredRegistros.length === 0) {
      alert('No hay registros para exportar con los filtros actuales.');
      return;
    }

    const headers = [
      'Folio',
      'Tipo Operación',
      'Categoría',
      'Fecha / Hora',
      'Sede / Proyecto',
      'Entregado Por',
      'Doc Entregó',
      'Recibido Por',
      'Doc Recibió',
      'Monto Dinero',
      'Moneda',
      'Método Pago',
      'Concepto Dinero',
      'Total Materiales',
      'Detalle Materiales',
      'Observaciones',
      'Sincronizado Drive',
    ];

    const rows = filteredRegistros.map((r) => [
      r.folio,
      r.tipoOperacion,
      r.categoria,
      formatDate(r.fechaHora, true),
      `${r.ubicacion?.sede || ''} ${r.ubicacion?.proyecto || ''}`.trim(),
      r.entregaPor?.nombre || 'Confidencial',
      r.entregaPor?.documento || '',
      r.recibePor?.nombre || 'Confidencial',
      r.recibePor?.documento || '',
      r.dinero ? r.dinero.monto : '',
      r.dinero ? r.dinero.moneda : '',
      r.dinero ? r.dinero.metodoPago : '',
      r.dinero?.concepto || '',
      r.materiales ? r.materiales.length : 0,
      r.materiales ? r.materiales.map((m) => `${m.cantidad} ${m.unidad} ${m.descripcion}`).join('; ') : '',
      r.observacionesGenerales || '',
      r.sincronizadoDrive ? 'SI' : 'NO',
    ]);

    const csvContent = '\uFEFF' + [
      headers.map((h) => `"${h}"`).join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Control_Activos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sincronización masiva de registros pendientes a Google Drive (Trabajo/Mono)
  const handleBulkSyncDrive = async () => {
    const config = getGoogleDriveConfig();
    if (!config.webhookUrl) {
      alert('Debes configurar la URL de tu Webhook de Google Drive en la sección de Ajustes primero.');
      return;
    }

    const pendientes = registros.filter((r) => !r.sincronizadoDrive);
    if (pendientes.length === 0) {
      alert('Todos los registros ya se encuentran sincronizados con Google Drive.');
      return;
    }

    setIsBulkSyncing(true);
    setBulkSyncMsg(`Sincronizando ${pendientes.length} registros con la carpeta Trabajo/Mono en Google Drive...`);

    let syncedCount = 0;
    for (const reg of pendientes) {
      const res = await syncRegistroToDrive(reg, config);
      if (res.success) {
        const updated = { ...reg, sincronizadoDrive: true, driveFileUrl: res.driveFolderUrl };
        saveRegistro(updated);
        syncedCount++;
      }
    }

    setIsBulkSyncing(false);
    setBulkSyncMsg(`¡Listo! Se sincronizaron ${syncedCount} de ${pendientes.length} registros en Drive (Trabajo/Mono).`);
    loadData();
    setTimeout(() => setBulkSyncMsg(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Acciones Principales */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <History className="w-7 h-7 text-emerald-600" />
            <span>Historial de Actas & Movimientos</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Consulta, filtra, descarga actas oficiales en PDF y sincroniza con Google Drive (Trabajo/Mono).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-all"
            title="Exportar a Excel / CSV con formato compatible"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Excel</span>
          </button>

          <button
            onClick={handleBulkSyncDrive}
            disabled={isBulkSyncing}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
          >
            {isBulkSyncing ? (
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
            ) : (
              <Cloud className="w-4 h-4 text-emerald-400" />
            )}
            <span>{isBulkSyncing ? 'Sincronizando...' : 'Sincronizar Pendientes a Drive'}</span>
          </button>
        </div>
      </div>

      {/* Banner de Mensaje de Sincronización Masiva */}
      {bulkSyncMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-900 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{bulkSyncMsg}</span>
        </div>
      )}

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Búsqueda */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por folio, nombre, cédula, serial, concepto..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Tipo de Operación */}
          <div className="md:col-span-2">
            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value as any)}
              className="w-full px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="TODOS">Todos los Tipos</option>
              <option value="ENTREGA">Solo Entregas</option>
              <option value="RECEPCION">Solo Recepciones</option>
            </select>
          </div>

          {/* Categoría */}
          <div className="md:col-span-2">
            <select
              value={catFiltro}
              onChange={(e) => setCatFiltro(e.target.value as any)}
              className="w-full px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="TODOS">Todas las Categorías</option>
              <option value="DINERO">Dinero</option>
              <option value="MATERIAL">Materiales</option>
              <option value="MIXTO">Mixto (Ambos)</option>
            </select>
          </div>

          {/* Rango Desde */}
          <div className="md:col-span-2">
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              title="Fecha inicial"
            />
          </div>

          {/* Rango Hasta */}
          <div className="md:col-span-2">
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              title="Fecha final"
            />
          </div>
        </div>

        {/* Resumen de Filtros */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span>
            Mostrando <strong>{filteredRegistros.length}</strong> de {registros.length} registros
          </span>
          {(searchTerm || tipoFiltro !== 'TODOS' || catFiltro !== 'TODOS' || fechaDesde || fechaHasta) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setTipoFiltro('TODOS');
                setCatFiltro('TODOS');
                setFechaDesde('');
                setFechaHasta('');
                setSyncFiltro('TODOS');
              }}
              className="text-emerald-600 hover:underline font-semibold"
            >
              Limpiar todos los filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla Principal de Registros */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredRegistros.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-base font-bold text-slate-700 dark:text-slate-300">
              No se encontraron registros
            </p>
            <p className="text-xs text-slate-500">
              Prueba cambiando o limpiando los filtros de búsqueda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Folio & Tipo</th>
                  <th className="p-3.5">Fecha & Sede</th>
                  <th className="p-3.5">Participantes</th>
                  <th className="p-3.5">Valores / Materiales</th>
                  <th className="p-3.5 text-center">Drive</th>
                  <th className="p-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRegistros.map((reg) => {
                  const isEntrega = reg.tipoOperacion === 'ENTREGA';
                  return (
                    <tr
                      key={reg.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Folio y Tipo */}
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              isEntrega
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                : 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300'
                            }`}
                          >
                            {reg.tipoOperacion}
                          </span>
                          <div className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                            {reg.folio}
                          </div>
                        </div>
                      </td>

                      {/* Fecha y Sede */}
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {formatDate(reg.fechaHora)}
                          </div>
                          {reg.ubicacion?.sede ? (
                            <div className="text-xs text-slate-500">
                              {reg.ubicacion.sede} {reg.ubicacion.proyecto ? `(${reg.ubicacion.proyecto})` : ''}
                            </div>
                          ) : (
                            <div className="text-xs text-slate-400">Sede general</div>
                          )}
                        </div>
                      </td>

                      {/* Participantes */}
                      <td className="p-3.5">
                        <div className="space-y-0.5 text-xs">
                          <div className="text-slate-700 dark:text-slate-300">
                            <span className="font-semibold text-emerald-600">Entregó:</span>{' '}
                            {reg.entregaPor?.nombre || 'Confidencial'}
                          </div>
                          <div className="text-slate-700 dark:text-slate-300">
                            <span className="font-semibold text-teal-600">Recibió:</span>{' '}
                            {reg.recibePor?.nombre || 'Confidencial'}
                          </div>
                        </div>
                      </td>

                      {/* Valores / Materiales */}
                      <td className="p-3.5">
                        <div className="space-y-1">
                          {reg.dinero && reg.dinero.monto > 0 && (
                            <div className="font-bold text-emerald-600 flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5" />
                              {formatMoney(reg.dinero.monto, reg.dinero.moneda)}
                              <span className="text-[10px] font-normal text-slate-400">
                                ({reg.dinero.metodoPago})
                              </span>
                            </div>
                          )}
                          {reg.materiales && reg.materiales.length > 0 && (
                            <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                              <Package className="w-3.5 h-3.5 text-slate-500" />
                              <span>{reg.materiales.length} ítem{reg.materiales.length > 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Estado Drive */}
                      <td className="p-3.5 text-center">
                        {reg.sincronizadoDrive ? (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full"
                            title="Guardado en Trabajo/Mono"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mono</span>
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full"
                            title="Pendiente de sincronizar a Drive"
                          >
                            Local
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedRegistro(reg)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                            title="Ver Acta Completa"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => downloadActaPdf(reg)}
                            className="p-1.5 rounded-lg text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 transition-colors"
                            title="Descargar PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(reg.id, reg.folio)}
                            className="p-1.5 rounded-lg text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 transition-colors"
                            title="Eliminar Registro"
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

      {/* Modal de Comprobante / Acta */}
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
