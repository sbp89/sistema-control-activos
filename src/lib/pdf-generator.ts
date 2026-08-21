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

  const primaryColor = registro.tipoOperacion === 'ENTREGA' ? [22, 101, 52] : [15, 118, 110];
  const darkGray = [30, 41, 59];
  const lightGray = [241, 245, 249];
  const borderGray = [203, 213, 225];

  const drawSectionHeader = (title: string, yPos: number): number => {
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 6.5, 1.5, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(title.toUpperCase(), margin + 3, yPos + 4.8);
    return yPos + 9.5;
  };

  // --- ENCABEZADO SUPERIOR ---
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(margin, currentY, pageWidth - margin * 2, 18, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('ACTA OFICIAL DE ' + (registro.tipoOperacion === 'ENTREGA' ? 'ENTREGA' : 'RECEPCIÓN'), margin + 5, currentY + 8);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Comprobante de Custodia y Transferencia', margin + 5, currentY + 14);

  // Folio en caja blanca
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pageWidth - margin - 52, currentY + 3, 48, 12, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text('FOLIO NÚMERO:', pageWidth - margin - 50, currentY + 7);
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(registro.folio, pageWidth - margin - 50, currentY + 12);

  currentY += 22;

  // --- DATOS BÁSICOS DE FECHA Y UBICACIÓN ---
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 13, 1, 1, 'D');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('FECHA Y HORA:', margin + 3, currentY + 4.5);
  doc.text('SEDE / UBICACIÓN:', margin + 65, currentY + 4.5);
  doc.text('PROYECTO / REFERENCIA:', margin + 125, currentY + 4.5);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text(formatDate(registro.fechaHora, true), margin + 3, currentY + 9.5);
  doc.text(registro.ubicacion?.sede || 'No especificada', margin + 65, currentY + 9.5);
  doc.text(registro.ubicacion?.proyecto || 'General', margin + 125, currentY + 9.5);

  currentY += 17;

  // --- SECCIÓN PARTICIPANTES ---
  currentY = drawSectionHeader('1. Intervinientes en la Transacción', currentY);

  const colWidth = (pageWidth - margin * 2 - 4) / 2;

  // Quien Entrega
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(margin, currentY, colWidth, 22, 1, 1, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('ENTREGADO POR:', margin + 3, currentY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text(`Nombre: ${registro.entregaPor?.nombre || '(Confidencial / No registrado)'}`, margin + 3, currentY + 9);
  doc.text(`Documento: ${registro.entregaPor?.documento || 'No registrado'}`, margin + 3, currentY + 13);
  doc.text(`Cargo / Tel: ${[registro.entregaPor?.cargoEmpresa, registro.entregaPor?.telefono].filter(Boolean).join(' - ') || 'No registrado'}`, margin + 3, currentY + 17);

  // Quien Recibe
  doc.roundedRect(margin + colWidth + 4, currentY, colWidth, 22, 1, 1, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('RECIBIDO POR:', margin + colWidth + 7, currentY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text(`Nombre: ${registro.recibePor?.nombre || '(Confidencial / No registrado)'}`, margin + colWidth + 7, currentY + 9);
  doc.text(`Documento: ${registro.recibePor?.documento || 'No registrado'}`, margin + colWidth + 7, currentY + 13);
  doc.text(`Cargo / Tel: ${[registro.recibePor?.cargoEmpresa, registro.recibePor?.telefono].filter(Boolean).join(' - ') || 'No registrado'}`, margin + colWidth + 7, currentY + 17);

  currentY += 26;

  // --- SECCIÓN ORO (SI APLICA) ---
  if (registro.oro && (registro.oro.gramos > 0 || registro.oro.valorLiquidacion > 0)) {
    currentY = drawSectionHeader('2. Detalle y Liquidación de Oro', currentY);

    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.setFillColor(254, 252, 232); // Fondo dorado suave
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 20, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(146, 64, 14);
    doc.text('PESO EN GRAMOS:', margin + 3, currentY + 5);
    doc.text('VALOR LIQUIDACIÓN TOTAL:', margin + 65, currentY + 5);
    doc.text('PRECIO X GRAMO:', margin + 135, currentY + 5);

    doc.setFontSize(12);
    doc.setTextColor(180, 83, 9);
    doc.text(`${registro.oro.gramos.toFixed(2)} g`, margin + 3, currentY + 12);

    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(formatMoney(registro.oro.valorLiquidacion, registro.oro.moneda || 'COP'), margin + 65, currentY + 12);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    const precioXg = registro.oro.precioPorGramo || (registro.oro.gramos > 0 ? Math.round(registro.oro.valorLiquidacion / registro.oro.gramos) : 0);
    doc.text(formatMoney(precioXg, registro.oro.moneda || 'COP'), margin + 135, currentY + 12);

    if (registro.oro.tipoPieza || registro.oro.observaciones) {
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(71, 85, 105);
      const descOro = [
        registro.oro.tipoPieza ? `Presentación: ${registro.oro.tipoPieza}` : null,
        registro.oro.observaciones ? `Detalle: ${registro.oro.observaciones}` : null,
      ].filter(Boolean).join(' | ');
      doc.text(descOro, margin + 3, currentY + 17);
    }

    currentY += 24;
  }

  // --- SECCIÓN DINERO (SI APLICA) ---
  if (registro.dinero && registro.dinero.monto > 0) {
    const secTitle = registro.oro ? '3. Detalle de Dinero Adicional' : '2. Detalle Financiero';
    currentY = drawSectionHeader(secTitle, currentY);

    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 20, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('MONTO TOTAL:', margin + 3, currentY + 5);
    doc.text('MÉTODO DE PAGO:', margin + 70, currentY + 5);
    doc.text('COMPROBANTE / REF:', margin + 130, currentY + 5);

    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(formatMoney(registro.dinero.monto, registro.dinero.moneda), margin + 3, currentY + 12);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text(registro.dinero.metodoPago || 'EFECTIVO', margin + 70, currentY + 12);
    doc.text(registro.dinero.numeroComprobante || 'N/A', margin + 130, currentY + 12);

    if (registro.dinero.concepto) {
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(71, 85, 105);
      doc.text(`Concepto: ${registro.dinero.concepto}`, margin + 3, currentY + 17);
    }

    currentY += 24;
  }

  // --- SECCIÓN MATERIALES (SI APLICA) ---
  if (registro.materiales && registro.materiales.length > 0) {
    const secTitle = (registro.dinero || registro.oro) ? 'Detalle de Materiales y Bienes' : '2. Detalle de Materiales y Bienes';
    currentY = drawSectionHeader(secTitle, currentY);

    const tableHeaderY = currentY;
    doc.setFillColor(235, 240, 245);
    doc.rect(margin, tableHeaderY, pageWidth - margin * 2, 5.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

    doc.text('#', margin + 2, tableHeaderY + 4);
    doc.text('DESCRIPCIÓN DEL BIEN / MATERIAL', margin + 10, tableHeaderY + 4);
    doc.text('CANTIDAD', margin + 95, tableHeaderY + 4);
    doc.text('UNIDAD', margin + 115, tableHeaderY + 4);
    doc.text('ESTADO', margin + 135, tableHeaderY + 4);
    doc.text('SERIE / CÓDIGO', margin + 155, tableHeaderY + 4);

    currentY += 5.5;

    registro.materiales.forEach((item, idx) => {
      if (currentY > pageHeight - 55) {
        doc.addPage();
        currentY = margin;
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

      const rowY = currentY + 4;
      doc.text(String(idx + 1), margin + 2, rowY);
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

    currentY += 3;
  }

  // --- SECCIÓN OBSERVACIONES ---
  if (registro.observacionesGenerales) {
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = margin;
    }
    currentY = drawSectionHeader('Observaciones / Notas', currentY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    const splitObs = doc.splitTextToSize(registro.observacionesGenerales, pageWidth - margin * 2 - 4);
    doc.text(splitObs, margin + 2, currentY + 2);
    currentY += splitObs.length * 3.8 + 5;
  }

  // --- SECCIÓN FOTOGRAFÍAS (SI EXISTEN) ---
  if (registro.fotos && registro.fotos.length > 0) {
    if (currentY > pageHeight - 60) {
      doc.addPage();
      currentY = margin;
    }

    currentY = drawSectionHeader('Evidencia Fotográfica', currentY);

    const maxPhotos = Math.min(registro.fotos.length, 3);
    const photoWidth = 55;
    const photoHeight = 38;

    registro.fotos.slice(0, maxPhotos).forEach((foto, i) => {
      const xPos = margin + i * (photoWidth + 5);
      try {
        doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
        doc.roundedRect(xPos, currentY, photoWidth, photoHeight, 1, 1, 'D');
        doc.addImage(foto.base64, 'JPEG', xPos + 1, currentY + 1, photoWidth - 2, photoHeight - 2);
      } catch (err) {
        console.warn('Error imagen en PDF:', err);
      }
    });

    currentY += photoHeight + 6;
  }

  // --- SECCIÓN FIRMAS DIGITALES ---
  if (currentY > pageHeight - 50) {
    doc.addPage();
    currentY = margin;
  }

  currentY = drawSectionHeader('Firmas de Conformidad', currentY);

  const sigBoxWidth = (pageWidth - margin * 2 - 6) / 2;
  const sigBoxHeight = 30;

  // Firma Entrega
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(margin, currentY, sigBoxWidth, sigBoxHeight, 1, 1, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('FIRMA QUIEN ENTREGA', margin + 3, currentY + 4);

  if (registro.firmaEntrega?.base64) {
    try {
      doc.addImage(registro.firmaEntrega.base64, 'PNG', margin + 5, currentY + 5, sigBoxWidth - 10, 16);
    } catch {
      doc.text('(Firma digital adjunta)', margin + 5, currentY + 15);
    }
  } else {
    doc.setDrawColor(180, 180, 180);
    doc.line(margin + 5, currentY + 20, margin + sigBoxWidth - 5, currentY + 20);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(160, 160, 160);
    doc.text('Conformidad verbal / Sin firma', margin + 5, currentY + 24);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text(registro.entregaPor?.nombre || 'Interviniente Entrega', margin + 3, currentY + sigBoxHeight - 2);

  // Firma Recibe
  const sigRecibeX = margin + sigBoxWidth + 6;
  doc.roundedRect(sigRecibeX, currentY, sigBoxWidth, sigBoxHeight, 1, 1, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('FIRMA QUIEN RECIBE', sigRecibeX + 3, currentY + 4);

  if (registro.firmaRecibe?.base64) {
    try {
      doc.addImage(registro.firmaRecibe.base64, 'PNG', sigRecibeX + 5, currentY + 5, sigBoxWidth - 10, 16);
    } catch {
      doc.text('(Firma digital adjunta)', sigRecibeX + 5, currentY + 15);
    }
  } else {
    doc.setDrawColor(180, 180, 180);
    doc.line(sigRecibeX + 5, currentY + 20, sigRecibeX + sigBoxWidth - 5, currentY + 20);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(160, 160, 160);
    doc.text('Conformidad verbal / Sin firma', sigRecibeX + 5, currentY + 24);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text(registro.recibePor?.nombre || 'Interviniente Recepción', sigRecibeX + 3, currentY + sigBoxHeight - 2);

  currentY += sigBoxHeight + 5;

  // QR Code de Validación
  try {
    const qrData = JSON.stringify({
      folio: registro.folio,
      tipo: registro.tipoOperacion,
      fecha: registro.fechaHora,
      oroGramos: registro.oro?.gramos,
      oroLiquidacion: registro.oro?.valorLiquidacion,
      monto: registro.dinero?.monto,
    });

    const qrBase64 = await QRCode.toDataURL(qrData, { margin: 1, width: 80 });
    doc.addImage(qrBase64, 'PNG', pageWidth - margin - 20, pageHeight - 22, 18, 18);
  } catch (err) {
    console.warn('Error QR code:', err);
  }

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Documento digital con validez y folio: ${registro.folio}.`,
    margin,
    pageHeight - 6
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
