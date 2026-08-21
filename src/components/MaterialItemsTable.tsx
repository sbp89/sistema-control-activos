'use client';

import React from 'react';
import { Plus, Trash2, Copy, Package, Hash, Sparkles } from 'lucide-react';
import { ItemMaterial, EstadoMaterial } from '@/lib/types';
import { generateId } from '@/lib/utils';

interface MaterialItemsTableProps {
  items: ItemMaterial[];
  onChange: (items: ItemMaterial[]) => void;
}

const ESTADOS: { value: EstadoMaterial; label: string; color: string }[] = [
  { value: 'NUEVO', label: 'Nuevo', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'BUENO', label: 'Buen Estado', color: 'bg-blue-100 text-blue-800' },
  { value: 'USADO', label: 'Usado', color: 'bg-slate-100 text-slate-800' },
  { value: 'REGULAR', label: 'Regular', color: 'bg-amber-100 text-amber-800' },
  { value: 'CON_DETALLES', label: 'Con Detalles', color: 'bg-orange-100 text-orange-800' },
  { value: 'DANADO', label: 'Dañado / Falla', color: 'bg-red-100 text-red-800' },
];

const UNIDADES_COMUNES = [
  'unidades',
  'piezas',
  'cajas',
  'paquetes',
  'juegos / kits',
  'kg',
  'metros',
  'litros',
  'rollos',
  'galones',
];

export default function MaterialItemsTable({
  items,
  onChange,
}: MaterialItemsTableProps) {
  const handleAddItem = () => {
    const newItem: ItemMaterial = {
      id: generateId(),
      descripcion: '',
      cantidad: 1,
      unidad: 'unidades',
      estado: 'BUENO',
      numeroSerie: '',
      codigoInventario: '',
      observaciones: '',
    };
    onChange([...items, newItem]);
  };

  const handleUpdateItem = (id: string, updates: Partial<ItemMaterial>) => {
    onChange(
      items.map((it) => (it.id === id ? { ...it, ...updates } : it))
    );
  };

  const handleDuplicateItem = (item: ItemMaterial) => {
    const duplicate: ItemMaterial = {
      ...item,
      id: generateId(),
      descripcion: item.descripcion ? `${item.descripcion} (Copia)` : '',
      numeroSerie: '',
    };
    onChange([...items, duplicate]);
  };

  const handleRemoveItem = (id: string) => {
    onChange(items.filter((it) => it.id !== id));
  };

  const totalPiezas = items.reduce((acc, it) => acc + (Number(it.cantidad) || 0), 0);

  return (
    <div className="space-y-4">
      {/* Barra de cabecera y totalizador */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-600" />
            <span>Lista de Materiales, Equipos o Bienes</span>
          </label>
          <p className="text-xs text-slate-500">
            Detalla los elementos entregados o recibidos. (Campos opcionales si solo se requiere un resumen rápido).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            Total ítems: {items.length} ({totalPiezas} unidades)
          </span>
        </div>
      </div>

      {/* Si no hay ítems */}
      {items.length === 0 ? (
        <div className="text-center py-8 px-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <Package className="w-10 h-10 mx-auto text-slate-400 mb-2" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            No hay materiales agregados aún
          </p>
          <p className="text-xs text-slate-500 mb-4">
            Haz clic en el botón a continuación para agregar el primer ítem.
          </p>
          <button
            type="button"
            onClick={handleAddItem}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Primer Material</span>
          </button>
        </div>
      ) : (
        /* Lista de ítems interactiva */
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-sm space-y-3 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs">
                    {index + 1}
                  </span>
                  <span>Ítem #{index + 1}</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDuplicateItem(item)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors"
                    title="Duplicar ítem"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-1 text-red-400 hover:text-red-600 rounded transition-colors"
                    title="Eliminar ítem"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Fila 1: Descripción, Cantidad y Unidad */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6">
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Descripción del Material / Herramienta / Equipo
                  </label>
                  <input
                    type="text"
                    value={item.descripcion}
                    onChange={(e) => handleUpdateItem(item.id, { descripcion: e.target.value })}
                    placeholder="Ej. Taladro Bosch GSB 13 RE, Cable eléctrico 12 AWG..."
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    value={item.cantidad}
                    onChange={(e) => handleUpdateItem(item.id, { cantidad: parseFloat(e.target.value) || 1 })}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Unidad
                  </label>
                  <select
                    value={item.unidad}
                    onChange={(e) => handleUpdateItem(item.id, { unidad: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {UNIDADES_COMUNES.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fila 2: Estado, Número de Serie y Código de Inventario */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Estado Físico
                  </label>
                  <select
                    value={item.estado || 'BUENO'}
                    onChange={(e) => handleUpdateItem(item.id, { estado: e.target.value as EstadoMaterial })}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {ESTADOS.map((est) => (
                      <option key={est.value} value={est.value}>
                        {est.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Número de Serie (S/N)
                  </label>
                  <input
                    type="text"
                    value={item.numeroSerie || ''}
                    onChange={(e) => handleUpdateItem(item.id, { numeroSerie: e.target.value })}
                    placeholder="Opcional: S/N 849201"
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Código de Inventario / Placa
                  </label>
                  <input
                    type="text"
                    value={item.codigoInventario || ''}
                    onChange={(e) => handleUpdateItem(item.id, { codigoInventario: e.target.value })}
                    placeholder="Opcional: ACT-0034"
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Botón para añadir más materiales */}
          <button
            type="button"
            onClick={handleAddItem}
            className="w-full py-2.5 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>+ Añadir Otro Material a la Lista</span>
          </button>
        </div>
      )}
    </div>
  );
}
