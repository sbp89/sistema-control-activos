import { Registro, GoogleDriveConfig, ResumenEstadisticas } from './types';

const STORAGE_KEY_REGISTROS = 'sca_registros_v1';
const STORAGE_KEY_DRIVE_CONFIG = 'sca_drive_config_v1';

export const DEFAULT_DRIVE_CONFIG: GoogleDriveConfig = {
  webhookUrl: '',
  folderPath: 'Trabajo/Mono',
  sheetName: 'Control_Activos',
  autoSync: false,
  syncPhotos: true,
  syncPdfs: true,
};

const DEMO_REGISTROS: Registro[] = [
  {
    id: 'demo-oro',
    folio: 'ENT-20260821-3012',
    tipoOperacion: 'ENTREGA',
    categoria: 'ORO',
    fechaHora: new Date(Date.now() - 3600000 * 2).toISOString(),
    ubicacion: {
      sede: 'Sede Principal',
      proyecto: 'Custodia Minera',
    },
    entregaPor: {
      nombre: 'Alejandro Morales',
      documento: 'CC 1098234710',
    },
    recibePor: {
      nombre: 'Javier Restrepo',
      documento: 'CC 71294801',
    },
    oro: {
      gramos: 48.50,
      valorLiquidacion: 16975000,
      precioPorGramo: 350000,
      moneda: 'COP',
      tipoPieza: 'Barra Fundida',
      observaciones: 'Sellada con precinto #ORO-881',
    },
    observacionesGenerales: 'Entrega de material aurífero pesado en balanza calibrada.',
    clausulaAceptada: true,
    sincronizadoDrive: true,
    estado: 'COMPLETADO',
    creadoEn: new Date(Date.now() - 3600000 * 2).toISOString(),
    actualizadoEn: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'demo-1',
    folio: 'ENT-20260821-1042',
    tipoOperacion: 'ENTREGA',
    categoria: 'DINERO',
    fechaHora: new Date(Date.now() - 3600000 * 4).toISOString(),
    ubicacion: {
      sede: 'Oficina Central',
      proyecto: 'Caja Menor Operaciones',
      ciudad: 'Bogotá',
    },
    entregaPor: {
      nombre: 'Carlos Mendoza',
      documento: 'CC 1020492811',
      cargoEmpresa: 'Tesorero Principal',
      telefono: '3104829102',
    },
    recibePor: {
      nombre: 'Andrés Gómez',
      documento: 'CC 79841203',
      cargoEmpresa: 'Supervisor de Obra',
      telefono: '3159048123',
    },
    dinero: {
      monto: 1500000,
      moneda: 'COP',
      metodoPago: 'EFECTIVO',
      concepto: 'Viáticos y compras menores para inicio de jornada',
      numeroComprobante: 'REC-0091',
    },
    observacionesGenerales: 'Recibido en efectivo a conformidad previa verificación de billetes.',
    clausulaAceptada: true,
    sincronizadoDrive: false,
    estado: 'COMPLETADO',
    creadoEn: new Date(Date.now() - 3600000 * 4).toISOString(),
    actualizadoEn: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
];

export function getStoredRegistros(): Registro[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REGISTROS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_REGISTROS, JSON.stringify(DEMO_REGISTROS));
      return DEMO_REGISTROS;
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error al leer registros del localStorage:', error);
    return [];
  }
}

export function getRegistroById(id: string): Registro | undefined {
  const list = getStoredRegistros();
  return list.find((r) => r.id === id);
}

/**
 * Guarda el registro localmente y lo envía al servidor para sincronización multi-dispositivo en tiempo real.
 */
export function saveRegistro(registro: Registro): Registro {
  if (typeof window === 'undefined') return registro;
  try {
    const list = getStoredRegistros();
    const index = list.findIndex((r) => r.id === registro.id);
    let updated: Registro[];

    const finalRecord: Registro = {
      ...registro,
      creadoEn: registro.creadoEn || new Date().toISOString(),
      actualizadoEn: new Date().toISOString(),
    };

    if (index >= 0) {
      updated = [...list];
      updated[index] = finalRecord;
    } else {
      updated = [finalRecord, ...list];
    }

    localStorage.setItem(STORAGE_KEY_REGISTROS, JSON.stringify(updated));

    // Sincronizar en segundo plano con el servidor de la aplicación
    fetch('/api/registros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalRecord),
    }).catch((err) => {
      console.warn('Sincronización en segundo plano con servidor:', err);
    });

    return finalRecord;
  } catch (error) {
    console.error('Error al guardar registro:', error);
    return registro;
  }
}

