import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { TipoOperacion } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return 'id-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
}

export function generateFolio(tipo: TipoOperacion): string {
  const prefix = tipo === 'ENTREGA' ? 'ENT' : 'REC';
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}${month}${day}-${randomSuffix}`;
}

export function formatMoney(amount: number | undefined | null, currency: string = 'COP'): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '$ 0';
  
  try {
    const formatted = new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
    return `${currency} $${formatted}`;
  } catch {
    return `${currency} $${amount}`;
  }
}

export function formatDate(dateString: string | undefined | null, includeTime: boolean = true): string {
  if (!dateString) return 'Sin fecha';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...(includeTime && {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    };

    return new Intl.DateTimeFormat('es-ES', options).format(date);
  } catch {
    return dateString;
  }
}

export function formatFileSize(kb: number | undefined): string {
  if (!kb || kb <= 0) return '0 KB';
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

export function numeroALetras(monto: number, moneda: string = 'PESOS'): string {
  if (!monto || monto === 0) return 'CERO ' + moneda;
  // Simple human readable formatter helper
  return `${monto.toLocaleString('es-CO')} ${moneda.toUpperCase()}`;
}
