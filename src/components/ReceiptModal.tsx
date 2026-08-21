'use client';

import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  Share2, 
  Cloud, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Calendar, 
  MapPin, 
  UserCheck, 
  DollarSign, 
  Package, 
  ExternalLink,
  Loader2
} from 'lucide-react';
import { Registro } from '@/lib/types';
import { formatDate, formatMoney } from '@/lib/utils';
import { downloadActaPdf } from '@/lib/pdf-generator';
import { syncRegistroToDrive } from '@/lib/drive-service';
import { getGoogleDriveConfig, saveRegistro } from '@/lib/db';

interface ReceiptModalProps {
  registro: Registro | null;
  onClose: () => void;
  onUpdateRegistro?: (updated: Registro) => void;
}

export default function ReceiptModal({
  registro,
  onClose,
  onUpdateRegistro,
}: ReceiptModalProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ success: boolean; message: string; url?: string } | null>(null);

  if (!registro) return null;

  const isEntrega = registro.tipoOperacion === 'ENTREGA';

  const handleDownloadPdf = async () => {
    try {
      await downloadActaPdf(registro);
    } catch (err: any) {
      alert('Error al generar PDF: ' + err.message);
    }
  };

  const handlePrint = async () => {
    window.print();
  };

  const handleSyncToDrive = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const config = getGoogleDriveConfig();
      const res = await syncRegistroToDrive(registro, config);
      if (res.success) {
        const updated = {
          ...registro,
          sincronizadoDrive: true,
          driveFileUrl: res.driveFolderUrl || res.pdfFileUrl,
        };
        saveRegistro(updated);
        if (onUpdateRegistro) onUpdateRegistro(updated);
        setSyncFeedback({
          success: true,
          message: 'Sincronizado exitosamente en Google Drive (Trabajo/Mono)',
          url: res.driveFolderUrl,
        });
      } else {
        setSyncFeedback({
          success: false,
          message: res.message,
        });
      }
    } catch (err: any) {
      setSyncFeedback({
        success: false,
        message: 'Error al sincronizar: ' + err.message,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `*Comprobante de ${registro.tipoOperacion}*\n` +
      `*Folio:* ${registro.folio}\n` +
      `*Fecha:* ${formatDate(registro.fechaHora)}\n` +
      (registro.dinero?.monto ? `*Monto:* ${formatMoney(registro.dinero.monto, registro.dinero.moneda)}\n` : '') +
      (registro.materiales?.length ? `*Materiales:* ${registro.materiales.length} ítems\n` : '') +
      `*Estado:* Registrado en Sistema de Control de Activos.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Barra superior de acciones */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide ${
                isEntrega
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                  : 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300'
              }`}
            >
              Acta de {registro.tipoOperacion}
            </span>
            <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
              {registro.folio}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido imprimible / vista previa del comprobante */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800 dark:text-slate-200" id="printable-receipt">
          {/* Cabecera del Comprobante */}
          <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-800 space-y-1">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
              Acta Oficial de {registro.tipoOperacion}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Sistema de Control y Custodia de Activos y Valores • Google Drive: Trabajo/Mono
            </p>
            <div className="pt-2 flex flex-wrap justify-center items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                {formatDate(registro.fechaHora, true)}
              </span>
              {registro.ubicacion?.sede && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  {registro.ubicacion.sede} {registro.ubicacion.proyecto ? `(${registro.ubicacion.proyecto})` : ''}
                </span>
              )}
            </div>
          </div>

          {/* Participantes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                Entregado Por
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {registro.entregaPor?.nombre || '(Confidencial / Omitido)'}
              </p>
              {registro.entregaPor?.documento && (
                <p className="text-xs text-slate-500">Doc: {registro.entregaPor.documento}</p>
              )}
              {registro.entregaPor?.cargoEmpresa && (
                <p className="text-xs text-slate-500">Cargo: {registro.entregaPor.cargoEmpresa}</p>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 uppercase">
                Recibido Por
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {registro.recibePor?.nombre || '(Confidencial / Omitido)'}
              </p>
              {registro.recibePor?.documento && (
                <p className="text-xs text-slate-500">Doc: {registro.recibePor.documento}</p>
              )}
              {registro.recibePor?.cargoEmpresa && (
                <p className="text-xs text-slate-500">Cargo: {registro.recibePor.cargoEmpresa}</p>
              )}
            </div>
          </div>

          {/* Detalle de Dinero */}
          {registro.dinero && registro.dinero.monto > 0 && (
            <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" />
                  <span>Detalle Financiero</span>
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-200/60 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 rounded-md">
                  {registro.dinero.metodoPago || 'EFECTIVO'}
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                {formatMoney(registro.dinero.monto, registro.dinero.moneda)}
              </div>
              {registro.dinero.concepto && (
                <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                  <strong>Concepto:</strong> {registro.dinero.concepto}
                </p>
              )}
              {registro.dinero.numeroComprobante && (
                <p className="text-xs text-slate-500">
                  <strong>No. Comprobante/Ref:</strong> {registro.dinero.numeroComprobante}
                </p>
              )}
            </div>
          )}

          {/* Detalle de Materiales */}
          {registro.materiales && registro.materiales.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-600" />
                <span>Bienes / Materiales Registrados ({registro.materiales.length})</span>
              </span>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Descripción</th>
                      <th className="p-2.5 text-center">Cant.</th>
                      <th className="p-2.5">Estado</th>
                      <th className="p-2.5">Serie / Código</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {registro.materiales.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 text-slate-400">{idx + 1}</td>
                        <td className="p-2.5 font-medium">{item.descripcion}</td>
                        <td className="p-2.5 text-center font-bold">{item.cantidad} {item.unidad}</td>
                        <td className="p-2.5">{item.estado || 'BUENO'}</td>
                        <td className="p-2.5 font-mono text-[11px] text-slate-500">
                          {item.numeroSerie || item.codigoInventario || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Observaciones */}
          {registro.observacionesGenerales && (
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Observaciones:
              </span>
              <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line">
                {registro.observacionesGenerales}
              </p>
            </div>
          )}

          {/* Fotos de Evidencia */}
          {registro.fotos && registro.fotos.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                Evidencia Fotográfica ({registro.fotos.length})
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {registro.fotos.map((foto, idx) => (
                  <div
                    key={foto.id}
                    className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video bg-black/5"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={foto.base64}
                      alt={`Evidencia ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Firmas Digitales */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                Firma Quien Entrega
              </span>
              <div className="h-20 flex items-center justify-center">
                {registro.firmaEntrega?.base64 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={registro.firmaEntrega.base64}
                    alt="Firma Entrega"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-slate-400 italic">Conforme sin firma física</span>
                )}
              </div>
              <div className="border-t border-slate-200 dark:border-slate-800 pt-1 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                {registro.entregaPor?.nombre || 'Interviniente Entrega'}
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                Firma Quien Recibe
              </span>
              <div className="h-20 flex items-center justify-center">
                {registro.firmaRecibe?.base64 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={registro.firmaRecibe.base64}
                    alt="Firma Recibe"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-slate-400 italic">Conforme sin firma física</span>
                )}
              </div>
              <div className="border-t border-slate-200 dark:border-slate-800 pt-1 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                {registro.recibePor?.nombre || 'Interviniente Recepción'}
              </div>
            </div>
          </div>

          {/* Feedback de Sincronización */}
          {syncFeedback && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2 ${
                syncFeedback.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {syncFeedback.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                )}
                <span>{syncFeedback.message}</span>
              </div>
              {syncFeedback.url && (
                <a
                  href={syncFeedback.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold underline"
                >
                  <span>Abrir en Drive</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Barra de Acciones Inferior */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Acta PDF</span>
            </button>

            <button
              onClick={handleSyncToDrive}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold shadow-sm active:scale-95 transition-all disabled:opacity-50"
            >
              {isSyncing ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              ) : (
                <Cloud className="w-4 h-4 text-emerald-400" />
              )}
              <span>{isSyncing ? 'Sincronizando...' : 'Enviar a Drive (Trabajo/Mono)'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-xs font-semibold shadow-sm transition-all"
              title="Compartir resumen en WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
