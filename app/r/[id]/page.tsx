import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { DownloadButton } from "@/components/download-button";
import { formatKB } from "@/lib/utils";

async function getSize(url: string): Promise<number> {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return Number(res.headers.get("content-length") ?? 0);
  } catch {
    return 0;
  }
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const origin = process.env.NEXT_PUBLIC_UT_APP_ORIGIN;

  if (!origin) notFound();

  const url = `${origin}/f/${id}`;
  const size = await getSize(url);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold tracking-tight">
            Compressed image
          </h1>
          {size > 0 && (
            <p className="text-sm text-muted-foreground">
              {formatKB(size)} — ready to download
            </p>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border bg-card">
          <Image
            src={url}
            alt="Compressed image"
            width={500}
            height={375}
            className="h-auto w-full object-contain"
            unoptimized
            priority
          />
        </div>

        <DownloadButton
          url={url}
          filename="compressed.jpg"
          label={size > 0 ? `Download (${formatKB(size)})` : "Download"}
        />

        <p className="text-center text-sm text-muted-foreground">
          Compressed with{" "}
          <Link
            href="/"
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            50kb.lol
          </Link>
        </p>
      </div>
    </div>
  );
}
