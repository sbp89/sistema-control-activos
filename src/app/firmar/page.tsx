'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  ShieldCheck, 
  Coins, 
  DollarSign, 
  Package, 
  Lock, 
  CheckCircle2, 
  UserCheck, 
  PenLine, 
  RefreshCw,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BorradorRemoto, Registro, EvidenciaFoto } from '@/lib/types';
import { decodeCompactDraftToken, isDraftCompleted, markDraftCompleted } from '@/lib/draft-service';
import { formatMoney } from '@/lib/utils';
import { saveRegistro } from '@/lib/db';
import { sendPdfToDrive } from '@/lib/drive-service';
import SignaturePad from '@/components/SignaturePad';
import CameraCapture from '@/components/CameraCapture';

function RemoteSignerContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('t');
  const draftId = searchParams.get('id') || searchParams.get('f');

  const [borrador, setBorrador] = useState<BorradorRemoto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpiredOrCompleted, setIsExpiredOrCompleted] = useState(false);
  
  const [firmaReceptor, setFirmaReceptor] = useState<string | undefined>(undefined);
  const [fotosReceptor, setFotosReceptor] = useState<EvidenciaFoto[]>([]);
  const [nombreFirmante, setNombreFirmante] = useState<string>('');
  const [documentoFirmante, setDocumentoFirmante] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const loadDraft = async () => {
      setIsLoading(true);

      // 1. Intentar decodificar token compacto de URL si existe
      let draftData: BorradorRemoto | null = null;
      if (token) {
        draftData = decodeCompactDraftToken(token);
      }

      // 2. Si no hay token o falló, buscar en API serverless por ID o folio
      const queryId = draftId || (draftData ? draftData.id : null) || (draftData ? draftData.folio : null);
      
      if (queryId) {
        try {
          const res = await fetch(`/api/borradores?id=${encodeURIComponent(queryId)}`);
          const json = await res.json();
          if (json.completed) {
            setIsExpiredOrCompleted(true);
            setIsLoading(false);
            return;
          }
          if (json.draft && !draftData) {
            draftData = json.draft;
          }
        } catch {}
      }

      if (!draftData) {
        setIsExpiredOrCompleted(true);
        setIsLoading(false);
        return;
      }

      // Verificar si ya fue completado localmente
      if (isDraftCompleted(draftData.id) || (draftData.folio && isDraftCompleted(draftData.folio))) {
        setIsExpiredOrCompleted(true);
        setIsLoading(false);
        return;
      }

      setBorrador(draftData);

      // Pre-cargar datos del firmante si venían pre-diligenciados
      if (draftData.parteAFirmar === 'RECEPCION' && draftData.recibePor?.nombre) {
        setNombreFirmante(draftData.recibePor.nombre);
        setDocumentoFirmante(draftData.recibePor.documento || '');
      } else if (draftData.parteAFirmar === 'ENTREGA' && draftData.entregaPor?.nombre) {
        setNombreFirmante(draftData.entregaPor.nombre);
        setDocumentoFirmante(draftData.entregaPor.documento || '');
      }

      setIsLoading(false);
    };

    loadDraft();
  }, [token, draftId]);

  const handleConfirmSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrador) return;

    setIsSubmitting(true);

    try {
      const allPhotos = [...(borrador.fotosEmisor || []), ...fotosReceptor];

      const firmaEntrega = borrador.parteAFirmar === 'ENTREGA'
        ? (firmaReceptor ? { base64: firmaReceptor, fechaFirma: new Date().toISOString() } : undefined)
        : borrador.firmaEmisor;

      const firmaRecibe = borrador.parteAFirmar === 'RECEPCION'
        ? (firmaReceptor ? { base64: firmaReceptor, fechaFirma: new Date().toISOString() } : undefined)
        : borrador.firmaEmisor;

      const updatedEntregaPor = borrador.parteAFirmar === 'ENTREGA'
        ? { ...borrador.entregaPor, nombre: nombreFirmante || borrador.entregaPor?.nombre, documento: documentoFirmante || borrador.entregaPor?.documento }
        : borrador.entregaPor;

      const updatedRecibePor = borrador.parteAFirmar === 'RECEPCION'
        ? { ...borrador.recibePor, nombre: nombreFirmante || borrador.recibePor?.nombre, documento: documentoFirmante || borrador.recibePor?.documento }
        : borrador.recibePor;

      const finalRegistro: Registro = {
        id: borrador.id,
        folio: borrador.folio,
        tipoOperacion: borrador.tipoOperacion,
        categoria: borrador.categoria,
        fechaHora: borrador.fechaHora,
        ubicacion: borrador.ubicacion,
        entregaPor: updatedEntregaPor,
        recibePor: updatedRecibePor,
        oro: borrador.oro,
        dinero: borrador.dinero,
        materiales: borrador.materiales,
        fotos: allPhotos.length > 0 ? allPhotos : undefined,
        firmaEntrega,
        firmaRecibe,
        clausulaAceptada: true,
        sincronizadoDrive: true,
        completadoRemoto: true,
        estado: 'COMPLETADO',
        creadoEn: borrador.creadoEn,
        actualizadoEn: new Date().toISOString(),
      };

      // Guardar el registro oficial
      saveRegistro(finalRegistro);

      // Despachar silenciosamente copia PDF a Drive
      sendPdfToDrive(finalRegistro);

      // Bloquear permanentemente el token
      markDraftCompleted(borrador.id, borrador.folio);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.5 },
        });
      } catch {}

      setIsFinished(true);
    } catch (err: any) {
      alert('Error al firmar acta: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pantalla de Carga
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-xs text-slate-400 font-medium">Cargando documento oficial...</p>
      </div>
    );
  }

  // Pantalla de Enlace Expirado o Ya Completado
  if (isExpiredOrCompleted || !borrador) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white">Enlace No Disponible</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Este enlace ya ha sido completado y firmado exitosamente, o ha caducado. Por motivos de seguridad y confidencialidad, el documento ya no se encuentra accesible.
          </p>
        </div>
      </div>
    );
  }

  // Pantalla de Éxito tras firmar
  if (isFinished) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-black text-white">¡Acta Firmada con Éxito!</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Tu firma y confirmación han sido registradas oficialmente. El comprobante digital ha sido emitido y archivado de manera segura.
          </p>
          <div className="pt-2 text-[11px] text-slate-500">
            Puedes cerrar esta pestaña de tu navegador con total tranquilidad.
          </div>
        </div>
      </div>
    );
  }

  const roleLabel = borrador.parteAFirmar === 'RECEPCION' ? 'Recepción (Quien Recibe)' : 'Entrega (Quien Entrega)';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-6 px-4 sm:px-6">
      <div className="max-w-xl w-full mx-auto space-y-6">
        
        {/* Cabecera del Documento Remoto */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Firma de Conformidad Oficial</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase">
            Acta de {borrador.tipoOperacion}
          </h1>
          <p className="text-xs font-mono text-slate-400">
            Folio: {borrador.folio}
          </p>
        </div>

        {/* Tarjeta de Resumen de lo que se está firmando */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Resumen de la Transacción
          </h3>

          {/* Oro (si aplica) */}
          {borrador.oro && (
            <div className="bg-amber-950/40 border border-amber-800/60 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-amber-400 uppercase flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5" />
                  <span>Oro</span>
                </span>
                <div className="text-xl font-black text-amber-300">
                  {borrador.oro.gramos.toFixed(2)} g
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Liquidación Total</span>
                <span className="text-lg font-black text-emerald-400">
                  {formatMoney(borrador.oro.valorLiquidacion, borrador.oro.moneda)}
                </span>
              </div>
            </div>
          )}

          {/* Dinero (si aplica) */}
          {borrador.dinero && borrador.dinero.monto > 0 && (
            <div className="bg-emerald-950/30 border border-emerald-800/60 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-emerald-400 uppercase flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Dinero ({borrador.dinero.metodoPago})</span>
                </span>
                <div className="text-xl font-black text-emerald-300">
                  {formatMoney(borrador.dinero.monto, borrador.dinero.moneda)}
                </div>
              </div>
              {borrador.dinero.concepto && (
                <div className="text-right text-xs text-slate-400 max-w-[50%] truncate">
                  {borrador.dinero.concepto}
                </div>
              )}
            </div>
          )}

          {/* Materiales (si aplica) */}
          {borrador.materiales && borrador.materiales.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1">
                <Package className="w-3.5 h-3.5" />
                <span>Materiales ({borrador.materiales.length} ítems)</span>
              </span>
              <ul className="text-xs space-y-1 text-slate-300">
                {borrador.materiales.map((m, i) => (
                  <li key={m.id || i} className="flex justify-between">
                    <span>• {m.descripcion}</span>
                    <span className="font-bold">{m.cantidad} {m.unidad}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Participantes */}
          <div className="grid grid-cols-2 gap-3 text-xs pt-1">
            <div className="bg-slate-800/40 p-3 rounded-xl">
              <span className="text-[10px] text-emerald-400 font-bold block">Entregó:</span>
              <span className="font-semibold text-white">{borrador.entregaPor?.nombre || 'Confidencial'}</span>
            </div>
            <div className="bg-slate-800/40 p-3 rounded-xl">
              <span className="text-[10px] text-teal-400 font-bold block">Recibe:</span>
              <span className="font-semibold text-white">{borrador.recibePor?.nombre || 'Confidencial'}</span>
            </div>
          </div>
        </div>

        {/* Formulario de Firma */}
        <form onSubmit={handleConfirmSignature} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PenLine className="w-4 h-4 text-emerald-400" />
              <span>Tu Firma de Conformidad</span>
            </h3>
            <p className="text-xs text-slate-400">
              Firma digitalmente con tu dedo en la pantalla para finalizar el acta.
            </p>
          </div>

          {/* Nombre y Documento (Opcionales) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Tu Nombre Completo (Opcional)
              </label>
              <input
                type="text"
                value={nombreFirmante}
                onChange={(e) => setNombreFirmante(e.target.value)}
                placeholder="Nombre y Apellido"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Cédula / Documento (Opcional)
              </label>
              <input
                type="text"
                value={documentoFirmante}
                onChange={(e) => setDocumentoFirmante(e.target.value)}
                placeholder="CC / DNI"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Foto de Evidencia (Opcional) */}
          <div>
            <CameraCapture
              photos={fotosReceptor}
              onChange={setFotosReceptor}
              maxPhotos={2}
            />
          </div>

          {/* Pad de Firma */}
          <div>
            <SignaturePad
              roleLabel={roleLabel}
              title="Firma con el dedo en este recuadro"
              signeeName={nombreFirmante}
              value={firmaReceptor}
              onChange={setFirmaReceptor}
            />
          </div>

          {/* Botón de Confirmación */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-xl active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Confirmando y Emitiendo Acta...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirmar y Firmar Acta</span>
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[11px] text-slate-500">
          Al presionar confirmar, se generará el documento oficial y este enlace quedará cerrado permanentemente.
        </p>
      </div>
    </div>
  );
}

export default function FirmarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Cargando...</div>}>
      <RemoteSignerContent />
    </Suspense>
  );
}
