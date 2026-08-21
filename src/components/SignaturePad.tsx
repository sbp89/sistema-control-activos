'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { PenLine, Eraser, Check, ShieldAlert, CheckCircle2 } from 'lucide-react';

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
  required = false,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [omittedByConfidentiality, setOmittedByConfidentiality] = useState(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Inicializar o redimensionar canvas con Retina support
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Solo reconfigurar si las dimensiones cambiaron
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#0f172a'; // Slate 900
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
    // Prevenir scroll en móviles al tocar el canvas
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
      // Interpolación de curvas para que la firma sea suave
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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
      {/* Encabezado del Pad de Firma */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            {roleLabel}
          </span>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <PenLine className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <span>{title}</span>
          </h4>
          {signeeName && (
            <p className="text-xs text-slate-500 font-medium">
              Firmante: <span className="text-slate-800 dark:text-slate-200 font-semibold">{signeeName}</span>
            </p>
          )}
          {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
        </div>

        {/* Estado */}
        {hasSignature && !omittedByConfidentiality && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Firmado</span>
          </span>
        )}
      </div>

      {/* Área del Canvas interactivo */}
      <div className="relative">
        <div
          className={`relative rounded-xl border-2 transition-colors overflow-hidden bg-slate-50 dark:bg-slate-950/50 h-36 ${
            omittedByConfidentiality
              ? 'border-dashed border-amber-300 bg-amber-50/40 dark:bg-amber-950/20'
              : hasSignature
              ? 'border-emerald-500/80'
              : 'border-slate-300 dark:border-slate-700 hover:border-emerald-400'
          }`}
          style={{ touchAction: 'none' }} // Vital para evitar scroll mientras se dibuja con el dedo
        >
          {!omittedByConfidentiality ? (
            <>
              <canvas
                ref={canvasRef}
                className="w-full h-full cursor-crosshair block"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                onTouchCancel={stopDrawing}
              />

              {/* Guía visual de línea de firma */}
              <div className="absolute bottom-6 inset-x-6 border-b border-dashed border-slate-300 dark:border-slate-700 pointer-events-none flex justify-between">
                <span className="text-[10px] text-slate-400">Firma con dedo o mouse aquí</span>
                <span className="text-[10px] text-slate-400">✕</span>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-amber-700 dark:text-amber-300 px-4 text-center">
              <ShieldAlert className="w-6 h-6 mb-1 text-amber-600" />
              <p className="text-xs font-semibold">Firma Omitida por Confidencialidad</p>
              <p className="text-[11px] text-slate-500">
                La transacción se registrará como conformidad verbal sin firma física.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Controles del Pad */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={handleToggleOmit}
          className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline transition-colors"
        >
          {omittedByConfidentiality ? 'Deseo agregar firma' : 'Omitir firma (Confidencial)'}
        </button>

        {!omittedByConfidentiality && (
          <button
            type="button"
            onClick={handleClear}
            disabled={!hasSignature}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-all"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Borrar / Limpiar</span>
          </button>
        )}
      </div>
    </div>
  );
}
