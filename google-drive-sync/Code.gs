/**
 * GOOGLE APPS SCRIPT - CONECTOR DE CONTROL DE ACTIVOS
 * Carpeta destino: Trabajo/Mono
 * 
 * INSTRUCCIONES RÁPIDAS:
 * 1. Abre https://script.google.com/
 * 2. Crea un nuevo proyecto llamado "Sincronizador Control Activos - Trabajo/Mono"
 * 3. Pega este código completo en el archivo Code.gs
 * 4. Haz clic en "Implementar" -> "Nueva implementación"
 * 5. Selecciona Tipo: "Aplicación web"
 * 6. Ejecutar como: "Yo (tu cuenta de Google)"
 * 7. Quién tiene acceso: "Cualquier persona" (Anyone)
 * 8. Copia la URL de la aplicación web resultante y pégala en los Ajustes del sistema.
 */

function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);

    if (data.action === 'PING') {
      var folder = getOrCreateFolderPath(data.folderPath || 'Trabajo/Mono');
      return ContentService.createTextOutput(JSON.stringify({
        status: 'SUCCESS',
        message: 'Conexión exitosa. Carpeta lista: ' + folder.getName(),
        folderUrl: folder.getUrl()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (data.action === 'SYNC_REGISTRO') {
      var targetFolder = getOrCreateFolderPath(data.folderPath || 'Trabajo/Mono');
      var reg = data.registro;
      
      // 1. Guardar PDF si fue enviado
      var pdfUrl = '';
      if (data.pdfBase64) {
        var pdfBytes = Utilities.base64Decode(data.pdfBase64);
        var pdfBlob = Utilities.newBlob(pdfBytes, 'application/pdf', data.pdfFilename || ('Acta_' + reg.folio + '.pdf'));
        var pdfFile = targetFolder.createFile(pdfBlob);
        pdfUrl = pdfFile.getUrl();
      }

      // 2. Guardar Fotografías si fueron enviadas
      var photoUrls = [];
      if (data.photos && data.photos.length > 0) {
        for (var i = 0; i < data.photos.length; i++) {
          var p = data.photos[i];
          var imgBytes = Utilities.base64Decode(p.base64);
          var imgBlob = Utilities.newBlob(imgBytes, 'image/jpeg', p.name || ('Foto_' + (i+1) + '_' + reg.folio + '.jpg'));
          var photoFile = targetFolder.createFile(imgBlob);
          photoUrls.push(photoFile.getUrl());
        }
      }

      // 3. Registrar fila en Google Sheets dentro de Trabajo/Mono
      var spreadsheet = getOrCreateSpreadsheet(targetFolder, data.sheetName || 'Control_Activos');
      var sheet = spreadsheet.getActiveSheet();

      // Formatear texto de materiales
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
        (reg.dinero ? reg.dinero.concepto : ''),
        materialesTxt,
        reg.observacionesGenerales || '',
        pdfUrl,
        photoUrls.join(' \n ')
      ];

      sheet.appendRow(rowData);

      return ContentService.createTextOutput(JSON.stringify({
        status: 'SUCCESS',
        message: 'Registro almacenado en Google Drive y Hoja de Cálculo exitosamente.',
        folderUrl: targetFolder.getUrl(),
        pdfUrl: pdfUrl,
        sheetUrl: spreadsheet.getUrl()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'UNKNOWN_ACTION',
      message: 'Acción no reconocida'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'ERROR',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("El servicio Webhook para Control de Activos (Trabajo/Mono) está activo y funcionando.");
}

/**
 * Busca o crea la jerarquía de carpetas especificada (ej. "Trabajo/Mono")
 */
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

/**
 * Busca o crea la hoja de cálculo de control en la carpeta
 */
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
    "Timestamp Registro",
    "Folio",
    "Tipo Operación",
    "Categoría",
    "Fecha/Hora Transacción",
    "Sede / Proyecto",
    "Entregado Por",
    "Recibido Por",
    "Monto Dinero",
    "Moneda",
    "Método Pago",
    "Concepto Dinero",
    "Materiales y Bienes",
    "Observaciones",
    "Enlace Acta PDF (Drive)",
    "Enlaces Fotos Evidencia (Drive)"
  ];

  sheet.appendRow(headers);
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#166534");
  headerRange.setFontColor("#FFFFFF");
  headerRange.setFontWeight("bold");
  sheet.setFrozenRows(1);

  return ss;
}
