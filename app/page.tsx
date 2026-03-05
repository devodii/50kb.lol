"use client";

import * as React from "react";
import Image from "next/image";

import { Download, Github, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { FileUpload, type FileWithPreview } from "@/components/file-upload";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type Status = "idle" | "converting" | "done" | "error";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface Result {
  url: string;
  originalSize: number;
  compressedSize: number;
}

function formatKB(bytes: number) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default function Home() {
  const [file, setFile] = React.useState<FileWithPreview | null>(null);
  const [status, setStatus] = React.useState<Status>("idle");
  const [result, setResult] = React.useState<Result | null>(null);

  const handleFilesChange = (files: FileWithPreview[]) => {
    setFile(files[0] ?? null);
    setStatus("idle");
    setResult(null);
  };

  const handleConvert = async () => {
    if (!file) return;
    setStatus("converting");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/compress", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Compression failed");
      }

      const data: Result = await res.json();
      setResult(data);
      setStatus("done");
      toast.success("Compressed successfully.");
    } catch (err) {
      setStatus("error");
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const handleReset = () => {
    setFile(null);
    setStatus("idle");
    setResult(null);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 space-y-0.5">
            <Image
              src="/logo.png"
              alt="50kb.lol"
              width={96}
              height={96}
              className="size-24 shrink-0"
              priority
            />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                50kb.lol
              </h1>
              <p className="text-sm text-muted-foreground">
                Compress images to under 50KB, instantly.
              </p>
            </div>
          </div>
          <a
            href="https://github.com/devodii/50kb.lol"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="mt-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Github className="size-5" />
          </a>
        </div>

        <Alert>
          <Info className="size-4" />
          <AlertTitle>Why this exists</AlertTitle>
          <AlertDescription>
            Built for students whose school portals only accept images under
            50KB. but most online resizers leave files at 100KB+ or only accepts
            specific file types.
          </AlertDescription>
        </Alert>

        <FileUpload
          value={file ? [file] : []}
          onFilesChange={handleFilesChange}
          placeholder="Drop your image here, or click to select"
          description="Supports JPG, PNG, WebP, HEIC, SVG"
          accept={{
            "image/*": [
              ".jpg",
              ".jpeg",
              ".png",
              ".webp",
              ".heic",
              ".heif",
              ".svg",
            ],
          }}
          showReplaceButtonOnHover={!!file}
          actions={
            file ? (
              <>
                <span className="max-w-[60%] truncate text-xs">
                  {file.name}
                </span>
                <span className="text-xs">{formatKB(file.size)}</span>
              </>
            ) : undefined
          }
          maxSize={MAX_FILE_SIZE}
        />

        {file && status !== "done" && (
          <Button
            className="w-full"
            onClick={handleConvert}
            disabled={status === "converting"}
          >
            {status === "converting" ? (
              <>
                <Loader2 className="animate-spin" />
                Compressing&hellip;
              </>
            ) : (
              "Convert & Compress"
            )}
          </Button>
        )}

        {status === "done" && result && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Original</span>
              <span className="font-medium">
                {formatKB(result.originalSize)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Compressed</span>
              <span className="font-semibold">
                {formatKB(result.compressedSize)}
              </span>
            </div>
            <Button className="w-full" asChild>
              <a href={result.url} download="compressed.jpg">
                <Download />
                Download ({formatKB(result.compressedSize)})
              </a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={handleReset}
            >
              Convert another
            </Button>
          </div>
        )}
      </div>

      <footer className="mt-12 text-sm text-muted-foreground">
        Built with ♥ by{" "}
        <a
          href="https://www.linkedin.com/in/emmanuelodii/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-foreground transition-colors"
        >
          devodii
        </a>
      </footer>
    </div>
  );
}
