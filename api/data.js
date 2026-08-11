// api/data.js
// Endpoint serverless (Vercel) que lee el Google Sheet privado de San Agustin
// usando una cuenta de servicio con acceso de SOLO LECTURA a Google Sheets API.
//
// Por defecto devuelve un archivo XLSX (mismo formato que ya consume el frontend).
// Con ?format=json devuelve JSON { ok, spreadsheetId, tabs, data }.
//
// No contiene credenciales: todo se toma de variables de entorno de Vercel.
//
// Variables de entorno requeridas:
//   GOOGLE_CLIENT_EMAIL  -> email de la cuenta de servicio
//   GOOGLE_PRIVATE_KEY   -> clave privada de la cuenta de servicio (con \n escapados)
//   SHEET_ID             -> ID del Google Sheet a leer (obligatorio)
//
// La hoja debe estar compartida como "Lector" con GOOGLE_CLIENT_EMAIL.

const { google } = require('googleapis');
const XLSX = require('xlsx');

// Las cinco pestanas que expone el endpoint.
const TABS = ['INVENTARIO', 'COMPRAS', 'VENTAS', 'TRASLADOS', 'RENTABILIDAD'];

// Alcance de SOLO LECTURA.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

function getConfig() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const spreadsheetId = process.env.SHEET_ID;

  const missing = [];
  if (!clientEmail) missing.push('GOOGLE_CLIENT_EMAIL');
  if (!privateKey) missing.push('GOOGLE_PRIVATE_KEY');
  if (!spreadsheetId) missing.push('SHEET_ID');
  if (missing.length) {
    throw new Error('Faltan variables de entorno en Vercel: ' + missing.join(', '));
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: SCOPES,
  });

  return { auth, spreadsheetId };
}

async function readTabs() {
  const { auth, spreadsheetId } = getConfig();
  const sheets = google.sheets({ version: 'v4', auth });

  // Una sola llamada batch para las cinco pestanas.
  const response = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges: TABS,
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING',
  });

  const ranges = response.data.valueRanges || [];
  const data = {};
  TABS.forEach((tab, i) => {
    data[tab] = (ranges[i] && ranges[i].values) || [];
  });

  return { spreadsheetId, data };
}

function buildWorkbook(data) {
  const wb = XLSX.utils.book_new();
  TABS.forEach((tab) => {
    const rows = data[tab] || [];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, tab);
  });
  // Buffer binario del XLSX.
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = async function handler(req, res) {
  try {
    const { spreadsheetId, data } = await readTabs();

    const wantsJson =
      (req.query && String(req.query.format || '').toLowerCase() === 'json');

    if (wantsJson) {
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
      res.status(200).json({ ok: true, spreadsheetId, tabs: TABS, data });
      return;
    }

    // Por defecto: XLSX binario (lo que el frontend ya sabe parsear).
    const buffer = buildWorkbook(data);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'inline; filename="san-agustin.xlsx"');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    res.status(200).send(buffer);
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err.message || 'Error desconocido al leer Google Sheets.',
    });
  }
};
