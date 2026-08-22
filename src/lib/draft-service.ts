import { BorradorRemoto } from './types';
import { generateId } from './utils';

const COMPLETED_TOKENS_KEY = 'sca_completed_drafts_v1';
const LOCAL_DRAFTS_KEY = 'sca_local_drafts_v1';

/**
 * Guarda el borrador en la API y en localStorage para acceso multi-dispositivo con URL corta.
 */
export async function saveDraftToServer(borrador: BorradorRemoto): Promise<boolean> {
  // Guardar en localStorage del emisor
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_DRAFTS_KEY);
      const list: BorradorRemoto[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((d) => d.id === borrador.id || d.folio === borrador.folio);
      if (idx >= 0) {
        list[idx] = borrador;
      } else {
        list.push(borrador);
      }
      localStorage.setItem(LOCAL_DRAFTS_KEY, JSON.stringify(list));
    } catch {}
  }

  // Guardar en API serverless
  try {
    const res = await fetch('/api/borradores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(borrador),
    });
    return res.ok;
  } catch (err) {
    console.warn('Advertencia al guardar borrador en API:', err);
    return false;
  }
}

/**
 * Genera un token compacto y seguro para incluir en la URL.
 * Solo empaqueta datos esenciales (sin imágenes base64 pesadas) para que la URL sea ultra-corta y nunca se rompa en WhatsApp.
 */
export function createCompactDraftToken(borrador: Partial<BorradorRemoto>): string {
  const minimalData = {
    id: borrador.id || generateId(),
    f: borrador.folio || '',
    to: borrador.tipoOperacion || 'RECEPCION',
    c: borrador.categoria || 'ORO',
    fh: borrador.fechaHora || new Date().toISOString(),
    e: borrador.entregaPor?.nombre || '',
    ed: borrador.entregaPor?.documento || '',
    r: borrador.recibePor?.nombre || '',
    rd: borrador.recibePor?.documento || '',
    og: borrador.oro?.gramos || 0,
    ol: borrador.oro?.valorLiquidacion || 0,
    om: borrador.oro?.moneda || 'COP',
    op: borrador.oro?.tipoPieza || '',
    dm: borrador.dinero?.monto || 0,
    dmon: borrador.dinero?.moneda || 'COP',
    dp: borrador.dinero?.metodoPago || '',
    dc: borrador.dinero?.concepto || '',
    m: borrador.materiales?.map((mat) => ({
      d: mat.descripcion,
      c: mat.cantidad,
      u: mat.unidad,
    })) || [],
    pf: borrador.parteAFirmar || 'RECEPCION',
  };

  try {
    const jsonStr = JSON.stringify(minimalData);
    if (typeof window !== 'undefined') {
      return btoa(unescape(encodeURIComponent(jsonStr)));
    }
    return Buffer.from(jsonStr, 'utf-8').toString('base64');
  } catch {
    return '';
  }
}

/**
 * Decodifica un token compacto a BorradorRemoto.
 */
export function decodeCompactDraftToken(token: string): BorradorRemoto | null {
  try {
    let jsonStr = '';
    if (typeof window !== 'undefined') {
      jsonStr = decodeURIComponent(escape(atob(token)));
    } else {
      jsonStr = Buffer.from(token, 'base64').toString('utf-8');
    }
    const raw = JSON.parse(jsonStr);

    const borrador: BorradorRemoto = {
      id: raw.id,
      folio: raw.f || '',
      tipoOperacion: raw.to || 'RECEPCION',
      categoria: raw.c || 'ORO',
      fechaHora: raw.fh || new Date().toISOString(),
      entregaPor: raw.e || raw.ed ? { nombre: raw.e, documento: raw.ed } : undefined,
      recibePor: raw.r || raw.rd ? { nombre: raw.r, documento: raw.rd } : undefined,
      oro: (raw.og > 0 || raw.ol > 0) ? {
        gramos: raw.og,
        valorLiquidacion: raw.ol,
        moneda: raw.om || 'COP',
        tipoPieza: raw.op || undefined,
      } : undefined,
      dinero: raw.dm > 0 ? {
        monto: raw.dm,
        moneda: raw.dmon || 'COP',
        metodoPago: raw.dp || 'EFECTIVO',
        concepto: raw.dc || undefined,
      } : undefined,
      materiales: raw.m && raw.m.length > 0 ? raw.m.map((it: any, idx: number) => ({
        id: `mat-${idx}`,
        descripcion: it.d,
        cantidad: it.c,
        unidad: it.u,
      })) : undefined,
      parteAFirmar: raw.pf || 'RECEPCION',
      creadoEn: raw.fh || new Date().toISOString(),
      completado: false,
    };

    return borrador;
  } catch {
    return null;
  }
}

export function isDraftCompleted(draftId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(COMPLETED_TOKENS_KEY);
    if (!raw) return false;
    const completedList: string[] = JSON.parse(raw);
    return completedList.includes(draftId);
  } catch {
    return false;
  }
}

export function markDraftCompleted(draftId: string, folio?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(COMPLETED_TOKENS_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(draftId)) list.push(draftId);
    if (folio && !list.includes(folio)) list.push(folio);
    localStorage.setItem(COMPLETED_TOKENS_KEY, JSON.stringify(list));

    // Notificar a la API
    fetch('/api/borradores', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: draftId, folio }),
    }).catch(() => {});
  } catch (err) {
    console.error('Error marcando borrador completado:', err);
  }
}
