import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

import { FileUploadApi } from "@/integrations/file-upload";

const TARGET_KB = 48;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const compressed = await compressToTarget(buffer, TARGET_KB);

  const compressedFile = new File([compressed], "compressed.jpg", {
    type: "image/jpeg",
  });

  const api = new FileUploadApi();
  const urls = await api.upload([compressedFile]);

  if (!urls || urls.length === 0) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  return NextResponse.json({
    url: urls[0],
    originalSize: file.size,
    compressedSize: compressed.byteLength,
  });
}

async function compressToTarget(
  buffer: Buffer,
  maxKB: number,
): Promise<Buffer> {
  const targetBytes = maxKB * 1024;
  const meta = await sharp(buffer).metadata();
  const originalWidth = meta.width ?? 800;

  // Phase 1: quality reduction only
  for (let quality = 85; quality >= 20; quality -= 10) {
    const result = await sharp(buffer).jpeg({ quality }).toBuffer();
    if (result.byteLength <= targetBytes) return result;
  }

  // Phase 2: scale + quality
  for (let scale = 0.85; scale >= 0.2; scale -= 0.1) {
    const width = Math.round(originalWidth * scale);
    const result = await sharp(buffer)
      .resize({ width, withoutEnlargement: true })
      .jpeg({ quality: 70 })
      .toBuffer();
    if (result.byteLength <= targetBytes) return result;
  }

  // Last resort
  return sharp(buffer)
    .resize({ width: Math.round(originalWidth * 0.15), withoutEnlargement: true })
    .jpeg({ quality: 20 })
    .toBuffer();
}
