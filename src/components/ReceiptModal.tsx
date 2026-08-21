'use client';

import React from 'react';
import { 
  X, 
  Download, 
  Printer, 
  Share2, 
  Coins, 
  DollarSign, 
  Package, 
  Calendar, 
  MapPin
} from 'lucide-react';
import { Registro } from '@/lib/types';
import { formatDate, formatMoney } from '@/lib/utils';
import { downloadActaPdf } from '@/lib/pdf-generator';

interface ReceiptModalProps {
  registro: Registro | null;
  onClose: () => void;
  onUpdateRegistro?: (updated: Registro) => void;
}

export default function ReceiptModal({
  registro,
  onClose,
}: ReceiptModalProps) {
  if (!registro) return null;

  const isEntrega = registro.tipoOperacion === 'ENTREGA';

  const handleDownloadPdf = async () => {
    try {
      await downloadActaPdf(registro);
    } catch (err: any) {
      alert('Error al generar PDF: ' + err.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = `*Acta de ${registro.tipoOperacion}*\n` +
      `*Folio:* ${registro.folio}\n` +
      `*Fecha:* ${formatDate(registro.fechaHora)}\n` +
      (registro.oro?.gramos ? `*Oro:* ${registro.oro.gramos} g (${formatMoney(registro.oro.valorLiquidacion, registro.oro.moneda)})\n` : '') +
      (registro.dinero?.monto ? `*Dinero:* ${formatMoney(registro.dinero.monto, registro.dinero.moneda)}\n` : '') +
      (registro.materiales?.length ? `*Materiales:* ${registro.materiales.length} ítem(s)\n` : '') +
      `*De:* ${registro.entregaPor?.nombre || 'Confidencial'}\n` +
      `*A:* ${registro.recibePor?.nombre || 'Confidencial'}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Barra superior */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                isEntrega
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
              }`}
            >
              Acta de {registro.tipoOperacion}
            </span>
            <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400">
              {registro.folio}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Vista previa del Comprobante */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-slate-800 dark:text-slate-200" id="printable-receipt">
          {/* Cabecera */}
          <div className="text-center pb-3 border-b border-slate-100 dark:border-slate-800 space-y-1">
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Acta Oficial de {registro.tipoOperacion}
            </h2>
            <div className="flex flex-wrap justify-center items-center gap-3 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                {formatDate(registro.fechaHora, true)}
              </span>
              {registro.ubicacion?.sede && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  {registro.ubicacion.sede}
                </span>
              )}
            </div>
          </div>

          {/* Participantes */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-black text-emerald-600 uppercase block">Entregado Por</span>
              <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                {registro.entregaPor?.nombre || 'Confidencial'}
              </p>
              {registro.entregaPor?.documento && <p className="text-[11px] text-slate-500">Doc: {registro.entregaPor.documento}</p>}
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-black text-teal-600 uppercase block">Recibido Por</span>
              <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                {registro.recibePor?.nombre || 'Confidencial'}
              </p>
              {registro.recibePor?.documento && <p className="text-[11px] text-slate-500">Doc: {registro.recibePor.documento}</p>}
            </div>
          </div>

          {/* Módulo de Oro (si existe) */}
          {registro.oro && registro.oro.gramos > 0 && (
            <div className="bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 space-y-1.5">
              <span className="text-[11px] font-black text-amber-800 dark:text-amber-300 uppercase flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-600" />
                <span>Liquidación de Oro</span>
              </span>
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-2xl font-black text-amber-700 dark:text-amber-400">
                    {registro.oro.gramos.toFixed(2)} g
                  </span>
                  {registro.oro.leyPureza && (
                    <span className="text-xs text-slate-500 ml-2">({registro.oro.leyPureza})</span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    {formatMoney(registro.oro.valorLiquidacion, registro.oro.moneda || 'COP')}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Total Liquidado</span>
                </div>
              </div>
            </div>
          )}

          {/* Módulo de Dinero (si existe) */}
          {registro.dinero && registro.dinero.monto > 0 && (
            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-4 space-y-1">
              <span className="text-[11px] font-black text-emerald-800 dark:text-emerald-300 uppercase flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" />
                <span>Detalle Financiero</span>
              </span>
              <div className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                {formatMoney(registro.dinero.monto, registro.dinero.moneda)}
              </div>
              {registro.dinero.concepto && (
                <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                  {registro.dinero.concepto}
                </p>
              )}
            </div>
          )}

          {/* Módulo de Materiales (si existe) */}
          {registro.materiales && registro.materiales.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-600" />
                <span>Materiales Registrados ({registro.materiales.length})</span>
              </span>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {registro.materiales.map((it, idx) => (
                      <tr key={it.id} className="p-2">
                        <td className="p-2 text-slate-400">{idx + 1}</td>
                        <td className="p-2 font-semibold">{it.descripcion}</td>
                        <td className="p-2 text-right font-bold">{it.cantidad} {it.unidad}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Fotos de Evidencia */}
          {registro.fotos && registro.fotos.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">
                Fotografía(s) de Evidencia
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {registro.fotos.map((f, i) => (
                  <div key={f.id} className="rounded-xl overflow-hidden border border-slate-200 aspect-video bg-black/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.base64} alt={`Evidencia ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Firmas Digitales */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Firma Entrega</span>
              <div className="h-16 flex items-center justify-center">
                {registro.firmaEntrega?.base64 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={registro.firmaEntrega.base64} alt="Firma" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-xs text-slate-400 italic">Sin firma física</span>
                )}
              </div>
              <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-1">
                {registro.entregaPor?.nombre || 'Interviniente Entrega'}
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Firma Recibe</span>
              <div className="h-16 flex items-center justify-center">
                {registro.firmaRecibe?.base64 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={registro.firmaRecibe.base64} alt="Firma" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-xs text-slate-400 italic">Sin firma física</span>
                )}
              </div>
              <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-1">
                {registro.recibePor?.nombre || 'Interviniente Recepción'}
              </div>
            </div>
          </div>
        </div>

        {/* Acciones Inferiores */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Acta PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 text-xs"
              title="Imprimir"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-xs font-bold transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
