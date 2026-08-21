export type TipoOperacion = 'ENTREGA' | 'RECEPCION';

export type CategoriaOperacion = 'DINERO' | 'ORO' | 'MATERIAL' | 'MIXTO';

export type MetodoPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'CHEQUE' | 'CONSIGNACION' | 'OTRO';

export type EstadoMaterial = 'NUEVO' | 'BUENO' | 'USADO' | 'REGULAR' | 'CON_DETALLES' | 'DANADO';

export interface DetalleOro {
  gramos: number;
  valorLiquidacion: number;
  precioPorGramo?: number;
  moneda?: string; // 'COP', 'USD', etc.
  tipoPieza?: string; // 'Lingote', 'Barra', 'Chatarra', 'Joyas', 'Lámina', etc.
  observaciones?: string;
}

export interface ItemMaterial {
  id: string;
  descripcion: string;
  cantidad: number;
  unidad: string;
  estado?: EstadoMaterial;
  numeroSerie?: string;
  codigoInventario?: string;
  observaciones?: string;
}

export interface DetalleDinero {
  monto: number;
  moneda: string;
  metodoPago: MetodoPago | string;
  concepto?: string;
  numeroComprobante?: string;
}

export interface Participante {
  nombre?: string;
  documento?: string;
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
  folio: string;
  tipoOperacion: TipoOperacion;
  categoria: CategoriaOperacion;
  fechaHora: string;
  ubicacion?: UbicacionData;
  
  entregaPor?: Participante;
  recibePor?: Participante;

  dinero?: DetalleDinero;
  oro?: DetalleOro;
  materiales?: ItemMaterial[];

  fotos?: EvidenciaFoto[];
  firmaEntrega?: FirmaDigital;
  firmaRecibe?: FirmaDigital;

  observacionesGenerales?: string;
  clausulaAceptada?: boolean;
  sincronizadoDrive?: boolean;
  completadoRemoto?: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export interface GoogleDriveConfig {
  webhookUrl: string;
  folderPath: string;
  sheetName: string;
  autoSync: boolean;
  syncPhotos: boolean;
  syncPdfs: boolean;
}

export interface ResumenEstadisticas {
  totalRegistros: number;
  totalEntregas: number;
  totalRecepciones: number;
  totalDineroEntregado: Record<string, number>;
  totalDineroRecibido: Record<string, number>;
  totalOroGramosEntregados: number;
  totalOroGramosRecibidos: number;
  totalMaterialesEntregados: number;
  totalMaterialesRecibidos: number;
}

export interface BorradorRemoto {
  id: string;
  folio: string;
  tipoOperacion: TipoOperacion;
  categoria: CategoriaOperacion;
  fechaHora: string;
  ubicacion?: UbicacionData;
  entregaPor?: Participante;
  recibePor?: Participante;
  dinero?: DetalleDinero;
  oro?: DetalleOro;
  materiales?: ItemMaterial[];
  firmaEmisor?: FirmaDigital;
  fotosEmisor?: EvidenciaFoto[];
  parteAFirmar: 'ENTREGA' | 'RECEPCION';
  creadoEn: string;
  expiraEn?: string;
  completado: boolean;
}
