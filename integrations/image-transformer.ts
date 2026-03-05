"use client";

import * as React from "react";

import { Canvg } from "canvg";
import { heicTo } from "heic-to";

export type TargetFormat = "image/jpeg" | "image/webp" | "image/png";

export interface ProcessOptions {
  format?: TargetFormat;
  quality?: number;
  maxSizeKB?: number;
  resize?: { width?: number; height?: number };
}

const DEFAULT_OPTIONS: Required<Omit<ProcessOptions, "maxSizeKB" | "resize">> =
  {
    format: "image/jpeg",
    quality: 0.9,
  };

export function useImageProcessor() {
  const fileToImage = React.useCallback(
    async (file: File): Promise<HTMLImageElement> => {
      const type = file.type;
      const name = file.name.toLowerCase();

      if (
        type === "image/heic" ||
        type === "image/heif" ||
        name.endsWith(".heic") ||
        name.endsWith(".heif")
      ) {
        const result = await heicTo({ blob: file, type: "image/png" });
        const blob =
          result instanceof Blob
            ? result
            : await (async () => {
                const img = result as ImageBitmap;
                const off = new OffscreenCanvas(img.width, img.height);
                off.getContext("2d")?.drawImage(img, 0, 0);
                return off.convertToBlob();
              })();
        return blobToImage(blob);
      }

      if (type === "image/svg+xml" || name.endsWith(".svg")) {
        const svgText = await file.text();
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Failed to get canvas context");

        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
        const svgEl = svgDoc.documentElement;
        canvas.width =
          parseInt(svgEl.getAttribute("width") ?? "1000", 10) || 1000;
        canvas.height =
          parseInt(svgEl.getAttribute("height") ?? "1000", 10) || 1000;

        const v = await Canvg.from(ctx, svgText);
        await v.render();

        const blob = await new Promise<Blob | null>((res) =>
          canvas.toBlob(res, "image/png"),
        );
        if (!blob) throw new Error("Failed to convert SVG");
        return blobToImage(blob);
      }

      return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve(img);
        };
        img.onerror = reject;
        img.src = url;
      });
    },
    [],
  );

  const processImage = React.useCallback(
    async (file: File, options: ProcessOptions = {}): Promise<File> => {
      const {
        format = DEFAULT_OPTIONS.format,
        quality = DEFAULT_OPTIONS.quality,
        maxSizeKB,
        resize,
      } = options;

      const img = await fileToImage(file);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      let scale = 1.0;
      if (resize?.width) scale = resize.width / img.width;
      else if (resize?.height) scale = resize.height / img.height;

      let currentQuality = quality;
      let resultFile: File | null = null;
      const MAX_ITERATIONS = 8;

      for (let i = 0; i < MAX_ITERATIONS; i++) {
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);

        canvas.width = w;
        canvas.height = h;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        const blob = await new Promise<Blob | null>((res) =>
          canvas.toBlob(res, format, currentQuality),
        );
        if (!blob) throw new Error("Encoding failed");

        const ext = format.split("/")[1].replace("jpeg", "jpg");
        const newName = file.name.replace(/\.[^/.]+$/, "") + `.${ext}`;
        resultFile = new File([blob], newName, { type: format });

        if (!maxSizeKB || resultFile.size / 1024 <= maxSizeKB) break;

        scale *= 0.85;
        currentQuality = Math.max(currentQuality * 0.95, 0.1);
      }

      return resultFile!;
    },
    [fileToImage],
  );

  return { processImage };
}

function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}
