import { getAccessToken } from './auth.js';

export interface SheetExportOptions {
  title: string;
  sheetName?: string;
  headers: string[];
  rows: (string | number)[][];
}

export async function exportToGoogleSheets({
  title,
  sheetName = 'Calibration Data',
  headers,
  rows,
}: SheetExportOptions): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('Google account is not authenticated. Please connect Google account first.');
  }

  // 1. Create Spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: `PCS-NISSIN - ${title} (${new Date().toISOString().slice(0, 10)})`,
      },
      sheets: [
        {
          properties: {
            title: sheetName,
            gridProperties: {
              frozenRowCount: 2,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errData = await createRes.json();
    throw new Error(errData.error?.message || 'Failed to create Google Spreadsheet');
  }

  const spreadsheet = await createRes.json();
  const spreadsheetId = spreadsheet.spreadsheetId;
  const sheetId = spreadsheet.sheets[0].properties.sheetId;

  // 2. Prepare Data
  const titleRow = [`PCS-NISSIN Metrology Calibration Management - ${title}`];
  const metadataRow = [`Generated: ${new Date().toLocaleString()} | Total Records: ${rows.length}`];
  const allValues = [titleRow, metadataRow, headers, ...rows];

  // 3. Write Data
  const range = `'${sheetName}'!A1`;
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values: allValues,
      }),
    }
  );

  if (!updateRes.ok) {
    const errData = await updateRes.json();
    throw new Error(errData.error?.message || 'Failed to insert values into Google Spreadsheet');
  }

  // 4. Format Sheet (Header Styling & Auto Widths)
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          // Format Title Row (Row 0)
          {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: headers.length,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.08, green: 0.18, blue: 0.36 }, // Dark Navy
                  textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true, fontSize: 13 },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
          // Format Headers Row (Row 2)
          {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: 2,
                endRowIndex: 3,
                startColumnIndex: 0,
                endColumnIndex: headers.length,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.12, green: 0.53, blue: 0.53 }, // Teal
                  textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true, fontSize: 10 },
                  horizontalAlignment: 'CENTER',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
            },
          },
          // Auto Resize Columns
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: headers.length,
              },
            },
          },
        ],
      }),
    });
  } catch (fmtErr) {
    console.warn('Batch update formatting warning:', fmtErr);
  }

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  return { spreadsheetId, spreadsheetUrl };
}
