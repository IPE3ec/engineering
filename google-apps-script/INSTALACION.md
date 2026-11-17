# Cotizador IPE3 con Google

## 1. Crear el proyecto

1. Abre Google Apps Script.
2. Crea un proyecto nuevo.
3. Añade `Code.gs` con el contenido de `Code.gs`.
4. Añade un archivo HTML llamado `Admin` con el contenido de `Admin.html`.
5. Guarda el proyecto.

## 2. Configurar permisos

1. Ejecuta `getQuoteSheet_` una vez y autoriza Drive y Sheets.
2. En configuración del script, añade propiedades opcionales:
   - `ADMIN_EMAILS`: correos administrativos separados por comas.
   - `SPREADSHEET_ID`: ID de una hoja existente, si no quieres que el sistema cree una automáticamente.
   - `DRIVE_FOLDER_ID`: ID de una carpeta existente, si no quieres que el sistema cree una automáticamente.

Si no defines `ADMIN_EMAILS`, solo podrá administrar el panel el propietario efectivo del proyecto.

## 3. Publicar la API y el panel

1. Pulsa **Implementar** > **Nuevas implementaciones**.
2. Tipo: **Aplicación web**.
3. Ejecutar como: **Yo**.
4. Acceso: **Cualquiera**.
5. Copia la URL que termina en `/exec`.

En esa misma URL se abrirá el panel administrativo.

## 4. Conectar la página

Reemplaza `const IPE3_QUOTE_ENDPOINT = "";` en `cotizador.js` por:

```js
const IPE3_QUOTE_ENDPOINT = "PEGAR_URL_EXEC_AQUI";
```

Las fotos y PDFs se guardarán dentro de `IPE3_Cotizaciones` en Google Drive.
Los datos se registrarán en una hoja llamada `IPE3 - Cotizaciones`.
