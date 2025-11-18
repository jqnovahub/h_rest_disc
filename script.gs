function doGet(e) {
  return jsonResponse({
    success: true,
    message: "H Restaurant DISC Web App is running",
    hint: "POST requests should use action=create or action=redeem"
  });
}

// CONFIGURACIÓN
// Nombre del sheet (la pestaña dentro del documento)
const SHEET_NAME = "Sheet1";

// Por si en tu Apps Script está vinculado a H_DISC_APP directamente, no necesitas abrir otro.
// SpreadsheetApp.getActiveSpreadsheet() ya apunta al documento correcto.

const DISCOUNT_PERCENT = 15;
const INCLUDE_DRINKS = "NO";

// Manejo de la petición POST desde el frontend
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.action === "create") {
      const result = createGiftCard(data);
      return jsonResponse(result);

    } else if (data.action === "redeem") {
      const result = redeemGiftCard(data);
      return jsonResponse(result);

    } else {
      return jsonResponse({ success: false, message: "Acción no válida." });
    }

  } catch (err) {
    Logger.log(err);
    return jsonResponse({
      success: false,
      message: "Error procesando la solicitud."
    });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Crear nuevo registro
function createGiftCard(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);

  const nombre = (data.nombre || "").trim();
  const telefono = (data.telefono || "").trim();

  if (!nombre || !telefono) {
    return { success: false, message: "Nombre y teléfono son requeridos." };
  }

  const codigo = generateCode();
  const now = new Date();

  const row = [
    now,               // timestamp_creacion
    nombre,            // nombre
    telefono,          // telefono
    codigo,            // codigo
    DISCOUNT_PERCENT,  // descuento_porcentaje
    INCLUDE_DRINKS,    // incluye_bebidas
    "NO",              // canjeado
    "",                // fecha_canje
    ""                 // notas
  ];

  sheet.appendRow(row);

  return {
    success: true,
    codigo: codigo,
    nombre: nombre,
    telefono: telefono
  };
}

// Redimir un descuento
function redeemGiftCard(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);

  const term = (data.term || "").trim().toLowerCase();
  if (!term) {
    return { success: false, message: "Término de búsqueda vacío." };
  }

  const range = sheet.getDataRange();
  const values = range.getValues();

  for (let i = 1; i < values.length; i++) {
    const row = values[i];

    const nombre = String(row[1] || "").toLowerCase();
    const telefono = String(row[2] || "").toLowerCase();
    const codigo = String(row[3] || "").toLowerCase();
    const canjeado = String(row[6] || "").toUpperCase();

    const match =
      nombre.includes(term) ||
      telefono.includes(term) ||
      codigo.includes(term);

    if (match) {
      if (canjeado === "SI") {
        return {
          success: false,
          message: "Este registro ya fue canjeado."
        };
      }

      const rowIndex = i + 1;
      const now = new Date();

      sheet.getRange(rowIndex, 7).setValue("SI");
      sheet.getRange(rowIndex, 8).setValue(now);

      return {
        success: true,
        nombre: row[1],
        telefono: row[2],
        codigo: row[3]
      };
    }
  }

  return {
    success: false,
    message: "No se encontró ningún cliente o código con ese dato."
  };
}

// Generar código único
function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    const idx = Math.floor(Math.random() * chars.length);
    code += chars.charAt(idx);
  }
  return "H-" + code;
}

