// api/data.js
// Serverless endpoint (Vercel) que lee el Google Sheet privado de San Agustin
// usando una cuenta de servicio con acceso de SOLO LECTURA a Google Sheets API.
//
// No contiene credenciales: todo se toma de variables de entorno de Vercel.
//
// Variables de entorno requeridas:
//   GOOGLE_CLIENT_EMAIL  -> email de la cuenta de servicio
//   GOOGLE_PRIVATE_KEY   -> clave privada de la cuenta de servicio (con \n escapados)
//   SHEET_ID             -> (opcional) sobreescribe el ID por defecto
//
// La hoja debe estar compartida como "Lector" con GOOGLE_CLIENT_EMAIL.

const { google } = require('googleapis');

const DEFAULT_SHEET_ID = '1ZcfeaYXmR0WwuBPvCTyqqPOi6mVrJJr3c1s36Dz_LMc';

// Las cinco pestanas que expone el endpoint.
const TABS = ['INVENTARIO', 'COMPRAS', 'VENTAS', 'TRASLADOS', 'RENTABILIDAD'];

// Alcance de SOLO LECTURA.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

function getAuth() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error(
      'Faltan credenciales: define GOOGLE_CLIENT_EMAIL y GOOGLE_PRIVATE_KEY en Vercel.'
    );
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: SCOPES,
  });
}

module.exports = async function handler(req, res) {
  try {
    const spreadsheetId = process.env.SHEET_ID || DEFAULT_SHEET_ID;
    const auth = getAuth();
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

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    res.status(200).json({
      ok: true,
      spreadsheetId,
      tabs: TABS,
      data,
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err.message || 'Error desconocido al leer Google Sheets.',
    });
  }
};
