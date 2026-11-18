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

## 5. Activar el programa de puntos y la PWA

La página de recompensas usa Firebase Authentication para las cuentas y este mismo proyecto de Apps Script para validar sesiones y guardar el libro de puntos en Google Sheets. No se guardan contraseñas en Sheets.

1. En Firebase crea un proyecto y una aplicación web. En **Authentication > Sign-in method**, habilita **Correo electrónico/contraseña** y **Google**.
2. En **Authentication > Settings > Authorized domains**, añade `ipe3ec.github.io`.
3. Registra desde la página de recompensas el correo que administrará los puntos; verifica ese correo y acepta el aviso de datos. No es necesario crear la cuenta manualmente en Firebase Console.
4. Copia la configuración pública de la aplicación web en `static/js/rewards/firebase-config.js`. Mantén las claves `apiKey`, `authDomain`, `projectId` y `appId`. La API key web no es una contraseña; no pegues credenciales de cuentas de servicio en el repositorio.
5. En Apps Script, reemplaza `Code.gs` por el archivo actualizado de este repositorio. En **Configuración del proyecto > Propiedades del script**, define:
   - `FIREBASE_WEB_API_KEY`: la misma API key web de Firebase. Apps Script la usa para validar cada ID token con Firebase.
   - `REWARD_ADMIN_EMAILS`: los correos autorizados, separados por comas; por ejemplo `ipe3ecuador@gmail.com`.
   - `SPREADSHEET_ID`: opcional. Si el cotizador ya creó su hoja, conserva ese valor. Las pestañas `Miembros` y `Movimientos` se crean automáticamente en esa misma hoja.
6. Vuelve a implementar la aplicación web de Apps Script con **Ejecutar como: Yo** y **Acceso: Cualquiera**. Al editar una implementación existente, crea una versión nueva y conserva la URL que termina en `/exec`.
7. Pega esa URL `/exec` como `apiUrl` en `static/js/rewards/firebase-config.js`.
8. Publica el repositorio en GitHub Pages y prueba el registro, la confirmación de correo, la consulta del saldo y la administración con cuentas reales.

Mantén la hoja de cálculo y sus pestañas privadas: no actives el uso compartido público. El endpoint de Apps Script acepta solicitudes públicas, pero cada operación de puntos valida un ID token de Firebase y las acciones administrativas verifican `REWARD_ADMIN_EMAILS`.

El programa acredita **1 punto por cada USD 10 completos pagados**. El administrador registra una sola vez el total pagado del contrato (incluidos sus abonos); cada código de contrato es único. Los contratos deben ser posteriores a la fecha y hora de registro de la cuenta. Con **50 puntos** el cliente puede solicitar un mantenimiento preventivo básico de 1 equipo en Quito, con mano de obra incluida y sin repuestos ni traslados fuera de Quito. El canje queda pendiente hasta que un administrador lo apruebe.

El mismo portal muestra el panel administrativo cuando inicia sesión un correo incluido en `REWARD_ADMIN_EMAILS`. Desde ahí se confirma el monto pagado y se aprueban o rechazan solicitudes de canje.

La página `recompensas.html` incluye un manifiesto y un service worker para instalarla desde Chrome en Android. El service worker almacena solo la estructura pública de la aplicación; no guarda saldos, historial, tokens ni respuestas de la API sin conexión.

Si la API key de Firebase tiene restricciones de API, permite la API **Identity Toolkit** que valida cuentas. Apps Script tiene cuotas de ejecución y de solicitudes; revisa el uso de Google Apps Script conforme crezca el programa.
