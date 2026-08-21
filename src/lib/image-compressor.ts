/**
 * Utilidad de compresión de imágenes en el cliente (Navegador).
 * Optimiza drásticamente el espacio de almacenamiento en Google Drive (carpeta Trabajo/Mono).
 * Reduce fotografías de 5-12 MB a ~80-180 KB manteniendo una excelente legibilidad visual.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 a 1.0 (0.75 recomendado)
  mimeType?: 'image/jpeg' | 'image/webp' | 'image/png';
}

export interface CompressionResult {
  base64: string;
  sizeKb: number;
  originalSizeKb: number;
  reductionPercentage: number;
  width: number;
  height: number;
}

export async function compressImage(
  input: File | Blob | string,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.75,
    mimeType = 'image/jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    // Si estamos en entorno servidor, devolver fallback
    if (typeof window === 'undefined') {
      const b64 = typeof input === 'string' ? input : '';
      resolve({
        base64: b64,
        sizeKb: Math.round((b64.length * 0.75) / 1024),
        originalSizeKb: Math.round((b64.length * 0.75) / 1024),
        reductionPercentage: 0,
        width: 0,
        height: 0,
      });
      return;
    }

    const img = new Image();
    let originalSizeKb = 0;

    const processLoadedImage = () => {
      let { width, height } = img;

      // Calcular nuevas dimensiones manteniendo relación de aspecto
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      // Crear canvas y dibujar imagen escalada
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo inicializar el contexto de canvas 2D'));
        return;
      }

      // Fondo blanco para evitar transparencias oscuras en JPEGs
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      // Suavizado de imagen para máxima fidelidad
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Exportar en base64 con compresión
      const compressedBase64 = canvas.toDataURL(mimeType, quality);
      const compressedSizeKb = Math.round((compressedBase64.length * (3 / 4)) / 1024);

      if (originalSizeKb === 0) {
        originalSizeKb = compressedSizeKb;
      }

      const reduction = originalSizeKb > 0
        ? Math.max(0, Math.round(((originalSizeKb - compressedSizeKb) / originalSizeKb) * 100))
        : 0;

      resolve({
        base64: compressedBase64,
        sizeKb: compressedSizeKb,
        originalSizeKb: originalSizeKb,
        reductionPercentage: reduction,
        width,
        height,
      });
    };

    img.onload = processLoadedImage;
    img.onerror = (err) => reject(new Error('Error al cargar la imagen para compresión: ' + err));

    if (typeof input === 'string') {
      originalSizeKb = Math.round((input.length * (3 / 4)) / 1024);
      img.src = input;
    } else {
      originalSizeKb = Math.round(input.size / 1024);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          reject(new Error('No se pudo leer el archivo de imagen'));
        }
      };
      reader.onerror = () => reject(new Error('Error en FileReader'));
      reader.readAsDataURL(input);
    }
  });
}
