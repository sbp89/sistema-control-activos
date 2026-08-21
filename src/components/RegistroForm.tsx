'use client';

import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  DollarSign, 
  Package, 
  Layers, 
  Coins, 
  FileCheck2, 
  RefreshCw,
  Navigation,
  Calculator,
  Share2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  Registro, 
  TipoOperacion, 
  CategoriaOperacion, 
  ItemMaterial, 
  Participante, 
  EvidenciaFoto, 
  UbicacionData,
  BorradorRemoto
} from '@/lib/types';
import { generateId, generateFolio } from '@/lib/utils';
import { saveRegistro } from '@/lib/db';
import { sendPdfToDrive } from '@/lib/drive-service';
import CameraCapture from './CameraCapture';
import SignaturePad from './SignaturePad';
import MaterialItemsTable from './MaterialItemsTable';
import ReceiptModal from './ReceiptModal';
import ShareWhatsAppModal from './ShareWhatsAppModal';

const MONEDAS = ['COP', 'USD', 'EUR', 'MXN', 'ARS', 'CLP', 'PEN'];
const METODOS_PAGO = ['EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'CONSIGNACION', 'OTRO'];

export default function RegistroForm({ onRegistroCreado }: { onRegistroCreado?: (reg: Registro) => void }) {
  const [tipoOperacion, setTipoOperacion] = useState<TipoOperacion>('ENTREGA');
  const [categoria, setCategoria] = useState<CategoriaOperacion>('ORO');
  
  const [fechaHora, setFechaHora] = useState<string>(() => new Date().toISOString().slice(0, 16));
  const [ubicacion, setUbicacion] = useState<UbicacionData>({ sede: '', proyecto: '' });

  // Módulo de Oro (Gramos y Liquidación)
  const [oroGramos, setOroGramos] = useState<string>('');
  const [oroLiquidacion, setOroLiquidacion] = useState<string>('');
  const [oroPrecioGramo, setOroPrecioGramo] = useState<string>('');
  const [oroMoneda, setOroMoneda] = useState<string>('COP');
  const [oroTipoPieza, setOroTipoPieza] = useState<string>('');
  const [oroObservaciones, setOroObservaciones] = useState<string>('');

  // Módulo de Dinero
  const [montoDinero, setMontoDinero] = useState<string>('');
  const [monedaDinero, setMonedaDinero] = useState<string>('COP');
  const [metodoPago, setMetodoPago] = useState<string>('EFECTIVO');
  const [conceptoDinero, setConceptoDinero] = useState<string>('');
  const [numeroComprobante, setNumeroComprobante] = useState<string>('');

  // Módulo de Materiales
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
  const [entregaPor, setEntregaPor] = useState<Participante>({ nombre: '', documento: '', cargoEmpresa: '', telefono: '' });
  const [recibePor, setRecibePor] = useState<Participante>({ nombre: '', documento: '', cargoEmpresa: '', telefono: '' });

  // Fotos y Firmas
  const [fotos, setFotos] = useState<EvidenciaFoto[]>([]);
  const [firmaEntrega, setFirmaEntrega] = useState<string | undefined>(undefined);
  const [firmaRecibe, setFirmaRecibe] = useState<string | undefined>(undefined);

  // Observaciones Generales
  const [observaciones, setObservaciones] = useState<string>('');

  // Estados de control
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedRegistro, setSavedRegistro] = useState<Registro | null>(null);
  const [borradorToShare, setBorradorToShare] = useState<Partial<BorradorRemoto> | null>(null);

  // Cálculo asistido
  const handleGramosChange = (val: string) => {
    setOroGramos(val);
    const g = parseFloat(val) || 0;
    const p = parseFloat(oroPrecioGramo) || 0;
    if (g > 0 && p > 0) {
      setOroLiquidacion(String(Math.round(g * p)));
    }
  };

  const handlePrecioGramoChange = (val: string) => {
    setOroPrecioGramo(val);
    const p = parseFloat(val) || 0;
    const g = parseFloat(oroGramos) || 0;
    if (g > 0 && p > 0) {
      setOroLiquidacion(String(Math.round(g * p)));
    }
  };

  const handleLiquidacionChange = (val: string) => {
    setOroLiquidacion(val);
    const liq = parseFloat(val) || 0;
    const g = parseFloat(oroGramos) || 0;
    if (g > 0 && liq > 0) {
      setOroPrecioGramo(String(Math.round(liq / g)));
    }
  };

  const handleGetLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUbicacion((prev) => ({
            ...prev,
            latitud: pos.coords.latitude,
            longitud: pos.coords.longitude,
          }));
        },
        () => {}
      );
    }
  };

  // Preparar borrador para compartir por WhatsApp
  const handleShareDraft = () => {
    const folio = generateFolio(tipoOperacion);
    const parsedGramos = parseFloat(oroGramos) || 0;
    const parsedLiquidacion = parseFloat(oroLiquidacion) || 0;
    const parsedPrecioG = parseFloat(oroPrecioGramo) || 0;
    const parsedMontoDinero = parseFloat(montoDinero) || 0;

    const cleanedMateriales = (categoria === 'MATERIAL' || categoria === 'MIXTO')
      ? materiales.filter((m) => m.descripcion.trim().length > 0 || (m.cantidad && m.cantidad > 0))
      : [];

    const draftData: Partial<BorradorRemoto> = {
      id: generateId(),
      folio,
      tipoOperacion,
      categoria,
      fechaHora: new Date(fechaHora).toISOString(),
      ubicacion: ubicacion.sede || ubicacion.proyecto ? ubicacion : undefined,
      entregaPor: entregaPor.nombre || entregaPor.documento ? entregaPor : undefined,
      recibePor: recibePor.nombre || recibePor.documento ? recibePor : undefined,
      oro: (categoria === 'ORO' || categoria === 'MIXTO') && (parsedGramos > 0 || parsedLiquidacion > 0) ? {
        gramos: parsedGramos,
        valorLiquidacion: parsedLiquidacion,
        precioPorGramo: parsedPrecioG > 0 ? parsedPrecioG : undefined,
        moneda: oroMoneda,
        tipoPieza: oroTipoPieza || undefined,
        observaciones: oroObservaciones || undefined,
      } : undefined,
      dinero: (categoria === 'DINERO' || categoria === 'MIXTO') && parsedMontoDinero > 0 ? {
        monto: parsedMontoDinero,
        moneda: monedaDinero,
        metodoPago,
        concepto: conceptoDinero || undefined,
        numeroComprobante: numeroComprobante || undefined,
      } : undefined,
      materiales: cleanedMateriales.length > 0 ? cleanedMateriales : undefined,
      firmaEmisor: (tipoOperacion === 'ENTREGA' ? firmaEntrega : firmaRecibe) ? {
        base64: tipoOperacion === 'ENTREGA' ? firmaEntrega : firmaRecibe,
        fechaFirma: new Date().toISOString(),
      } : undefined,
      fotosEmisor: fotos.length > 0 ? fotos : undefined,
      parteAFirmar: tipoOperacion === 'ENTREGA' ? 'RECEPCION' : 'ENTREGA',
    };

    setBorradorToShare(draftData);
  };

  // Envío Directo
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const folio = generateFolio(tipoOperacion);
      const parsedGramos = parseFloat(oroGramos) || 0;
      const parsedLiquidacion = parseFloat(oroLiquidacion) || 0;
      const parsedPrecioG = parseFloat(oroPrecioGramo) || 0;
      const parsedMontoDinero = parseFloat(montoDinero) || 0;

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
        
        oro: (categoria === 'ORO' || categoria === 'MIXTO') && (parsedGramos > 0 || parsedLiquidacion > 0) ? {
          gramos: parsedGramos,
          valorLiquidacion: parsedLiquidacion,
          precioPorGramo: parsedPrecioG > 0 ? parsedPrecioG : (parsedGramos > 0 ? Math.round(parsedLiquidacion / parsedGramos) : undefined),
          moneda: oroMoneda,
          tipoPieza: oroTipoPieza || undefined,
          observaciones: oroObservaciones || undefined,
        } : undefined,

        dinero: (categoria === 'DINERO' || categoria === 'MIXTO') && parsedMontoDinero > 0 ? {
          monto: parsedMontoDinero,
          moneda: monedaDinero,
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
        sincronizadoDrive: true,
        creadoEn: new Date().toISOString(),
        actualizadoEn: new Date().toISOString(),
      };

      saveRegistro(newRegistro);
      sendPdfToDrive(newRegistro);

      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {}

      setSavedRegistro(newRegistro);
      if (onRegistroCreado) onRegistroCreado(newRegistro);

      // Reset
      setOroGramos('');
      setOroLiquidacion('');
      setOroPrecioGramo('');
      setOroTipoPieza('');
      setOroObservaciones('');
      setMontoDinero('');
      setConceptoDinero('');
      setNumeroComprobante('');
      setObservaciones('');
      setFotos([]);
      setFirmaEntrega(undefined);
      setFirmaRecibe(undefined);
    } catch (err: any) {
      alert('Error al procesar: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEntrega = tipoOperacion === 'ENTREGA';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Selector Superior: Entrega vs Recepción */}
      <div className="p-5 sm:p-6 bg-slate-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
            <span>Nuevo Registro</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Diligencia los datos para emitir el acta o compartir para firma por WhatsApp.
          </p>
        </div>

        {/* Conmutador de Operación */}
        <div className="inline-flex p-1 bg-slate-900 rounded-2xl border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setTipoOperacion('ENTREGA')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              isEntrega
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>ENTREGA</span>
          </button>

          <button
            type="button"
            onClick={() => setTipoOperacion('RECEPCION')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              !isEntrega
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>RECEPCIÓN</span>
          </button>
        </div>
      </div>

      {/* Selector de Categoría */}
      <div className="px-6 pt-5 pb-2 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategoria('ORO')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold border transition-all ${
            categoria === 'ORO'
              ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
              : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Oro</span>
        </button>

        <button
          type="button"
          onClick={() => setCategoria('DINERO')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold border transition-all ${
            categoria === 'DINERO'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Dinero</span>
        </button>

        <button
          type="button"
          onClick={() => setCategoria('MATERIAL')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold border transition-all ${
            categoria === 'MATERIAL'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
              : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Materiales</span>
        </button>

        <button
          type="button"
          onClick={() => setCategoria('MIXTO')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold border transition-all ${
            categoria === 'MIXTO'
              ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
              : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Mixto</span>
        </button>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">

        {/* 1. SECCIÓN: ORO (SI APLICA) */}
        {(categoria === 'ORO' || categoria === 'MIXTO') && (
          <section className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200/60 dark:border-amber-900/40">
              <h3 className="text-sm font-black text-amber-900 dark:text-amber-200 flex items-center gap-2 uppercase tracking-wide">
                <Coins className="w-4 h-4 text-amber-600" />
                <span>Detalle de Oro ({isEntrega ? 'Entrega de Oro' : 'Recepción de Oro'})</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              {/* Gramos */}
              <div className="sm:col-span-4">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Peso en Gramos (g)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={oroGramos}
                    onChange={(e) => handleGramosChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-3 pr-8 py-2.5 text-base font-black rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-700">
                    g
                  </span>
                </div>
              </div>

              {/* Valor Liquidación */}
              <div className="sm:col-span-5">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Valor de Liquidación ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={oroLiquidacion}
                    onChange={(e) => handleLiquidacionChange(e.target.value)}
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-2.5 text-base font-black rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Precio por Gramo */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Calculator className="w-3 h-3 text-slate-400" />
                  <span>Precio/g</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={oroPrecioGramo}
                  onChange={(e) => handlePrecioGramoChange(e.target.value)}
                  placeholder="Precio/g"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Presentación / Tipo de Pieza */}
              <div className="sm:col-span-6">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Presentación / Detalle de la Pieza (Opcional)
                </label>
                <input
                  type="text"
                  value={oroTipoPieza}
                  onChange={(e) => setOroTipoPieza(e.target.value)}
                  placeholder="Ej. Lingote, Barra, Chatarra, Joyería..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Moneda */}
              <div className="sm:col-span-6">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Moneda
                </label>
                <select
                  value={oroMoneda}
                  onChange={(e) => setOroMoneda(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {MONEDAS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>
        )}

        {/* 2. SECCIÓN: DINERO (SI APLICA) */}
        {(categoria === 'DINERO' || categoria === 'MIXTO') && (
          <section className="bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60 dark:border-emerald-900/40">
              <h3 className="text-sm font-black text-emerald-900 dark:text-emerald-200 flex items-center gap-2 uppercase tracking-wide">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Detalle de Dinero</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-6">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Monto Total ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={montoDinero}
                    onChange={(e) => setMontoDinero(e.target.value)}
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-2.5 text-base font-black rounded-xl border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Moneda
                </label>
                <select
                  value={monedaDinero}
                  onChange={(e) => setMonedaDinero(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {MONEDAS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Método de Pago
                </label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {METODOS_PAGO.map((mp) => (
                    <option key={mp} value={mp}>
                      {mp}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-8">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Concepto / Motivo
                </label>
                <input
                  type="text"
                  value={conceptoDinero}
                  onChange={(e) => setConceptoDinero(e.target.value)}
                  placeholder="Ej. Anticipo, compra menor, pago..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  No. Comprobante / Ref
                </label>
                <input
                  type="text"
                  value={numeroComprobante}
                  onChange={(e) => setNumeroComprobante(e.target.value)}
                  placeholder="Ej. #9821"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </section>
        )}

        {/* 3. SECCIÓN: MATERIALES (SI APLICA) */}
        {(categoria === 'MATERIAL' || categoria === 'MIXTO') && (
          <section className="space-y-3">
            <MaterialItemsTable items={materiales} onChange={setMateriales} />
          </section>
        )}

        {/* 4. SECCIÓN: PARTICIPANTES (OPCIONALES) */}
        <section className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quien Entrega */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                Persona que Entrega (Opcional)
              </span>

              <input
                type="text"
                value={entregaPor.nombre || ''}
                onChange={(e) => setEntregaPor({ ...entregaPor, nombre: e.target.value })}
                placeholder="Nombre completo"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={entregaPor.documento || ''}
                  onChange={(e) => setEntregaPor({ ...entregaPor, documento: e.target.value })}
                  placeholder="Cédula / ID"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={entregaPor.telefono || ''}
                  onChange={(e) => setEntregaPor({ ...entregaPor, telefono: e.target.value })}
                  placeholder="Teléfono"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Quien Recibe */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[11px] font-black text-teal-700 dark:text-teal-400 uppercase tracking-wider block">
                Persona que Recibe (Opcional)
              </span>

              <input
                type="text"
                value={recibePor.nombre || ''}
                onChange={(e) => setRecibePor({ ...recibePor, nombre: e.target.value })}
                placeholder="Nombre completo"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={recibePor.documento || ''}
                  onChange={(e) => setRecibePor({ ...recibePor, documento: e.target.value })}
                  placeholder="Cédula / ID"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={recibePor.telefono || ''}
                  onChange={(e) => setRecibePor({ ...recibePor, telefono: e.target.value })}
                  placeholder="Teléfono"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 5. SECCIÓN: FOTOGRAFÍA DE EVIDENCIA */}
        <section>
          <CameraCapture photos={fotos} onChange={setFotos} maxPhotos={4} />
        </section>

        {/* 6. SECCIÓN: FIRMAS DIGITALES */}
        <section className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SignaturePad
              roleLabel="Entrega"
              title="Firma Quien Entrega"
              signeeName={entregaPor.nombre}
              value={firmaEntrega}
              onChange={setFirmaEntrega}
            />

            <SignaturePad
              roleLabel="Recepción"
              title="Firma Quien Recibe"
              signeeName={recibePor.nombre}
              value={firmaRecibe}
              onChange={setFirmaRecibe}
            />
          </div>
        </section>

        {/* 7. SECCIÓN: FECHA & SEDE */}
        <section className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
          <div className="sm:col-span-4">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Fecha y Hora
            </label>
            <input
              type="datetime-local"
              value={fechaHora}
              onChange={(e) => setFechaHora(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Sede / Ubicación
            </label>
            <div className="relative">
              <input
                type="text"
                value={ubicacion.sede || ''}
                onChange={(e) => setUbicacion({ ...ubicacion, sede: e.target.value })}
                placeholder="Ej. Sede Central, Almacén..."
                className="w-full pl-3 pr-7 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleGetLocation}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600"
              >
                <Navigation className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="sm:col-span-4">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Observaciones (Opcional)
            </label>
            <input
              type="text"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Notas adicionales..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </section>

        {/* Botones de Acción Dual: Emitir Inmediato o Compartir por WhatsApp */}
        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleShareDraft}
            className="py-3.5 px-4 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-extrabold text-xs sm:text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            <span>Compartir para Firma por WhatsApp</span>
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generando Acta...</span>
              </>
            ) : (
              <>
                <FileCheck2 className="w-5 h-5" />
                <span>Guardar y Emitir Acta Inmediata</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Modal de Compartir por WhatsApp */}
      {borradorToShare && (
        <ShareWhatsAppModal
          borradorData={borradorToShare}
          onClose={() => setBorradorToShare(null)}
        />
      )}

      {/* Modal de Comprobante / Acta */}
      {savedRegistro && (
        <ReceiptModal
          registro={savedRegistro}
          onClose={() => setSavedRegistro(null)}
        />
      )}
    </div>
  );
}
