const SPREADSHEET_NAME = "IPE3 - Cotizaciones";
const DRIVE_FOLDER_NAME = "IPE3_Cotizaciones";

function doGet() {
  return HtmlService.createTemplateFromFile("Admin")
    .evaluate()
    .setTitle("IPE3 - Gestión de cotizaciones")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(request) {
  try {
    const data = JSON.parse(request.postData.contents);
    const required = ["nombre", "telefono", "servicio", "categoria", "cantidad", "descripcion"];
    for (const field of required) {
      if (!data[field]) throw new Error("Faltan datos obligatorios.");
    }

    const quoteId = "COT-" + Utilities.formatDate(new Date(), "America/Guayaquil", "yyyyMMdd-HHmmss") +
      "-" + Math.floor(Math.random() * 900 + 100);
    const files = saveAttachments_(quoteId, data.attachments || []);
    const sheet = getQuoteSheet_();
    sheet.appendRow([
      quoteId,
      new Date(),
      data.nombre,
      data.telefono,
      data.email || "",
      data.institucion || "",
      data.servicio,
      data.categoria,
      data.modelo || "",
      Number(data.cantidad) || 1,
      data.ciudad || "",
      data.urgencia || "Normal",
      data.descripcion,
      "Nueva",
      files.map((file) => file.url).join("\n"),
      files.map((file) => file.name).join(", "),
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      quoteId: quoteId,
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.message,
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getQuoteSheet_() {
  const properties = PropertiesService.getScriptProperties();
  let spreadsheet;
  const spreadsheetId = properties.getProperty("SPREADSHEET_ID");

  if (spreadsheetId) {
    spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  } else {
    const files = DriveApp.getFilesByName(SPREADSHEET_NAME);
    spreadsheet = files.hasNext() ? SpreadsheetApp.open(files.next()) : SpreadsheetApp.create(SPREADSHEET_NAME);
    properties.setProperty("SPREADSHEET_ID", spreadsheet.getId());
  }

  let sheet = spreadsheet.getSheetByName("Cotizaciones");
  if (!sheet) sheet = spreadsheet.insertSheet("Cotizaciones");

  const headers = [
    "Código", "Fecha", "Nombre", "Teléfono", "Correo", "Institución",
    "Servicio", "Categoría", "Marca y modelo", "Cantidad", "Ciudad",
    "Urgencia", "Descripción", "Estado", "Archivos en Drive", "Nombres adjuntos",
  ];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }
  sheet.setFrozenRows(1);
  return sheet;
}

function getRootFolder_() {
  const properties = PropertiesService.getScriptProperties();
  const folderId = properties.getProperty("DRIVE_FOLDER_ID");
  if (folderId) return DriveApp.getFolderById(folderId);

  const folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
  const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(DRIVE_FOLDER_NAME);
  properties.setProperty("DRIVE_FOLDER_ID", folder.getId());
  return folder;
}

function saveAttachments_(quoteId, attachments) {
  if (!attachments.length) return [];
  const root = getRootFolder_();
  const quoteFolder = root.createFolder(quoteId);
  const saved = [];

  for (const attachment of attachments.slice(0, 5)) {
    if (!attachment.base64) continue;
    const blob = Utilities.newBlob(
      Utilities.base64Decode(attachment.base64),
      attachment.type || "application/octet-stream",
      sanitizeFileName_(attachment.name || "adjunto")
    );
    const file = quoteFolder.createFile(blob);
    saved.push({
      name: file.getName(),
      url: file.getUrl(),
    });
  }
  return saved;
}

function sanitizeFileName_(name) {
  return name.replace(/[\\/:*?"<>|]/g, "_").slice(0, 120);
}

function isAllowedAdmin_() {
  const activeEmail = Session.getActiveUser().getEmail();
  const configured = PropertiesService.getScriptProperties().getProperty("ADMIN_EMAILS");
  if (!activeEmail) return false;
  if (!configured) return activeEmail === Session.getEffectiveUser().getEmail();
  return configured.split(",").map((email) => email.trim().toLower()).indexOf(activeEmail.toLower()) >= 0;
}

function getQuotes() {
  if (!isAllowedAdmin_()) throw new Error("Acceso no autorizado.");
  const sheet = getQuoteSheet_();
  if (sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues().reverse().map((row) => ({
    code: row[0],
    date: row[1] ? Utilities.formatDate(new Date(row[1]), "America/Guayaquil", "yyyy-MM-dd HH:mm") : "",
    name: row[2],
    phone: row[3],
    email: row[4],
    institution: row[5],
    service: row[6],
    category: row[7],
    model: row[8],
    quantity: row[9],
    city: row[10],
    urgency: row[11],
    description: row[12],
    status: row[13],
    files: row[14],
  }));
}

function updateQuoteStatus(code, status) {
  if (!isAllowedAdmin_()) throw new Error("Acceso no autorizado.");
  const sheet = getQuoteSheet_();
  const values = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), 1).getValues();
  for (let index = 0; index < values.length; index++) {
    if (values[index][0] === code) {
      sheet.getRange(index + 2, 14).setValue(status);
      return { success: true };
    }
  }
  throw new Error("Cotización no encontrada.");
}
