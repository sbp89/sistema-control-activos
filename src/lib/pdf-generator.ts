import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { Registro } from './types';
import { formatDate, formatMoney } from './utils';

export async function generateActaPdf(registro: Registro): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = margin;

  // Paleta de colores profesionales
  const primaryColor = registro.tipoOperacion === 'ENTREGA' ? [22, 101, 52] : [15, 118, 110]; // Verde bosque o Teal
  const darkGray = [30, 41, 59];
  const lightGray = [241, 245, 249];
  const borderGray = [203, 213, 225];

  // Helper para dibujar encabezado de sección
  const drawSectionHeader = (title: string, yPos: number): number => {
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 7, 1.5, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(title.toUpperCase(), margin + 3, yPos + 5);
    return yPos + 10;
  };

  // --- ENCABEZADO SUPERIOR ---
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(margin, currentY, pageWidth - margin * 2, 18, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('ACTA OFICIAL DE ' + (registro.tipoOperacion === 'ENTREGA' ? 'ENTREGA' : 'RECEPCIÓN'), margin + 5, currentY + 8);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema de Control y Custodia de Activos y Valores', margin + 5, currentY + 14);

  // Folio en caja blanca en el encabezado
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pageWidth - margin - 52, currentY + 3, 48, 12, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text('FOLIO NÚMERO:', pageWidth - margin - 50, currentY + 7);
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(registro.folio, pageWidth - margin - 50, currentY + 12);

  currentY += 22;

  // --- DATOS BÁSICOS DE FECHA Y UBICACIÓN ---
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 14, 1, 1, 'D');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('FECHA Y HORA:', margin + 3, currentY + 5);
  doc.text('SEDE / UBICACIÓN:', margin + 65, currentY + 5);
  doc.text('PROYECTO / CONCEPTO:', margin + 125, currentY + 5);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text(formatDate(registro.fechaHora, true), margin + 3, currentY + 10);
  doc.text(registro.ubicacion?.sede || 'No especificada', margin + 65, currentY + 10);
  doc.text(registro.ubicacion?.proyecto || 'General / Estándar', margin + 125, currentY + 10);

  currentY += 18;

  // --- SECCIÓN PARTICIPANTES (ENTREGA Y RECIBE) ---
  currentY = drawSectionHeader('1. Intervinientes en la Transacción', currentY);

  const colWidth = (pageWidth - margin * 2 - 4) / 2;

  // Caja Quien Entrega
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(margin, currentY, colWidth, 24, 1, 1, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('ENTREGADO POR:', margin + 3, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text(`Nombre: ${registro.entregaPor?.nombre || '(Omitido por confidencialidad)'}`, margin + 3, currentY + 10);
  doc.text(`Documento / ID: ${registro.entregaPor?.documento || 'No registrado'}`, margin + 3, currentY + 14);
  doc.text(`Cargo / Entidad: ${registro.entregaPor?.cargoEmpresa || 'No registrado'}`, margin + 3, currentY + 18);
  doc.text(`Teléfono: ${registro.entregaPor?.telefono || 'No registrado'}`, margin + 3, currentY + 22);

  // Caja Quien Recibe
  doc.roundedRect(margin + colWidth + 4, currentY, colWidth, 24, 1, 1, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('RECIBIDO POR:', margin + colWidth + 7, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text(`Nombre: ${registro.recibePor?.nombre || '(Omitido por confidencialidad)'}`, margin + colWidth + 7, currentY + 10);
  doc.text(`Documento / ID: ${registro.recibePor?.documento || 'No registrado'}`, margin + colWidth + 7, currentY + 14);
  doc.text(`Cargo / Entidad: ${registro.recibePor?.cargoEmpresa || 'No registrado'}`, margin + colWidth + 7, currentY + 18);
  doc.text(`Teléfono: ${registro.recibePor?.telefono || 'No registrado'}`, margin + colWidth + 7, currentY + 22);

  currentY += 28;

  // --- SECCIÓN DINERO (SI APLICA) ---
  if (registro.dinero && registro.dinero.monto > 0) {
    currentY = drawSectionHeader('2. Detalle de Valores y Dinero', currentY);

    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 22, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('MONTO TOTAL:', margin + 3, currentY + 6);
    doc.text('MÉTODO DE PAGO:', margin + 70, currentY + 6);
    doc.text('COMPROBANTE / REF:', margin + 130, currentY + 6);

    doc.setFontSize(13);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(formatMoney(registro.dinero.monto, registro.dinero.moneda), margin + 3, currentY + 13);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text(registro.dinero.metodoPago || 'EFECTIVO', margin + 70, currentY + 13);
    doc.text(registro.dinero.numeroComprobante || 'N/A', margin + 130, currentY + 13);

    if (registro.dinero.concepto) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(71, 85, 105);
      doc.text(`Concepto: ${registro.dinero.concepto}`, margin + 3, currentY + 19);
    }

    currentY += 26;
  }

  // --- SECCIÓN MATERIALES (SI APLICA) ---
  if (registro.materiales && registro.materiales.length > 0) {
    currentY = drawSectionHeader('3. Detalle de Materiales y Bienes', currentY);

    // Cabecera de la tabla
    const tableHeaderY = currentY;
    doc.setFillColor(235, 240, 245);
    doc.rect(margin, tableHeaderY, pageWidth - margin * 2, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

    doc.text('#', margin + 2, tableHeaderY + 4.2);
    doc.text('DESCRIPCIÓN DEL BIEN / MATERIAL', margin + 10, tableHeaderY + 4.2);
    doc.text('CANTIDAD', margin + 95, tableHeaderY + 4.2);
    doc.text('UNIDAD', margin + 115, tableHeaderY + 4.2);
    doc.text('ESTADO', margin + 135, tableHeaderY + 4.2);
    doc.text('SERIE / CÓDIGO', margin + 155, tableHeaderY + 4.2);

    currentY += 6;

    // Filas de ítems
    registro.materiales.forEach((item, idx) => {
      // Si estamos cerca del final de página, saltar
      if (currentY > pageHeight - 55) {
        doc.addPage();
        currentY = margin;
        currentY = drawSectionHeader('3. Detalle de Materiales (Continuación)', currentY);
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

      const rowY = currentY + 4;
      doc.text(String(idx + 1), margin + 2, rowY);
      
      // Cortar descripción si es muy larga
      const desc = item.descripcion.length > 50 ? item.descripcion.substring(0, 48) + '...' : item.descripcion;
      doc.text(desc, margin + 10, rowY);
      doc.text(String(item.cantidad), margin + 95, rowY);
      doc.text(item.unidad || 'und', margin + 115, rowY);
      doc.text(item.estado || 'BUENO', margin + 135, rowY);
      doc.text(item.numeroSerie || item.codigoInventario || '-', margin + 155, rowY);

      doc.setDrawColor(230, 230, 230);
      doc.line(margin, currentY + 5.5, pageWidth - margin, currentY + 5.5);

      currentY += 6;
    });

    currentY += 4;
  }

  // --- SECCIÓN OBSERVACIONES ---
  if (registro.observacionesGenerales) {
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = margin;
    }
    currentY = drawSectionHeader('Observaciones / Notas Adicionales', currentY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    const splitObs = doc.splitTextToSize(registro.observacionesGenerales, pageWidth - margin * 2 - 4);
    doc.text(splitObs, margin + 2, currentY + 2);
    currentY += splitObs.length * 4 + 6;
  }

  // --- SECCIÓN FOTOGRAFÍAS (SI EXISTEN) ---
  if (registro.fotos && registro.fotos.length > 0) {
    if (currentY > pageHeight - 65) {
      doc.addPage();
      currentY = margin;
    }

    currentY = drawSectionHeader('Evidencia Fotográfica Registrada', currentY);

    const maxPhotos = Math.min(registro.fotos.length, 3);
    const photoWidth = 55;
    const photoHeight = 40;

    registro.fotos.slice(0, maxPhotos).forEach((foto, i) => {
      const xPos = margin + i * (photoWidth + 5);
      try {
        doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
        doc.roundedRect(xPos, currentY, photoWidth, photoHeight, 1, 1, 'D');
        doc.addImage(foto.base64, 'JPEG', xPos + 1, currentY + 1, photoWidth - 2, photoHeight - 2);
      } catch (err) {
        console.warn('No se pudo incrustar imagen en PDF:', err);
      }
    });

    currentY += photoHeight + 6;
  }

  // --- SECCIÓN FIRMAS DIGITALES ---
  if (currentY > pageHeight - 55) {
    doc.addPage();
    currentY = margin;
  }

  currentY = drawSectionHeader('Firmas de Conformidad Digital', currentY);

  const sigBoxWidth = (pageWidth - margin * 2 - 6) / 2;
  const sigBoxHeight = 32;

  // Firma Entrega
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(margin, currentY, sigBoxWidth, sigBoxHeight, 1, 1, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('FIRMA QUIEN ENTREGA', margin + 3, currentY + 4.5);

  if (registro.firmaEntrega?.base64) {
    try {
      doc.addImage(registro.firmaEntrega.base64, 'PNG', margin + 5, currentY + 6, sigBoxWidth - 10, 18);
    } catch {
      doc.text('(Firma digital adjunta)', margin + 5, currentY + 16);
    }
  } else {
    doc.setDrawColor(180, 180, 180);
    doc.line(margin + 5, currentY + 22, margin + sigBoxWidth - 5, currentY + 22);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text('Sin firma o registrada como conforme verbal', margin + 5, currentY + 26);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text(registro.entregaPor?.nombre || 'Interviniente Entrega', margin + 3, currentY + sigBoxHeight - 2);

  // Firma Recibe
  const sigRecibeX = margin + sigBoxWidth + 6;
  doc.roundedRect(sigRecibeX, currentY, sigBoxWidth, sigBoxHeight, 1, 1, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('FIRMA QUIEN RECIBE', sigRecibeX + 3, currentY + 4.5);

  if (registro.firmaRecibe?.base64) {
    try {
      doc.addImage(registro.firmaRecibe.base64, 'PNG', sigRecibeX + 5, currentY + 6, sigBoxWidth - 10, 18);
    } catch {
      doc.text('(Firma digital adjunta)', sigRecibeX + 5, currentY + 16);
    }
  } else {
    doc.setDrawColor(180, 180, 180);
    doc.line(sigRecibeX + 5, currentY + 22, sigRecibeX + sigBoxWidth - 5, currentY + 22);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text('Sin firma o registrada como conforme verbal', sigRecibeX + 5, currentY + 26);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text(registro.recibePor?.nombre || 'Interviniente Recepción', sigRecibeX + 3, currentY + sigBoxHeight - 2);

  currentY += sigBoxHeight + 6;

  // --- PIE DE PÁGINA CON QR CODE DE VALIDACIÓN ---
  try {
    const qrData = JSON.stringify({
      folio: registro.folio,
      tipo: registro.tipoOperacion,
      fecha: registro.fechaHora,
      monto: registro.dinero?.monto,
      materialesCount: registro.materiales?.length,
    });

    const qrBase64 = await QRCode.toDataURL(qrData, { margin: 1, width: 80 });
    doc.addImage(qrBase64, 'PNG', pageWidth - margin - 22, pageHeight - 24, 20, 20);
  } catch (err) {
    console.warn('Error generando QR code:', err);
  }

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Documento generado electrónicamente. Folio: ${registro.folio} | Registro verificado por Sistema de Control de Activos.`,
    margin,
    pageHeight - 8
  );

  return doc;
}

export async function downloadActaPdf(registro: Registro): Promise<void> {
  const doc = await generateActaPdf(registro);
  const filename = `Acta_${registro.tipoOperacion}_${registro.folio}.pdf`;
  doc.save(filename);
}

export async function getPdfBase64(registro: Registro): Promise<string> {
  const doc = await generateActaPdf(registro);
  return doc.output('datauristring');
}
