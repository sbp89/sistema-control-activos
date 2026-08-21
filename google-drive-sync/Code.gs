/**
 * GOOGLE APPS SCRIPT - CONECTOR AUTOMÁTICO DE CONTROL DE ACTIVOS
 * Carpeta destino: Trabajo/Mono
 */

function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);

    if (data.action === 'SYNC_REGISTRO') {
      var targetFolder = getOrCreateFolderPath(data.folderPath || 'Trabajo/Mono');
      var reg = data.registro;
      
      // 1. Guardar Acta en PDF si fue enviada
      var pdfUrl = '';
      if (data.pdfBase64) {
        var pdfBytes = Utilities.base64Decode(data.pdfBase64);
        var pdfBlob = Utilities.newBlob(pdfBytes, 'application/pdf', data.pdfFilename || ('Acta_' + reg.folio + '.pdf'));
        var pdfFile = targetFolder.createFile(pdfBlob);
        pdfUrl = pdfFile.getUrl();
      }

      // 2. Registrar en Google Sheets dentro de Trabajo/Mono
      var spreadsheet = getOrCreateSpreadsheet(targetFolder, data.sheetName || 'Control_Activos');
      var sheet = spreadsheet.getActiveSheet();

      // Formatear detalles de Oro si aplica
      var oroTxt = '';
      if (reg.oro && reg.oro.gramos > 0) {
        oroTxt = reg.oro.gramos + ' g | Liquidación: $' + (reg.oro.valorLiquidacion || 0) + (reg.oro.leyPureza ? ' (' + reg.oro.leyPureza + ')' : '');
      }

      // Formatear materiales si aplica
      var materialesTxt = '';
      if (reg.materiales && reg.materiales.length > 0) {
        materialesTxt = reg.materiales.map(function(m) {
          return m.cantidad + ' ' + m.unidad + ' - ' + m.descripcion + (m.numeroSerie ? ' (S/N: ' + m.numeroSerie + ')' : '');
        }).join(' | ');
      }

      var rowData = [
        new Date(),
        reg.folio,
        reg.tipoOperacion,
        reg.categoria,
        reg.fechaHora,
        (reg.ubicacion ? (reg.ubicacion.sede || '') + ' ' + (reg.ubicacion.proyecto || '') : ''),
        (reg.entregaPor ? (reg.entregaPor.nombre || '') + ' (' + (reg.entregaPor.documento || 'Sin doc') + ')' : 'Confidencial'),
        (reg.recibePor ? (reg.recibePor.nombre || '') + ' (' + (reg.recibePor.documento || 'Sin doc') + ')' : 'Confidencial'),
        (reg.dinero ? reg.dinero.monto : 0),
        (reg.dinero ? reg.dinero.moneda : ''),
        (reg.dinero ? reg.dinero.metodoPago : ''),
        oroTxt,
        materialesTxt,
        reg.observacionesGenerales || '',
        pdfUrl
      ];

      sheet.appendRow(rowData);

      return ContentService.createTextOutput(JSON.stringify({
        status: 'SUCCESS',
        message: 'Copia en PDF y registro guardados en Google Drive exitosamente.',
        pdfUrl: pdfUrl
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'OK' })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'ERROR',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Servicio de respaldo activo.");
}

function getOrCreateFolderPath(path) {
  var parts = path.split('/').map(function(s) { return s.trim(); }).filter(function(s) { return s.length > 0; });
  var currentFolder = DriveApp.getRootFolder();

  for (var i = 0; i < parts.length; i++) {
    var part = parts[i];
    var subfolders = currentFolder.getFoldersByName(part);
    if (subfolders.hasNext()) {
      currentFolder = subfolders.next();
    } else {
      currentFolder = currentFolder.createFolder(part);
    }
  }

  return currentFolder;
}

function getOrCreateSpreadsheet(folder, sheetName) {
  var files = folder.getFilesByName(sheetName);
  if (files.hasNext()) {
    var file = files.next();
    return SpreadsheetApp.openById(file.getId());
  }

  var ss = SpreadsheetApp.create(sheetName);
  var file = DriveApp.getFileById(ss.getId());
  folder.addFile(file);
  DriveApp.getRootFolder().removeFile(file);

  var sheet = ss.getActiveSheet();
  sheet.setName("Registros");
  var headers = [
    "Timestamp",
    "Folio",
    "Tipo Operación",
    "Categoría",
    "Fecha/Hora",
    "Sede / Ubicación",
    "Entregado Por",
    "Recibido Por",
    "Monto Dinero",
    "Moneda",
    "Método Pago",
    "Detalle Oro (Gramos y Liquidación)",
    "Materiales",
    "Observaciones",
    "Enlace Acta PDF"
  ];

  sheet.appendRow(headers);
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#0f172a");
  headerRange.setFontColor("#FFFFFF");
  headerRange.setFontWeight("bold");
  sheet.setFrozenRows(1);

  return ss;
}
