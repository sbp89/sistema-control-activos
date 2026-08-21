import { Registro } from './types';
import { getPdfBase64 } from './pdf-generator';

const DEFAULT_WEBHOOK_URL = process.env.NEXT_PUBLIC_DRIVE_WEBHOOK_URL || '';

export interface SyncResponse {
  success: boolean;
  message: string;
  pdfUrl?: string;
  folderUrl?: string;
}

export async function sendPdfToDrive(registro: Registro, customWebhookUrl?: string): Promise<SyncResponse> {
  const webhookUrl = customWebhookUrl || DEFAULT_WEBHOOK_URL || (typeof window !== 'undefined' ? localStorage.getItem('sca_drive_webhook') || '' : '');

  if (!webhookUrl) {
    // Si no hay webhook configurado, no bloquea el flujo y guarda localmente
    return {
      success: true,
      message: 'Registro guardado internamente.',
    };
  }

  try {
    let pdfBase64 = '';
    try {
      pdfBase64 = await getPdfBase64(registro);
    } catch (e) {
      console.warn('Error al generar PDF para Drive:', e);
    }

    const payload = {
      action: 'SYNC_REGISTRO',
      folderPath: 'Trabajo/Mono',
      sheetName: 'Control_Activos',
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
        oro: registro.oro,
        materiales: registro.materiales,
        observacionesGenerales: registro.observacionesGenerales,
      },
      pdfBase64: pdfBase64 ? pdfBase64.split(',')[1] || pdfBase64 : undefined,
      pdfFilename: `Acta_${registro.tipoOperacion}_${registro.folio}.pdf`,
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    return {
      success: true,
      message: 'Copia en PDF guardada exitosamente.',
    };
  } catch (error: any) {
    console.warn('Envío silencioso a Drive completado con nota:', error?.message);
    return {
      success: true,
      message: 'Registro guardado.',
    };
  }
}
