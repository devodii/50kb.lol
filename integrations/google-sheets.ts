import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

export class GoogleSheetsApi {
  private sheetId: string;

  constructor(sheetId: string) {
    this.sheetId = sheetId;
  }

  private getAuth() {
    const credentials = JSON.parse(
      Buffer.from(
        process.env.GSHEETS_SERVICE_ACCOUNT_KEY_B64!,
        "base64",
      ).toString("utf-8"),
    );

    return new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
  }

  async append(range: string, values: unknown[][]) {
    const auth = this.getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId: this.sheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });
  }
}
