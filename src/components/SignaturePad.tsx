'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { PenLine, Eraser, CheckCircle2, ShieldAlert } from 'lucide-react';

interface SignaturePadProps {
  title: string;
  subtitle?: string;
  roleLabel: string;
  signeeName?: string;
  value?: string;
  onChange: (base64Signature?: string) => void;
  required?: boolean;
}

export default function SignaturePad({
  title,
  subtitle,
  roleLabel,
  signeeName,
  value,
  onChange,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [omittedByConfidentiality, setOmittedByConfidentiality] = useState(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Inicializar o redimensionar canvas con Retina support y trazo de alto contraste
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Reconfigurar dimensiones si cambiaron
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 3.2; // Trazo firme y nítido
        ctx.strokeStyle = '#020617'; // Tinta negra/azul oscuro profunda para máximo contraste
      }

      // Si ya existía un valor previo en base64, dibujarlo
      if (value && !omittedByConfidentiality) {
        const img = new Image();
        img.onload = () => {
          const ctx2 = canvas.getContext('2d');
          if (ctx2) {
            ctx2.drawImage(img, 0, 0, rect.width, rect.height);
            setHasSignature(true);
          }
        };
        img.src = value;
      }
    }
  }, [value, omittedByConfidentiality]);

  useEffect(() => {
    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    return () => window.removeEventListener('resize', setupCanvas);
  }, [setupCanvas]);

  // Obtener coordenadas relativas precisas del mouse o touch
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (omittedByConfidentiality) return;
    if ('touches' in e && e.cancelable) {
      e.preventDefault();
    }

    const coords = getCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    lastPointRef.current = coords;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || omittedByConfidentiality) return;
    if ('touches' in e && e.cancelable) {
      e.preventDefault();
    }

    const coords = getCoordinates(e);
    if (!coords || !lastPointRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      const midPoint = {
        x: (lastPointRef.current.x + coords.x) / 2,
        y: (lastPointRef.current.y + coords.y) / 2,
      };
      ctx.quadraticCurveTo(lastPointRef.current.x, lastPointRef.current.y, midPoint.x, midPoint.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }

    lastPointRef.current = coords;
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPointRef.current = null;

    const canvas = canvasRef.current;
    if (canvas && hasSignature) {
      const dataUrl = canvas.toDataURL('image/png');
      onChange(dataUrl);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
    }
    setHasSignature(false);
    onChange(undefined);
  };

  const handleToggleOmit = () => {
    const nextOmitted = !omittedByConfidentiality;
    setOmittedByConfidentiality(nextOmitted);
    if (nextOmitted) {
      handleClear();
      onChange(undefined);
    }
  };

  return (
    <div className="bg-slate-100/80 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-3xl p-4 sm:p-5 shadow-md space-y-3">
      {/* Encabezado */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
            {roleLabel}
          </span>
          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
            <PenLine className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{title}</span>
          </h4>
          {signeeName && (
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Firmante: <strong className="text-slate-900 dark:text-white">{signeeName}</strong>
            </p>
          )}
          {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
        </div>

        {/* Indicador de Estado */}
        {hasSignature && !omittedByConfidentiality && (
          <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-full shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Firmado</span>
          </span>
        )}
      </div>

      {/* Recuadro de Firma de Alto Contraste (Fondo Blanco Nítido) */}
      <div className="relative">
        <div
          className={`relative rounded-2xl border-2 transition-all overflow-hidden bg-white shadow-inner h-40 ${
            omittedByConfidentiality
              ? 'border-dashed border-amber-400 bg-amber-50/50'
              : hasSignature
              ? 'border-emerald-500 ring-2 ring-emerald-500/20'
              : 'border-slate-400 hover:border-slate-600 focus-within:border-emerald-500'
          }`}
          style={{ touchAction: 'none' }}
        >
          {!omittedByConfidentiality ? (
            <>
              <canvas
                ref={canvasRef}
                className="w-full h-full cursor-crosshair block relative z-10"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                onTouchCancel={stopDrawing}
              />

              {/* Guía visual de alto contraste */}
              <div className="absolute bottom-6 inset-x-6 border-b-2 border-dashed border-slate-300 pointer-events-none flex justify-between z-0">
                <span className="text-[11px] font-bold text-slate-400 select-none pb-0.5">
                  Firma con tu dedo o mouse aquí
                </span>
                <span className="text-[11px] font-black text-slate-400 select-none">✕</span>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-amber-800 px-4 text-center">
              <ShieldAlert className="w-6 h-6 mb-1 text-amber-600" />
              <p className="text-xs font-black">Firma Omitida por Confidencialidad</p>
              <p className="text-[11px] text-slate-600">
                La transacción se registrará como conformidad verbal sin firma física.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Controles Inferiores */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={handleToggleOmit}
          className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline transition-colors"
        >
          {omittedByConfidentiality ? 'Deseo agregar firma' : 'Omitir firma (Confidencial)'}
        </button>

        {!omittedByConfidentiality && (
          <button
            type="button"
            onClick={handleClear}
            disabled={!hasSignature}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold rounded-xl text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 shadow-sm disabled:opacity-40 transition-all active:scale-95"
          >
            <Eraser className="w-3.5 h-3.5 text-red-500" />
            <span>Limpiar Firma</span>
          </button>
        )}
      </div>
    </div>
  );
}
