import { BorradorRemoto, Registro } from './types';
import { generateId } from './utils';

const COMPLETED_TOKENS_KEY = 'sca_completed_drafts_v1';

export function createDraftToken(borrador: Partial<BorradorRemoto>): string {
  const fullDraft: BorradorRemoto = {
    id: borrador.id || generateId(),
    folio: borrador.folio || '',
    tipoOperacion: borrador.tipoOperacion || 'RECEPCION',
    categoria: borrador.categoria || 'ORO',
    fechaHora: borrador.fechaHora || new Date().toISOString(),
    ubicacion: borrador.ubicacion,
    entregaPor: borrador.entregaPor,
    recibePor: borrador.recibePor,
    oro: borrador.oro,
    dinero: borrador.dinero,
    materiales: borrador.materiales,
    firmaEmisor: borrador.firmaEmisor,
    fotosEmisor: borrador.fotosEmisor,
    parteAFirmar: borrador.parteAFirmar || (borrador.tipoOperacion === 'ENTREGA' ? 'RECEPCION' : 'ENTREGA'),
    creadoEn: new Date().toISOString(),
    completado: false,
  };

  try {
    const jsonStr = JSON.stringify(fullDraft);
    // Base64 seguro para URL en navegador
    if (typeof window !== 'undefined') {
      return btoa(unescape(encodeURIComponent(jsonStr)));
    }
    return Buffer.from(jsonStr, 'utf-8').toString('base64');
  } catch (err) {
    console.error('Error creando token de borrador:', err);
    return '';
  }
}

export function decodeDraftToken(token: string): BorradorRemoto | null {
  try {
    let jsonStr = '';
    if (typeof window !== 'undefined') {
      jsonStr = decodeURIComponent(escape(atob(token)));
    } else {
      jsonStr = Buffer.from(token, 'base64').toString('utf-8');
    }
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error('Error decodificando token:', err);
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

export function markDraftCompleted(draftId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(COMPLETED_TOKENS_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(draftId)) {
      list.push(draftId);
      localStorage.setItem(COMPLETED_TOKENS_KEY, JSON.stringify(list));
    }
  } catch (err) {
    console.error('Error marcando borrador completado:', err);
  }
}
