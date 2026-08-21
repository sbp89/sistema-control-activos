'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Cloud, 
  Folder, 
  FileSpreadsheet, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  HelpCircle, 
  Download, 
  Upload, 
  Database,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { 
  getGoogleDriveConfig, 
  saveGoogleDriveConfig, 
  DEFAULT_DRIVE_CONFIG,
  exportAllDataAsJson,
  importDataFromJson
} from '@/lib/db';
import { GoogleDriveConfig } from '@/lib/types';
import { testDriveConnection } from '@/lib/drive-service';

export default function ConfiguracionPage() {
  const [config, setConfig] = useState<GoogleDriveConfig>(DEFAULT_DRIVE_CONFIG);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    setConfig(getGoogleDriveConfig());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveGoogleDriveConfig(config);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestConnection = async () => {
    if (!config.webhookUrl) {
      setTestResult({ success: false, message: 'Por favor ingresa primero la URL del Webhook de Google Apps Script.' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const res = await testDriveConnection(config.webhookUrl);
    setTestResult(res);
    setIsTesting(false);
  };

  const handleExportBackup = () => {
    const json = exportAllDataAsJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Copia_Seguridad_Control_Activos_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const res = importDataFromJson(content);
      if (res.success) {
        setImportStatus(`¡Copia restaurada exitosamente! Se importaron ${res.count} registros.`);
      } else {
        setImportStatus(`Error al importar: ${res.error}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-emerald-600" />
          <span>Configuración & Google Drive</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Vincula tu almacenamiento en la carpeta <strong className="text-emerald-600">Trabajo/Mono</strong> de Google Drive y administra tus copias de seguridad.
        </p>
      </div>

      {/* Formulario de Configuración de Google Drive */}
      <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Google Drive (Carpeta: Trabajo/Mono)
              </h2>
              <p className="text-xs text-slate-500">
                Sincronización directa mediante Webhook de Google Apps Script.
              </p>
            </div>
          </div>

          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
            config.webhookUrl
              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
              : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
          }`}>
            {config.webhookUrl ? 'Configurado' : 'Pendiente'}
          </span>
        </div>

        {/* Campos de configuración */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>URL del Webhook de Google Apps Script *</span>
              <a
                href="https://script.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:underline inline-flex items-center gap-1 font-semibold"
              >
                <span>Abrir Google Apps Script</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </label>
            <input
              type="url"
              value={config.webhookUrl}
              onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="w-full px-4 py-2.5 text-xs sm:text-sm font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Pega aquí la URL de la aplicación web desplegada en tu cuenta de Google.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ruta de Carpeta en Drive</span>
              </label>
              <input
                type="text"
                value={config.folderPath}
                onChange={(e) => setConfig({ ...config, folderPath: e.target.value })}
                placeholder="Trabajo/Mono"
                className="w-full px-4 py-2 text-xs sm:text-sm font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Por defecto: <code>Trabajo/Mono</code> (se creará automáticamente si no existe).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Nombre de Hoja de Cálculo en Drive</span>
              </label>
              <input
                type="text"
                value={config.sheetName}
                onChange={(e) => setConfig({ ...config, sheetName: e.target.value })}
                placeholder="Control_Activos"
                className="w-full px-4 py-2 text-xs sm:text-sm font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Hoja de Google Sheets donde se añadirán las filas de auditoría.
              </p>
            </div>
          </div>

          {/* Opciones de Sincronización */}
          <div className="pt-2 space-y-3">
            <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoSync}
                onChange={(e) => setConfig({ ...config, autoSync: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Sincronizar automáticamente nuevos registros
                </span>
                <span className="text-[11px] text-slate-500">
                  Al presionar &quot;Guardar Registro&quot;, se enviará de inmediato el PDF y datos a Google Drive.
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={config.syncPhotos}
                onChange={(e) => setConfig({ ...config, syncPhotos: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Guardar fotografías comprimidas en la carpeta Drive
                </span>
                <span className="text-[11px] text-slate-500">
                  Las fotos se redimensionan y comprimen antes del envío para no saturar tu espacio de almacenamiento.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Resultado de Prueba de Conexión */}
        {testResult && (
          <div
            className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 ${
              testResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <span className="font-medium">{testResult.message}</span>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isTesting && <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />}
            <span>Probar Conexión con Drive</span>
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Configuración</span>
          </button>
        </div>

        {saveSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-semibold text-center animate-in fade-in">
            ✓ Configuración de Google Drive guardada correctamente.
          </div>
        )}
      </form>

      {/* Guía Rápida de Instalación de Google Apps Script */}
      <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white">
            ¿Cómo vincular tu Google Drive en 2 minutos?
          </h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          El sistema incluye un script listo para usar en <code>google-drive-sync/Code.gs</code>. Sigue estos 3 pasos:
        </p>

        <ol className="list-decimal list-inside text-xs text-slate-300 space-y-2 pl-2">
          <li>
            Entra a{' '}
            <a
              href="https://script.google.com/"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 font-semibold underline"
            >
              script.google.com
            </a>{' '}
            y crea un proyecto llamado <strong>Control Activos - Trabajo/Mono</strong>.
          </li>
          <li>
            Pega el código incluido en <code>google-drive-sync/Code.gs</code> en el editor de Google.
          </li>
          <li>
            Haz clic en <strong>Implementar ➔ Nueva implementación</strong>, selecciona tipo <strong>Aplicación web</strong>, ejecuta como <strong>Yo</strong> y acceso <strong>Cualquier persona</strong>. Copia la URL generada y pégala en el campo superior.
          </li>
        </ol>
      </div>

      {/* Respaldo y Restauración de Datos Locales */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
          <Database className="w-5 h-5 text-emerald-600" />
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Copia de Seguridad y Restauración
            </h3>
            <p className="text-xs text-slate-500">
              Exporta todos tus registros en un archivo JSON o restáuralos en otro dispositivo.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportBackup}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Descargar Copia de Seguridad (JSON)</span>
          </button>

          <label className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Restaurar Copia desde Archivo</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>
        </div>

        {importStatus && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-medium">
            {importStatus}
          </div>
        )}
      </div>
    </div>
  );
}
