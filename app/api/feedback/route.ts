import { NextRequest, NextResponse } from "next/server";

import { GoogleSheetsApi } from "@/integrations/google-sheets";

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  const api = new GoogleSheetsApi(process.env.FEEDBACK_SHEET_ID!);

  await api.append("Sheet1!A:B", [[new Date().toISOString(), message?.trim()]]);
  return NextResponse.json({ ok: true });
}
