# Backend - API de datos (San Agustin)

Endpoint serverless para Vercel que expone el Google Sheet privado de San Agustin
a traves de la Google Sheets API con acceso de **solo lectura**.

> Este README documenta unicamente el backend (\`/api\`). La documentacion del
> dashboard (frontend) sigue en el \`README.md\` de la raiz y no se modifico.

## Endpoint

\`GET /api/data\`

Devuelve un JSON con las cinco pestanas del Sheet:

\`\`\`json
{
  "ok": true,
  "spreadsheetId": "...",
  "tabs": ["INVENTARIO", "COMPRAS", "VENTAS", "TRASLADOS", "RENTABILIDAD"],
  "data": {
    "INVENTARIO": [[...filas...]],
    "COMPRAS": [[...]],
    "VENTAS": [[...]],
    "TRASLADOS": [[...]],
    "RENTABILIDAD": [[...]]
  }
}
\`\`\`

En caso de error devuelve \`{ "ok": false, "error": "..." }\` con codigo 500.

## Como funciona

- Usa la libreria \`googleapis\` con un cliente JWT de **cuenta de servicio**.
- Alcance: \`https://www.googleapis.com/auth/spreadsheets.readonly\` (solo lectura).
- Lee las cinco pestanas en una sola llamada \`spreadsheets.values.batchGet\`.
- La hoja permanece **privada**: no se publica ni se cambian permisos publicos.

## Variables de entorno (configurar en Vercel)

| Variable | Descripcion |
|----------|-------------|
| \`GOOGLE_CLIENT_EMAIL\` | Email de la cuenta de servicio. |
| \`GOOGLE_PRIVATE_KEY\` | Clave privada de la cuenta de servicio (saltos de linea como \\n). |
| \`SHEET_ID\` | (Opcional) ID del Sheet; ya hay uno por defecto en el codigo. |

Ver \`.env.example\` para la plantilla. **Nunca** subas credenciales reales al repositorio.

## Configuracion de la cuenta de servicio

1. En Google Cloud Console crea (o usa) un proyecto y habilita **Google Sheets API**.
2. Crea una **cuenta de servicio** y genera una clave JSON.
3. Comparte el Google Sheet con el email de la cuenta de servicio con rol **Lector**.
4. En Vercel (Project Settings -> Environment Variables) agrega \`GOOGLE_CLIENT_EMAIL\`
   y \`GOOGLE_PRIVATE_KEY\` con los valores del JSON. Redeploy.

## Notas

- \`vercel.json\` conserva el sitio estatico (sin build); las funciones en \`/api\`
  se detectan automaticamente por Vercel.
