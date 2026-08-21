# 💼 Sistema de Control de Activos - Entrega y Recepción

Sistema web profesional para el control, custodia y emisión de actas oficiales de **Entrega y Recepción de Dinero y Materiales**. Diseñado con soporte para pantalla táctil en móviles/tablets y computadores, captura fotográfica en vivo con compresión optimizada para Google Drive (carpeta `Trabajo/Mono`), firmas digitales, actas en PDF de alta resolución con códigos QR de validación, y listo para ser desplegado en **Vercel** con control de versiones en **GitHub**.

---

## 🌟 Características Principales

1. **Gestión Dual de Operaciones**:
   - **Actas de Entrega** (Salidas / Asignaciones).
   - **Actas de Recepción** (Entradas / Devoluciones).
2. **Flexibilidad por Confidencialidad**:
   - Los campos de identificación personal (nombres, documentos, teléfonos, firmas) **no son obligatorios**. Permite transacciones confidenciales o rápidas sin bloqueos.
3. **Captura Fotográfica con Compresión Ultra-Eficiente**:
   - Toma fotos en vivo desde la cámara frontal o trasera de celulares/tablets, o sube archivos desde la galería.
   - **Compresión automática**: Reduce fotos de 5-12 MB a ~80-180 KB en el navegador antes de almacenar o subir, ahorrando más del 90% de almacenamiento en Google Drive.
4. **Firmas Digitales (Táctil y Mouse)**:
   - Panel de firma interactivo con trazo suave optimizado para dibujar con el dedo en pantallas táctiles o con el mouse en PC.
   - Opciones para limpiar o marcar como omitido por confidencialidad.
5. **Actas Oficiales en PDF con Código QR**:
   - Generación instantánea de actas formales con membrete institucional, folio único (`ENT-20260821-XXXX` / `REC-20260821-XXXX`), desglose financiero, tabla de materiales, fotos de evidencia, firmas incrustadas y QR de verificación.
6. **Almacenamiento en Google Drive (Carpeta: `Trabajo/Mono`)**:
   - Conector con Google Apps Script que guarda automáticamente las actas en PDF, las fotos de evidencia y añade una fila con el resumen en una hoja de Google Sheets.
7. **Historial, Filtros y Reportes**:
   - Búsqueda en tiempo real, filtros avanzados por tipo, categoría, rango de fechas y estado de sincronización.
   - Exportación directa a **Excel (.CSV)** con codificación UTF-8 compatible y respaldo completo en **JSON**.

---

## 🚀 Despliegue en Vercel y Control de Versiones con GitHub

### 1. Inicializar y Subir a GitHub
Abre tu terminal en la carpeta del proyecto y ejecuta:

```bash
git init
git add .
git commit -m "feat: Sistema de Control de Activos con fotos, firmas y Drive Trabajo/Mono"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git push -u origin main
```

### 2. Desplegar en Vercel
1. Entra a [https://vercel.com/](https://vercel.com/) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"Add New..." ➔ "Project"**.
3. Selecciona el repositorio de GitHub que acabas de subir.
4. En la configuración del proyecto:
   - **Framework Preset**: `Next.js` (detectado automáticamente).
   - **Root Directory**: `./`
5. Haz clic en **"Deploy"**.
6. En menos de 1 minuto tendrás tu enlace público de producción (ej. `https://control-activos.vercel.app`).

---

## 📁 Configuración de Google Drive (Carpeta: `Trabajo/Mono`)

1. Abre [Google Apps Script](https://script.google.com/).
2. Crea un nuevo proyecto llamado **Conector Control Activos**.
3. Copia todo el código contenido en [`google-drive-sync/Code.gs`](./google-drive-sync/Code.gs) y pégalo en el editor.
4. Haz clic en **Implementar ➔ Nueva implementación**, selecciona tipo **Aplicación web**, establece acceso para **Cualquier persona** y copia la URL resultante.
5. Abre la aplicación (en local o en Vercel), ve a **Ajustes / Drive**, pega la URL del Webhook y haz clic en **Probar Conexión**.

---

## 💻 Ejecución Local

Para ejecutar el proyecto en tu entorno local:

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Abrir en tu navegador
# http://localhost:3000
```

---

## 🛠️ Tecnologías Utilizadas

- **Next.js 14** (App Router & Serverless API Routes)
- **React 18** & **TypeScript**
- **Tailwind CSS** (Diseño moderno, accesible y responsivo)
- **Lucide Icons**
- **jsPDF** & **html2canvas** (Generación de actas en PDF de alta fidelidad)
- **HTML5 Canvas API** (Firma digital táctil/mouse y compresión de fotos)
- **QRCode** (Códigos QR de validación)
- **Canvas Confetti** (Animaciones de confirmación)
- **Google Apps Script** (Sincronización con Google Drive `Trabajo/Mono` y Google Sheets)
