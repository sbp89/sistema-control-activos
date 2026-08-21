'use client';

import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  DollarSign, 
  Package, 
  Layers, 
  ShieldCheck, 
  Calendar, 
  MapPin, 
  FileCheck2, 
  Sparkles, 
  Send, 
  RefreshCw,
  Info,
  Navigation
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  Registro, 
  TipoOperacion, 
  CategoriaOperacion, 
  DetalleDinero, 
  ItemMaterial, 
  Participante, 
  EvidenciaFoto, 
  UbicacionData 
} from '@/lib/types';
import { generateId, generateFolio } from '@/lib/utils';
import { saveRegistro, getGoogleDriveConfig } from '@/lib/db';
import { syncRegistroToDrive } from '@/lib/drive-service';
import CameraCapture from './CameraCapture';
import SignaturePad from './SignaturePad';
import MaterialItemsTable from './MaterialItemsTable';
import ReceiptModal from './ReceiptModal';

const MONEDAS = ['COP', 'USD', 'EUR', 'MXN', 'ARS', 'CLP', 'PEN'];
const METODOS_PAGO = ['EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'CONSIGNACION', 'OTRO'];

export default function RegistroForm({ onRegistroCreado }: { onRegistroCreado?: (reg: Registro) => void }) {
  // Estado principal del formulario
  const [tipoOperacion, setTipoOperacion] = useState<TipoOperacion>('ENTREGA');
  const [categoria, setCategoria] = useState<CategoriaOperacion>('DINERO');
  
  // Fecha y ubicación
  const [fechaHora, setFechaHora] = useState<string>(() => new Date().toISOString().slice(0, 16));
  const [ubicacion, setUbicacion] = useState<UbicacionData>({
    sede: '',
    proyecto: '',
    ciudad: '',
  });

  // Dinero
  const [monto, setMonto] = useState<string>('');
  const [moneda, setMoneda] = useState<string>('COP');
  const [metodoPago, setMetodoPago] = useState<string>('EFECTIVO');
  const [conceptoDinero, setConceptoDinero] = useState<string>('');
  const [numeroComprobante, setNumeroComprobante] = useState<string>('');

  // Materiales
  const [materiales, setMateriales] = useState<ItemMaterial[]>([
    {
      id: generateId(),
      descripcion: '',
      cantidad: 1,
      unidad: 'unidades',
      estado: 'BUENO',
      numeroSerie: '',
    },
  ]);

  // Participantes (Opcionales)
  const [entregaPor, setEntregaPor] = useState<Participante>({
    nombre: '',
    documento: '',
    cargoEmpresa: '',
    telefono: '',
  });

  const [recibePor, setRecibePor] = useState<Participante>({
    nombre: '',
    documento: '',
    cargoEmpresa: '',
    telefono: '',
  });

  // Fotos y Firmas
  const [fotos, setFotos] = useState<EvidenciaFoto[]>([]);
  const [firmaEntrega, setFirmaEntrega] = useState<string | undefined>(undefined);
  const [firmaRecibe, setFirmaRecibe] = useState<string | undefined>(undefined);

  // Observaciones
  const [observaciones, setObservaciones] = useState<string>('');

  // Estados de control
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedRegistro, setSavedRegistro] = useState<Registro | null>(null);

  // Capturar GPS
  const handleGetLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUbicacion((prev) => ({
            ...prev,
            latitud: pos.coords.latitude,
            longitud: pos.coords.longitude,
          }));
          alert(`Ubicación GPS fijada: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        },
        () => {
          alert('No se pudo obtener la geolocalización. Puedes escribir la sede manualmente.');
        }
      );
    }
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const folio = generateFolio(tipoOperacion);
      const parsedMonto = parseFloat(monto) || 0;

      // Filtrar materiales válidos si aplica
      const cleanedMateriales = (categoria === 'MATERIAL' || categoria === 'MIXTO')
        ? materiales.filter((m) => m.descripcion.trim().length > 0 || (m.cantidad && m.cantidad > 0))
        : [];

      const newRegistro: Registro = {
        id: generateId(),
        folio,
        tipoOperacion,
        categoria,
        fechaHora: new Date(fechaHora).toISOString(),
        ubicacion: ubicacion.sede || ubicacion.proyecto ? ubicacion : undefined,
        entregaPor: entregaPor.nombre || entregaPor.documento ? entregaPor : undefined,
        recibePor: recibePor.nombre || recibePor.documento ? recibePor : undefined,
        dinero: (categoria === 'DINERO' || categoria === 'MIXTO') && parsedMonto > 0 ? {
          monto: parsedMonto,
          moneda,
          metodoPago,
          concepto: conceptoDinero || undefined,
          numeroComprobante: numeroComprobante || undefined,
        } : undefined,
        materiales: cleanedMateriales.length > 0 ? cleanedMateriales : undefined,
        fotos: fotos.length > 0 ? fotos : undefined,
        firmaEntrega: firmaEntrega ? { base64: firmaEntrega, fechaFirma: new Date().toISOString() } : undefined,
        firmaRecibe: firmaRecibe ? { base64: firmaRecibe, fechaFirma: new Date().toISOString() } : undefined,
        observacionesGenerales: observaciones || undefined,
        clausulaAceptada: true,
        sincronizadoDrive: false,
        creadoEn: new Date().toISOString(),
        actualizadoEn: new Date().toISOString(),
      };

      // Guardar en almacenamiento local
      saveRegistro(newRegistro);

      // Lanzar confeti visual de éxito
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      // Sincronizar en segundo plano si Drive está activo y auto-sync encendido
      const driveConfig = getGoogleDriveConfig();
      if (driveConfig.webhookUrl && driveConfig.autoSync) {
        syncRegistroToDrive(newRegistro, driveConfig).then((res) => {
          if (res.success) {
            newRegistro.sincronizadoDrive = true;
            newRegistro.driveFileUrl = res.driveFolderUrl;
            saveRegistro(newRegistro);
          }
        });
      }

      setSavedRegistro(newRegistro);
      if (onRegistroCreado) onRegistroCreado(newRegistro);

      // Resetear campos clave
      setMonto('');
      setConceptoDinero('');
      setNumeroComprobante('');
      setObservaciones('');
      setFotos([]);
      setFirmaEntrega(undefined);
      setFirmaRecibe(undefined);
      setMateriales([
        {
          id: generateId(),
          descripcion: '',
          cantidad: 1,
          unidad: 'unidades',
          estado: 'BUENO',
          numeroSerie: '',
        },
      ]);
    } catch (err: any) {
      alert('Error al guardar el registro: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEntrega = tipoOperacion === 'ENTREGA';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
      {/* Encabezado del Formulario con Selector de Tipo */}
      <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Registro Rápido & Oficial</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Nuevo Movimiento de Custodia
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              Diligencia los datos para generar el acta en PDF con fotos, firmas y respaldo en Drive.
            </p>
          </div>

          {/* Toggle Principal: ENTREGA vs RECEPCIÓN */}
          <div className="inline-flex p-1.5 bg-slate-950/70 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-inner self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setTipoOperacion('ENTREGA')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                isEntrega
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50 scale-102'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>ENTREGA</span>
            </button>

            <button
              type="button"
              onClick={() => setTipoOperacion('RECEPCION')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                !isEntrega
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/50 scale-102'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>RECEPCIÓN</span>
            </button>
          </div>
        </div>

        {/* Selector de Categoría (Dinero / Material / Mixto) */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoria('DINERO')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              categoria === 'DINERO'
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Solo Dinero</span>
          </button>

          <button
            type="button"
            onClick={() => setCategoria('MATERIAL')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              categoria === 'MATERIAL'
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Solo Materiales / Equipos</span>
          </button>

          <button
            type="button"
            onClick={() => setCategoria('MIXTO')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              categoria === 'MIXTO'
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Mixto (Dinero + Material)</span>
          </button>
        </div>
      </div>

      {/* Formulario Principal */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
        
        {/* Banner de Aviso de Flexibilidad y Confidencialidad */}
        <div className="flex items-start gap-3 p-4 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl text-xs text-emerald-900 dark:text-emerald-200">
          <Info className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Flexibilidad por Confidencialidad:</strong> Los nombres, documentos, números de teléfono, firmas y fotos son completamente opcionales. Puedes registrar únicamente los datos esenciales requeridos para la transacción.
          </div>
        </div>

        {/* 1. SECCIÓN: DETALLE DE DINERO (SI APLICA) */}
        {(categoria === 'DINERO' || categoria === 'MIXTO') && (
          <section className="space-y-4 pt-2">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span>Detalle Financiero ({isEntrega ? 'Entrega de Dinero' : 'Recepción de Dinero'})</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-6">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Monto *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2.5 text-lg font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Moneda
                </label>
                <select
                  value={moneda}
                  onChange={(e) => setMoneda(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {MONEDAS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Método de Pago
                </label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {METODOS_PAGO.map((mp) => (
                    <option key={mp} value={mp}>
                      {mp}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-8">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Concepto / Motivo de la Entrega o Recepción
                </label>
                <input
                  type="text"
                  value={conceptoDinero}
                  onChange={(e) => setConceptoDinero(e.target.value)}
                  placeholder="Ej. Anticipo de obra, compra de suministros, viáticos..."
                  className="w-full px-4 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  No. Comprobante / Referencia (Opcional)
                </label>
                <input
                  type="text"
                  value={numeroComprobante}
                  onChange={(e) => setNumeroComprobante(e.target.value)}
                  placeholder="Ej. Transf #9821, Cheque #004"
                  className="w-full px-4 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </section>
        )}

        {/* 2. SECCIÓN: DETALLE DE MATERIALES (SI APLICA) */}
        {(categoria === 'MATERIAL' || categoria === 'MIXTO') && (
          <section className="space-y-4 pt-2">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                {categoria === 'MIXTO' ? '2' : '1'}
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                <span>Detalle de Materiales o Equipos</span>
              </h3>
            </div>

            <MaterialItemsTable items={materiales} onChange={setMateriales} />
          </section>
        )}

        {/* 3. SECCIÓN: PARTICIPANTES (OPCIONALES) */}
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                {categoria === 'MIXTO' ? '3' : '2'}
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Datos de las Partes (Opcional)
              </h3>
            </div>
            <span className="text-xs text-slate-400">Campos no obligatorios</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Persona que Entrega */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                Persona que Entrega
              </span>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={entregaPor.nombre || ''}
                  onChange={(e) => setEntregaPor({ ...entregaPor, nombre: e.target.value })}
                  placeholder="Opcional: Juan Pérez"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Cédula / Documento
                  </label>
                  <input
                    type="text"
                    value={entregaPor.documento || ''}
                    onChange={(e) => setEntregaPor({ ...entregaPor, documento: e.target.value })}
                    placeholder="CC / DNI"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Cargo / Empresa
                  </label>
                  <input
                    type="text"
                    value={entregaPor.cargoEmpresa || ''}
                    onChange={(e) => setEntregaPor({ ...entregaPor, cargoEmpresa: e.target.value })}
                    placeholder="Tesorero / Almacén"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Persona que Recibe */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider block">
                Persona que Recibe
              </span>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={recibePor.nombre || ''}
                  onChange={(e) => setRecibePor({ ...recibePor, nombre: e.target.value })}
                  placeholder="Opcional: Andrés Gómez"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Cédula / Documento
                  </label>
                  <input
                    type="text"
                    value={recibePor.documento || ''}
                    onChange={(e) => setRecibePor({ ...recibePor, documento: e.target.value })}
                    placeholder="CC / DNI"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Cargo / Empresa
                  </label>
                  <input
                    type="text"
                    value={recibePor.cargoEmpresa || ''}
                    onChange={(e) => setRecibePor({ ...recibePor, cargoEmpresa: e.target.value })}
                    placeholder="Supervisor / Contratista"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. SECCIÓN: FOTOGRAFÍA DE EVIDENCIA */}
        <section className="space-y-4 pt-2">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
              {categoria === 'MIXTO' ? '4' : '3'}
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Evidencia Fotográfica
            </h3>
          </div>

          <CameraCapture photos={fotos} onChange={setFotos} maxPhotos={4} />
        </section>

        {/* 5. SECCIÓN: FIRMAS DIGITALES */}
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                {categoria === 'MIXTO' ? '5' : '4'}
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Firmas Digitales de Conformidad
              </h3>
            </div>
            <span className="text-xs text-slate-400">Táctil (dedo) o Mouse</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SignaturePad
              roleLabel="Entrega"
              title="Firma Quien Entrega"
              subtitle="Firma digital con el dedo o mouse"
              signeeName={entregaPor.nombre}
              value={firmaEntrega}
              onChange={setFirmaEntrega}
            />

            <SignaturePad
              roleLabel="Recepción"
              title="Firma Quien Recibe"
              subtitle="Firma digital con el dedo o mouse"
              signeeName={recibePor.nombre}
              value={firmaRecibe}
              onChange={setFirmaRecibe}
            />
          </div>
        </section>

        {/* 6. SECCIÓN: FECHA, UBICACIÓN & OBSERVACIONES */}
        <section className="space-y-4 pt-2">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
              {categoria === 'MIXTO' ? '6' : '5'}
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Ubicación y Observaciones
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Fecha y Hora de la Transacción
              </label>
              <input
                type="datetime-local"
                value={fechaHora}
                onChange={(e) => setFechaHora(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Sede / Ubicación
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={ubicacion.sede || ''}
                  onChange={(e) => setUbicacion({ ...ubicacion, sede: e.target.value })}
                  placeholder="Ej. Oficina Principal, Obra Norte..."
                  className="w-full pl-3 pr-8 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600"
                  title="Capturar GPS actual"
                >
                  <Navigation className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Proyecto / Centro de Costos
              </label>
              <input
                type="text"
                value={ubicacion.proyecto || ''}
                onChange={(e) => setUbicacion({ ...ubicacion, proyecto: e.target.value })}
                placeholder="Ej. Proyecto Alpha, Caja Menor..."
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-12">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Observaciones Generales / Condiciones Especiales
              </label>
              <textarea
                rows={2}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Notas adicionales sobre el estado de los bienes, acuerdos verbales, etc."
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Botón de Envío y Guardado */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Al guardar se generará el Acta en PDF con folio y código QR listo para imprimir o enviar.</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xl shadow-emerald-900/30 hover:scale-102 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generando Acta...</span>
              </>
            ) : (
              <>
                <FileCheck2 className="w-5 h-5" />
                <span>Guardar y Generar Acta de {tipoOperacion}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Modal de Comprobante / Acta Generada */}
      {savedRegistro && (
        <ReceiptModal
          registro={savedRegistro}
          onClose={() => setSavedRegistro(null)}
        />
      )}
    </div>
  );
}
