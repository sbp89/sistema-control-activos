'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  SwitchCamera, 
  Upload, 
  Trash2, 
  Check, 
  Sparkles, 
  AlertCircle, 
  RefreshCw,
  Image as ImageIcon,
  Zap
} from 'lucide-react';
import { EvidenciaFoto } from '@/lib/types';
import { compressImage } from '@/lib/image-compressor';
import { generateId } from '@/lib/utils';

interface CameraCaptureProps {
  photos: EvidenciaFoto[];
  onChange: (photos: EvidenciaFoto[]) => void;
  maxPhotos?: number;
}

export default function CameraCapture({
  photos,
  onChange,
  maxPhotos = 4,
}: CameraCaptureProps) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isCompressing, setIsCompressing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastStats, setLastStats] = useState<{ originalKb: number; finalKb: number; reduction: number } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Reproducir sonido sintetizado de obturador con Web Audio API
  const playShutterSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {
      // Ignorar si el navegador bloquea audio
    }
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = async (mode: 'environment' | 'user') => {
    setErrorMessage(null);
    stopStream();

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Error al iniciar cámara con facingMode:', mode, err);
      // Reintentar sin constraints específicos si falla
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setIsCameraActive(true);
      } catch (fallbackErr: any) {
        setErrorMessage('No se pudo acceder a la cámara. Revisa los permisos de tu navegador o usa el botón de subir foto.');
        setIsCameraActive(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const handleCapturePhoto = async () => {
    if (!videoRef.current) return;
    
    playShutterSound();
    setIsCompressing(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No se pudo crear contexto de canvas');

      // Si es cámara frontal tipo selfie, voltear horizontalmente
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const rawDataUrl = canvas.toDataURL('image/jpeg', 0.95);

      // Comprimir automáticamente para optimizar Drive
      const compResult = await compressImage(rawDataUrl, {
        maxWidth: 1280,
        maxHeight: 1280,
        quality: 0.78,
      });

      const newPhoto: EvidenciaFoto = {
        id: generateId(),
        base64: compResult.base64,
        nombre: `Foto_Evidencia_${photos.length + 1}.jpg`,
        fechaCaptura: new Date().toISOString(),
        tamanoKb: compResult.sizeKb,
      };

      setLastStats({
        originalKb: compResult.originalSizeKb,
        finalKb: compResult.sizeKb,
        reduction: compResult.reductionPercentage,
      });

      onChange([...photos, newPhoto]);
      
      // Si alcanzó el máximo, apagar cámara
      if (photos.length + 1 >= maxPhotos) {
        stopStream();
        setIsCameraActive(false);
      }
    } catch (err: any) {
      setErrorMessage('Error al capturar y procesar la fotografía: ' + err.message);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressing(true);
    setErrorMessage(null);

    try {
      const newPhotosList: EvidenciaFoto[] = [...photos];

      for (let i = 0; i < files.length; i++) {
        if (newPhotosList.length >= maxPhotos) break;
        const file = files[i];
        
        const compResult = await compressImage(file, {
          maxWidth: 1280,
          maxHeight: 1280,
          quality: 0.78,
        });

        newPhotosList.push({
          id: generateId(),
          base64: compResult.base64,
          nombre: file.name || `Foto_${newPhotosList.length + 1}.jpg`,
          fechaCaptura: new Date().toISOString(),
          tamanoKb: compResult.sizeKb,
        });

        setLastStats({
          originalKb: compResult.originalSizeKb,
          finalKb: compResult.sizeKb,
          reduction: compResult.reductionPercentage,
        });
      }

      onChange(newPhotosList);
    } catch (err: any) {
      setErrorMessage('Error al procesar la imagen: ' + err.message);
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePhoto = (id: string) => {
    onChange(photos.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Camera className="w-4 h-4 text-emerald-600" />
            <span>Fotografía de Evidencia (Opcional)</span>
          </label>
          <p className="text-xs text-slate-500">
            Captura evidencia del dinero, material o entrega. Comprimida automáticamente para Google Drive.
          </p>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full">
          {photos.length} / {maxPhotos} fotos
        </span>
      </div>

      {/* Visor de Cámara Activa */}
      {isCameraActive && (
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-[380px] flex items-center justify-center border-2 border-emerald-500 shadow-xl animate-in fade-in duration-300">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="w-full h-full object-cover"
          />

          {/* Botones de control flotantes sobre la cámara */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleCameraFacing}
              className="p-2.5 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-md transition-all shadow-md active:scale-95"
              title="Cambiar cámara frontal/trasera"
            >
              <SwitchCamera className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                stopStream();
                setIsCameraActive(false);
              }}
              className="px-3 py-1.5 rounded-full bg-red-600/80 text-white text-xs font-semibold hover:bg-red-700 backdrop-blur-md transition-all shadow-md"
            >
              Cerrar
            </button>
          </div>

          {/* Botón de Disparo Principal */}
          <div className="absolute bottom-4 inset-x-0 flex justify-center">
            <button
              type="button"
              onClick={handleCapturePhoto}
              disabled={isCompressing}
              className="w-16 h-16 rounded-full bg-white border-4 border-emerald-500 flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all text-emerald-600 disabled:opacity-50"
              title="Tomar Foto"
            >
              {isCompressing ? (
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                  <Camera className="w-6 h-6" />
                </div>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Botones para Activar Cámara o Subir Archivo */}
      {!isCameraActive && photos.length < maxPhotos && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => startCamera(facingMode)}
            className="flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl border-2 border-dashed border-emerald-500/60 bg-emerald-50/50 hover:bg-emerald-100/60 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium text-sm transition-all group"
          >
            <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Abrir Cámara en Vivo</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-sm transition-all group"
          >
            <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Cargar desde Galería / Archivo</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      )}

      {/* Mensaje de Error si lo hay */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Notificación de Optimización de Espacio Drive */}
      {lastStats && (
        <div className="flex items-center justify-between px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs rounded-xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>
              <strong>Optimizada para Drive (Trabajo/Mono):</strong> {lastStats.originalKb} KB ➔{' '}
              <strong>{lastStats.finalKb} KB</strong> (-{lastStats.reduction}%)
            </span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-600">✓ Ultra Ligera</span>
        </div>
      )}

      {/* Galería de Fotografías Tomadas */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {photos.map((foto, index) => (
            <div
              key={foto.id}
              className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-square shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={foto.base64}
                alt={`Evidencia ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <span className="text-[10px] text-white/90 bg-black/50 px-1.5 py-0.5 rounded self-start">
                  #{index + 1} • {foto.tamanoKb ? `${foto.tamanoKb} KB` : 'Evidencia'}
                </span>
                <button
                  type="button"
                  onClick={() => removePhoto(foto.id)}
                  className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 self-end shadow-md active:scale-90 transition-transform"
                  title="Eliminar foto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
