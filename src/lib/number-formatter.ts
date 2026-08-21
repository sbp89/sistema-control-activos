/**
 * Utilidades de puntuación y formateo numérico automático en tiempo real.
 * Soporta separadores de miles con puntos y decimales con coma o punto para Oro y Dinero.
 */

/**
 * Convierte cualquier texto formateado (ej. "1.500.000", "48,50", "$ 16.975.000,75") en un número float puro de JavaScript.
 */
export function parseFormattedNumber(input: string | number | undefined | null): number {
  if (input === undefined || input === null || input === '') return 0;
  if (typeof input === 'number') return isNaN(input) ? 0 : input;

  // Limpiar caracteres no numéricos excepto puntos, comas y signos
  let clean = input.toString().replace(/[^\d.,-]/g, '').trim();
  if (!clean) return 0;

  // Si tiene tanto punto como coma, ej: "1.250,50" -> punto es miles, coma es decimal
  if (clean.includes('.') && clean.includes(',')) {
    // Si el último separador es coma: "1.500,50"
    if (clean.lastIndexOf(',') > clean.lastIndexOf('.')) {
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
      // Si el último es punto: "1,500.50"
      clean = clean.replace(/,/g, '');
    }
  } else if (clean.includes(',')) {
    // Solo tiene coma: "48,50" -> tratar como decimal
    clean = clean.replace(',', '.');
  } else if (clean.includes('.')) {
    // Solo tiene puntos: determinar si es decimal (ej. "48.50") o miles (ej. "1.500.000")
    const parts = clean.split('.');
    if (parts.length > 2) {
      // Múltiples puntos: son miles "1.500.000"
      clean = clean.replace(/\./g, '');
    } else if (parts.length === 2 && parts[1].length === 3 && parseInt(parts[0], 10) >= 1) {
      // Ejemplo "1.000" o "500.000" -> podría ser miles si no hay más info, pero en oro 1.250g es 1.25g o 1250g.
      // Si el usuario escribe para dinero, tratamos como miles si no se indica coma.
    }
  }

  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formatea un número entero de dinero con puntos de miles mientras el usuario escribe (ej. "16975000" -> "16.975.000")
 */
export function formatMoneyInput(rawInput: string): string {
  if (!rawInput) return '';

  // Permitir solo dígitos y una coma/punto para decimales
  const clean = rawInput.replace(/[^\d.,]/g, '');
  if (!clean) return '';

  // Separar parte entera y decimal
  const separatorIndex = Math.max(clean.lastIndexOf('.'), clean.lastIndexOf(','));
  const hasDecimal = separatorIndex !== -1 && separatorIndex >= clean.length - 3;

  let integerPart = clean;
  let decimalPart = '';

  if (hasDecimal) {
    integerPart = clean.slice(0, separatorIndex).replace(/[^\d]/g, '');
    decimalPart = clean.slice(separatorIndex + 1).replace(/[^\d]/g, '').slice(0, 2);
  } else {
    integerPart = clean.replace(/[^\d]/g, '');
  }

  if (!integerPart && !decimalPart) return '';

  // Formatear parte entera con puntos de miles
  const formattedInteger = integerPart ? parseInt(integerPart, 10).toLocaleString('es-CO') : '0';

  if (hasDecimal) {
    const sep = clean[separatorIndex] === ',' ? ',' : ',';
    return `${formattedInteger}${sep}${decimalPart}`;
  }

  return formattedInteger;
}

/**
 * Formateador de Gramos de Oro con soporte estricto y fluido para decimales (ej. "48.50", "0.75", "125.45")
 */
export function formatGramsInput(rawInput: string): string {
  if (!rawInput) return '';

  // Permitir dígitos y coma o punto decimal
  let clean = rawInput.replace(/[^\d.,]/g, '');
  if (!clean) return '';

  // Unificar primer separador decimal
  const firstComma = clean.indexOf(',');
  const firstDot = clean.indexOf('.');
  
  let splitIndex = -1;
  if (firstComma !== -1 && firstDot !== -1) {
    splitIndex = Math.min(firstComma, firstDot);
  } else if (firstComma !== -1) {
    splitIndex = firstComma;
  } else if (firstDot !== -1) {
    splitIndex = firstDot;
  }

  if (splitIndex !== -1) {
    const integerPart = clean.slice(0, splitIndex).replace(/[^\d]/g, '');
    // Máximo 3 decimales para pesaje de oro de alta precisión
    const decimalPart = clean.slice(splitIndex + 1).replace(/[^\d]/g, '').slice(0, 3);
    const sep = clean[splitIndex] === '.' ? '.' : ',';

    const formattedInt = integerPart ? parseInt(integerPart, 10).toLocaleString('es-CO') : '0';
    return `${formattedInt}${sep}${decimalPart}`;
  }

  // Si es número entero puro
  const numOnly = clean.replace(/[^\d]/g, '');
  if (!numOnly) return '';
  return parseInt(numOnly, 10).toLocaleString('es-CO');
}

/**
 * Extrae el valor numérico exacto de un input de gramos para guardarlo en base de datos.
 */
export function parseGramsValue(input: string): number {
  if (!input) return 0;
  // Reemplazar puntos de miles si existen y comas por puntos
  const clean = input.replace(/\./g, '').replace(',', '.');
  const val = parseFloat(clean);
  return isNaN(val) ? 0 : val;
}
