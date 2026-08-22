'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  ShieldCheck, 
  MessageSquare,
  History,
  PlusCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { BorradorRemoto } from '@/lib/types';
import { createCompactDraftToken, saveDraftToServer } from '@/lib/draft-service';
import { formatMoney } from '@/lib/utils';

interface ShareWhatsAppModalProps {
  borradorData: Partial<BorradorRemoto>;
  onClose: () => void;
}

export default function ShareWhatsAppModal({
  borradorData,
  onClose,
}: ShareWhatsAppModalProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  // Generar token compacto
  const compactToken = createCompactDraftToken(borradorData);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const signingUrl = `${baseUrl}/firmar?t=${compactToken}`;

  // Persistir en servidor al abrir
  useEffect(() => {
    if (borradorData.id) {
      saveDraftToServer(borradorData as BorradorRemoto);
    }
  }, [borradorData]);

  // Construir resumen corto y profesional para el mensaje
  let conceptoResumen = '';
  if (borradorData.oro && borradorData.oro.gramos > 0) {
    conceptoResumen = `🥇 *Oro:* ${borradorData.oro.gramos.toFixed(2)} g | Total: ${formatMoney(borradorData.oro.valorLiquidacion, borradorData.oro.moneda)}`;
  } else if (borradorData.dinero && borradorData.dinero.monto > 0) {
    conceptoResumen = `💵 *Dinero:* ${formatMoney(borradorData.dinero.monto, borradorData.dinero.moneda)} (${borradorData.dinero.metodoPago || 'Efectivo'})`;
  } else if (borradorData.materiales && borradorData.materiales.length > 0) {
    conceptoResumen = `📦 *Materiales:* ${borradorData.materiales.length} ítem(s) registrados`;
  } else {
    conceptoResumen = `Transacción oficial`;
  }

  const operacionTexto = borradorData.tipoOperacion === 'ENTREGA' ? 'Entrega' : 'Recepción';

  // Mensaje corto y claro de WhatsApp
  const whatsappMessage = 
    `📋 *CONTROL DE CUSTODIA - ACTA DE ${operacionTexto.toUpperCase()}*\n\n` +
    `Hola, se ha pre-diligenciado el acta oficial *Folio: ${borradorData.folio}*.\n\n` +
    `📌 *Detalle:* ${conceptoResumen.replace(/\*/g, '')}\n\n` +
    `Por favor ingresa desde tu celular para verificar los datos y firmar con tu dedo:\n` +
    `👉 ${signingUrl}\n\n` +
    `_Enlace de un solo uso. No requiere crear cuenta ni descargar apps._`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(signingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(url, '_blank');
  };

  const handleGoToHistory = () => {
    onClose();
    router.push('/historial');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col">
        
        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-amber-500/10 dark:bg-amber-950/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Registro Guardado &bull; Pendiente de Firma
              </h3>
              <p className="text-[11px] text-slate-500">
                Folio oficial: <strong className="text-slate-800 dark:text-slate-200 font-mono">{borradorData.folio}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-4">
          
          {/* Vista previa del mensaje */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              Vista Previa del Mensaje de WhatsApp
            </span>
            <p className="text-slate-800 dark:text-slate-200 font-semibold leading-snug">
              📋 <strong>CONTROL DE CUSTODIA - ACTA DE {operacionTexto.toUpperCase()}</strong>
            </p>
            <p className="text-slate-600 dark:text-slate-300 text-[11px]">
              Folio: <strong>{borradorData.folio}</strong> &bull; {conceptoResumen.replace(/\*/g, '')}
            </p>
          </div>

          {/* Enlace generado */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Enlace Corto para Firma
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={signingUrl}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          {/* Información de seguridad */}
          <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-[11px] text-emerald-900 dark:text-emerald-300 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-600 mt-0.5" />
            <span>
              El tercero podrá abrir el enlace desde cualquier celular, revisar los datos y firmar de inmediato. No requiere contraseña y el enlace caduca tras ser firmado.
            </span>
          </div>

          {/* Botones de Acción */}
          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="w-full py-3.5 px-4 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-extrabold text-xs sm:text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Enviar por WhatsApp</span>
            </button>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleGoToHistory}
                className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <History className="w-3.5 h-3.5" />
                <span>Ver en Historial</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Crear Nuevo</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
