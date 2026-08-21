# 📁 Guía de Integración con Google Drive (Carpeta: Trabajo/Mono)

Esta guía te permite conectar tu sistema desplegado en Vercel con tu cuenta personal o corporativa de Google Drive, de modo que cada vez que registres una entrega o recepción de dinero o material, se cree automáticamente:
1. Una carpeta estructurada: **`Trabajo/Mono`** en tu Google Drive.
2. Una Hoja de Cálculo **`Control_Activos`** donde se registra cada fila con los datos de la transacción.
3. El **Acta oficial en PDF** guardada con su folio.
4. Las **Fotografías de evidencia comprimidas** para no saturar el espacio de almacenamiento.

---

## 🚀 Pasos de Configuración (Toma solo 2 minutos)

### Paso 1: Abrir Google Apps Script
1. Entra a [https://script.google.com/](https://script.google.com/) con tu cuenta de Google.
2. Haz clic en el botón superior izquierdo **"Nuevo proyecto"**.
3. Cambia el título arriba (donde dice "Proyecto sin título") por **`Conector Control Activos - Trabajo/Mono`**.

### Paso 2: Pegar el Código
1. Borra el código de ejemplo que aparece por defecto en el archivo `Código.gs`.
2. Abre el archivo [`Code.gs`](./Code.gs) de este proyecto y copia todo su contenido.
3. Pégalo en el editor de Google Apps Script y presiona el ícono de guardar (💾).

### Paso 3: Desplegar como Aplicación Web
1. En la esquina superior derecha, haz clic en el botón azul **"Implementar"** (o *Deploy*) y selecciona **"Nueva implementación"**.
2. En la ventana emergente, haz clic en el ícono de engranaje (⚙️) al lado de "Seleccionar tipo" y elige **"Aplicación web"**.
3. Llena los siguientes campos:
   - **Descripción**: `Sincronizador Trabajo/Mono v1`
   - **Ejecutar como**: `Yo (tu correo electrónico)`
   - **Quién tiene acceso**: **`Cualquier persona`** (o *Anyone*) — *Importante para que Vercel pueda enviar los datos sin requerir inicio de sesión complejo*.
4. Haz clic en **"Implementar"**.
5. Google te pedirá "Revisar permisos" la primera vez. Haz clic en tu cuenta, luego en "Configuración avanzada" (o *Advanced*) y luego en "Ir a Conector Control Activos (no seguro)" para otorgar acceso a tu Drive.
6. Copia la **URL de la aplicación web** que te entrega Google (termina en `/exec`).

### Paso 4: Conectar en la Aplicación Web
1. Abre tu aplicación (en local o tu enlace de Vercel).
2. Ve a la sección **"Ajustes / Drive"** en el menú superior.
3. Pega la URL del Webhook copiada en el paso anterior.
4. Asegúrate que la ruta de la carpeta diga: `Trabajo/Mono`.
5. Haz clic en **"Probar Conexión"**. ¡Verás un mensaje verde de confirmación!
6. Activa la casilla **"Sincronizar automáticamente nuevos registros"** y guarda los cambios.

---

## 🔒 Privacidad y Confidencialidad
- Los datos se transmiten directamente entre tu aplicación web y tu propio Google Drive.
- Si en una transacción no registras nombres o documentos por confidencialidad, el sistema los catalogará como `Confidencial / No especificado`.
- Las imágenes se comprimen previamente en el navegador antes del envío, reduciendo el consumo de megabytes en más de un 85%.
