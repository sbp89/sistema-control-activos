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
      leyPureza: '18K (Ley 750)',
      tipoPieza: 'Barra Fundida',
      observaciones: 'Sellada con precinto #ORO-881',
    },
    observacionesGenerales: 'Entrega de material aurífero pesado en balanza calibrada.',
    clausulaAceptada: true,
    sincronizadoDrive: true,
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
    creadoEn: new Date(Date.now() - 3600000 * 4).toISOString(),
    actualizadoEn: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'demo-2',
    folio: 'REC-20260821-2093',
    tipoOperacion: 'RECEPCION',
    categoria: 'MATERIAL',
    fechaHora: new Date(Date.now() - 3600000 * 1).toISOString(),
    ubicacion: {
      sede: 'Almacén Central',
      proyecto: 'Mantenimiento General',
    },
    entregaPor: {
      nombre: 'Proveedor Ferretería Industrial',
      cargoEmpresa: 'Logística',
    },
    recibePor: {
      nombre: 'Mauricio Silva',
      documento: 'CC 1019283746',
      cargoEmpresa: 'Jefe de Almacén',
    },
    materiales: [
      {
        id: 'mat-1',
        descripcion: 'Taladro Percutor Industrial 850W DeWalt',
        cantidad: 2,
        unidad: 'unidades',
        estado: 'NUEVO',
        numeroSerie: 'DW-85921-2026',
        codigoInventario: 'HERR-0042',
      },
      {
        id: 'mat-2',
        descripcion: 'Extensión eléctrica uso rudo 30 metros',
        cantidad: 4,
        unidad: 'unidades',
        estado: 'NUEVO',
        codigoInventario: 'ELEC-0108',
      },
      {
        id: 'mat-3',
        descripcion: 'Juego de llaves combinadas 8-24mm',
        cantidad: 1,
        unidad: 'juegos',
        estado: 'BUENO',
        codigoInventario: 'HERR-0071',
      },
    ],
    observacionesGenerales: 'Materiales recibidos completos en cajas selladas.',
    clausulaAceptada: true,
    sincronizadoDrive: false,
    creadoEn: new Date(Date.now() - 3600000 * 1).toISOString(),
    actualizadoEn: new Date(Date.now() - 3600000 * 1).toISOString(),
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

export function saveRegistro(registro: Registro): Registro {
  if (typeof window === 'undefined') return registro;
  try {
    const list = getStoredRegistros();
    const index = list.findIndex((r) => r.id === registro.id);
    let updated: Registro[];

    if (index >= 0) {
      updated = [...list];
      updated[index] = { ...registro, actualizadoEn: new Date().toISOString() };
    } else {
      updated = [
        {
          ...registro,
          creadoEn: registro.creadoEn || new Date().toISOString(),
          actualizadoEn: new Date().toISOString(),
        },
        ...list,
      ];
    }

    localStorage.setItem(STORAGE_KEY_REGISTROS, JSON.stringify(updated));
    return updated[index >= 0 ? index : 0];
  } catch (error) {
    console.error('Error al guardar registro:', error);
    return registro;
  }
}

export function deleteRegistro(id: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const list = getStoredRegistros();
    const filtered = list.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY_REGISTROS, JSON.stringify(filtered));
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

export function exportAllDataAsJson(): string {
  const registros = getStoredRegistros();
  const config = getGoogleDriveConfig();
  return JSON.stringify({ version: '1.0', exportDate: new Date().toISOString(), config, registros }, null, 2);
}

export function importDataFromJson(jsonStr: string): { success: boolean; count: number; error?: string } {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || !Array.isArray(parsed.registros)) {
      return { success: false, count: 0, error: 'Formato JSON inválido: debe contener un array "registros".' };
    }
    const current = getStoredRegistros();
    const mergedMap = new Map<string, Registro>();
    current.forEach((r) => mergedMap.set(r.id, r));
    parsed.registros.forEach((r: Registro) => mergedMap.set(r.id, r));
    const merged = Array.from(mergedMap.values());
    localStorage.setItem(STORAGE_KEY_REGISTROS, JSON.stringify(merged));
    return { success: true, count: parsed.registros.length };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'Error al procesar JSON' };
  }
}
