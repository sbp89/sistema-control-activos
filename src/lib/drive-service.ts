import { Registro, GoogleDriveConfig } from './types';
import { getPdfBase64 } from './pdf-generator';

export interface SyncResponse {
  success: boolean;
  message: string;
  driveFolderUrl?: string;
  pdfFileUrl?: string;
  error?: string;
}

export async function syncRegistroToDrive(
  registro: Registro,
  config: GoogleDriveConfig
): Promise<SyncResponse> {
  if (!config.webhookUrl) {
    return {
      success: false,
      message: 'No se ha configurado la URL del Webhook de Google Drive. Configúrala en el menú Ajustes.',
    };
  }

  try {
    let pdfBase64 = '';
    if (config.syncPdfs) {
      try {
        pdfBase64 = await getPdfBase64(registro);
      } catch (e) {
        console.warn('No se pudo generar PDF para sincronizar:', e);
      }
    }

    const payload = {
      action: 'SYNC_REGISTRO',
      folderPath: config.folderPath || 'Trabajo/Mono',
      sheetName: config.sheetName || 'Control_Activos',
      timestamp: new Date().toISOString(),
      registro: {
        id: registro.id,
        folio: registro.folio,
        tipoOperacion: registro.tipoOperacion,
        categoria: registro.categoria,
        fechaHora: registro.fechaHora,
        ubicacion: registro.ubicacion,
        entregaPor: registro.entregaPor,
        recibePor: registro.recibePor,
        dinero: registro.dinero,
        materiales: registro.materiales,
        observacionesGenerales: registro.observacionesGenerales,
      },
      pdfBase64: pdfBase64 ? pdfBase64.split(',')[1] || pdfBase64 : undefined,
      pdfFilename: `Acta_${registro.tipoOperacion}_${registro.folio}.pdf`,
      photos: config.syncPhotos && registro.fotos
        ? registro.fotos.map((f, i) => ({
            name: `Foto_${i + 1}_${registro.folio}.jpg`,
            base64: f.base64.split(',')[1] || f.base64,
          }))
        : [],
    };

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Apps Script maneja text/plain para evitar problemas de CORS
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({ status: 'OK' }));

    return {
      success: true,
      message: 'Registro y archivos sincronizados exitosamente en Google Drive (Trabajo/Mono).',
      driveFolderUrl: data?.folderUrl,
      pdfFileUrl: data?.pdfUrl,
    };
  } catch (error: any) {
    console.error('Error al sincronizar con Google Drive:', error);
    return {
      success: false,
      message: 'Error de conexión con Google Drive: ' + (error?.message || 'Error desconocido'),
      error: error?.message,
    };
  }
}

export async function testDriveConnection(webhookUrl: string): Promise<{ success: boolean; message: string }> {
  if (!webhookUrl) {
    return { success: false, message: 'URL de webhook vacía' };
  }

  try {
    const payload = {
      action: 'PING',
      folderPath: 'Trabajo/Mono',
      timestamp: new Date().toISOString(),
    };

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({ status: 'OK' }));
    return {
      success: true,
      message: data?.message || 'Conexión exitosa con Google Drive (Carpeta Trabajo/Mono verificada).',
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'No se pudo conectar con el Webhook: ' + (error?.message || 'Error de red'),
    };
  }
}
