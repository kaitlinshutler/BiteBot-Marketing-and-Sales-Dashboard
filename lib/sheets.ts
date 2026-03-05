// ============================================================================
// Google Sheets API Client
// ============================================================================

import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

let sheetsClient: ReturnType<typeof google.sheets> | null = null;

export async function getSheetsClient() {
  if (sheetsClient) return sheetsClient;

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: SCOPES,
  });

  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

export async function getSheetData(sheetName: string): Promise<string[][]> {
  const sheets = await getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

  if (!spreadsheetId) {
    throw new Error('GOOGLE_SPREADSHEET_ID not configured');
  }

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:Z`,
  });

  return response.data.values || [];
}

// Parse sheet data into typed objects
export function parseSheetRows<T>(
  rows: string[][],
  headerMap: Record<string, keyof T>
): T[] {
  if (rows.length < 2) return [];

  const headers = rows[0];
  const headerIndices: Record<string, number> = {};

  headers.forEach((h, i) => {
    const key = h?.toLowerCase().trim();
    if (key) headerIndices[key] = i;
  });

  return rows.slice(1).map((row) => {
    const obj: Partial<T> = {};
    for (const [sheetCol, objKey] of Object.entries(headerMap)) {
      const idx = headerIndices[sheetCol.toLowerCase()];
      if (idx !== undefined) {
        const val = row[idx];
        // Try to parse numbers
        const num = parseFloat(val);
        (obj as Record<string, unknown>)[objKey as string] = isNaN(num) ? val || '' : num;
      }
    }
    return obj as T;
  });
}
