export type TipoOperacion = 'ENTREGA' | 'RECEPCION';

export type CategoriaOperacion = 'DINERO' | 'MATERIAL' | 'MIXTO';

export type MetodoPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'CHEQUE' | 'CONSIGNACION' | 'OTRO';

export type EstadoMaterial = 'NUEVO' | 'BUENO' | 'USADO' | 'REGULAR' | 'CON_DETALLES' | 'DANADO';

export interface ItemMaterial {
  id: string;
  descripcion: string;
  cantidad: number;
  unidad: string; // 'unidad', 'kg', 'metros', 'cajas', 'juegos', 'piezas', 'paquetes'
  estado?: EstadoMaterial;
  numeroSerie?: string;
  codigoInventario?: string;
  observaciones?: string;
}

export interface Denominacion {
  valor: number;
  cantidad: number;
  total: number;
}

export interface DetalleDinero {
  monto: number;
  moneda: string; // 'COP', 'USD', 'EUR', 'MXN', etc.
  metodoPago: MetodoPago | string;
  concepto?: string;
  numeroComprobante?: string; // Número de transferencia, cheque o recibo manual
  denominaciones?: Denominacion[];
}

export interface Participante {
  nombre?: string;
  documento?: string; // Cédula, DNI, Pasaporte, NIT
  cargoEmpresa?: string;
  telefono?: string;
}

export interface EvidenciaFoto {
  id: string;
  base64: string;
  nombre?: string;
  fechaCaptura: string;
  tamanoKb?: number;
}

export interface FirmaDigital {
  base64?: string;
  fechaFirma?: string;
  firmanteNombre?: string;
}

export interface UbicacionData {
  sede?: string;
  proyecto?: string;
  ciudad?: string;
  latitud?: number;
  longitud?: number;
}

export interface Registro {
  id: string;
  folio: string; // Ej: ACT-20260821-4821
  tipoOperacion: TipoOperacion;
  categoria: CategoriaOperacion;
  fechaHora: string; // ISO string
  ubicacion?: UbicacionData;
  
  // Participantes (Opcionales por confidencialidad)
  entregaPor?: Participante;
  recibePor?: Participante;

  // Datos de Dinero (si aplica)
  dinero?: DetalleDinero;

  // Datos de Material (si aplica)
  materiales?: ItemMaterial[];

  // Evidencias fotográficas y firmas
  fotos?: EvidenciaFoto[];
  firmaEntrega?: FirmaDigital;
  firmaRecibe?: FirmaDigital;

  // Observaciones y estado
  observacionesGenerales?: string;
  clausulaAceptada?: boolean;
  sincronizadoDrive?: boolean;
  driveFileUrl?: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface GoogleDriveConfig {
  webhookUrl: string;
  folderPath: string; // Por defecto 'Trabajo/Mono'
  sheetName: string; // Por defecto 'Control_Activos'
  autoSync: boolean;
  syncPhotos: boolean;
  syncPdfs: boolean;
  ultimoSync?: string;
}

export interface FiltrosHistorial {
  busqueda: string;
  tipoOperacion: 'TODOS' | TipoOperacion;
  categoria: 'TODOS' | CategoriaOperacion;
  fechaDesde?: string;
  fechaHasta?: string;
  moneda?: string;
  estadoSync?: 'TODOS' | 'SINCRONIZADO' | 'PENDIENTE';
}

export interface ResumenEstadisticas {
  totalRegistros: number;
  totalEntregas: number;
  totalRecepciones: number;
  totalDineroEntregado: Record<string, number>;
  totalDineroRecibido: Record<string, number>;
  totalMaterialesEntregados: number;
  totalMaterialesRecibidos: number;
}