/**
 * Sincroniza y fusiona los registros locales con el servidor central para ver firmas remotas en tiempo real.
 */
export async function fetchAndSyncRegistros(): Promise<Registro[]> {
  const localList = getStoredRegistros();

  try {
    const res = await fetch('/api/registros', {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
    });

    if (!res.ok) return localList;

    const data = await res.json();
    if (!data || !Array.isArray(data.registros)) return localList;

    const serverList: Registro[] = data.registros;

    // Mapa para fusionar registros dando prioridad a los completados o más recientes
    const mergedMap = new Map<string, Registro>();

    localList.forEach((r) => mergedMap.set(r.id, r));

    serverList.forEach((serverReg) => {
      const localReg = mergedMap.get(serverReg.id);
      if (!localReg) {
        mergedMap.set(serverReg.id, serverReg);
      } else {
        // Si el servidor ya tiene la firma o está COMPLETADO, usar el del servidor
        if (serverReg.estado === 'COMPLETADO' || serverReg.firmaRecibe || serverReg.firmaEntrega) {
          mergedMap.set(serverReg.id, {
            ...localReg,
            ...serverReg,
          });
        } else {
          // Usar el más recientemente actualizado
          const localTime = new Date(localReg.actualizadoEn || 0).getTime();
          const serverTime = new Date(serverReg.actualizadoEn || 0).getTime();
          if (serverTime >= localTime) {
            mergedMap.set(serverReg.id, serverReg);
          }
        }
      }
    });

    const finalMerged = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime()
    );

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_REGISTROS, JSON.stringify(finalMerged));
    }

    return finalMerged;
  } catch (err) {
    console.warn('Error al sincronizar con servidor:', err);
    return localList;
  }
}

export function deleteRegistro(id: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const list = getStoredRegistros();
    const filtered = list.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY_REGISTROS, JSON.stringify(filtered));

    // Eliminar también del servidor
    fetch(`/api/registros?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).catch(() => {});

    return true;
  } catch (error) {
    console.error('Error al eliminar registro:', error);
    return false;
  }
}

export function getGoogleDriveConfig(): GoogleDriveConfig {
  if (typeof window === 'undefined') return DEFAULT_DRIVE_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DRIVE_CONFIG);
    if (!raw) return DEFAULT_DRIVE_CONFIG;
    return { ...DEFAULT_DRIVE_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_DRIVE_CONFIG;
  }
}

export function saveGoogleDriveConfig(config: GoogleDriveConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_DRIVE_CONFIG, JSON.stringify(config));
  } catch (error) {
    console.error('Error al guardar config de Google Drive:', error);
  }
}

export function getEstadisticas(registros?: Registro[]): ResumenEstadisticas {
  const list = registros || getStoredRegistros();

  const entregas = list.filter((r) => r.tipoOperacion === 'ENTREGA');
  const recepciones = list.filter((r) => r.tipoOperacion === 'RECEPCION');

  const totalDineroEntregado: Record<string, number> = {};
  const totalDineroRecibido: Record<string, number> = {};

  let totalMaterialesEntregados = 0;
  let totalMaterialesRecibidos = 0;
  let totalOroGramosEntregados = 0;
  let totalOroGramosRecibidos = 0;

  list.forEach((reg) => {
    if (reg.oro && reg.oro.gramos > 0) {
      if (reg.tipoOperacion === 'ENTREGA') {
        totalOroGramosEntregados += Number(reg.oro.gramos) || 0;
      } else {
        totalOroGramosRecibidos += Number(reg.oro.gramos) || 0;
      }
    }

    if (reg.dinero && reg.dinero.monto > 0) {
      const mon = reg.dinero.moneda || 'COP';
      if (reg.tipoOperacion === 'ENTREGA') {
        totalDineroEntregado[mon] = (totalDineroEntregado[mon] || 0) + reg.dinero.monto;
      } else {
        totalDineroRecibido[mon] = (totalDineroRecibido[mon] || 0) + reg.dinero.monto;
      }
    }

    if (reg.materiales && reg.materiales.length > 0) {
      const count = reg.materiales.reduce((acc, item) => acc + (Number(item.cantidad) || 1), 0);
      if (reg.tipoOperacion === 'ENTREGA') {
        totalMaterialesEntregados += count;
      } else {
        totalMaterialesRecibidos += count;
      }
    }
  });

  return {
    totalRegistros: list.length,
    totalEntregas: entregas.length,
    totalRecepciones: recepciones.length,
    totalDineroEntregado,
    totalDineroRecibido,
    totalOroGramosEntregados,
    totalOroGramosRecibidos,
    totalMaterialesEntregados,
    totalMaterialesRecibidos,
  };
}
