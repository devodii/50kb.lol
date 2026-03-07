"use client";

import { useState } from "react";
import { saveAs } from "file-saver";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DownloadButton({
  url,
  filename = "compressed.jpg",
  label = "Download",
}: {
  url: string;
  filename?: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      saveAs(blob, filename);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button className="w-full" onClick={handleDownload} disabled={loading}>
      {loading ? <Loader2 className="animate-spin" /> : <Download />}
      {label}
    </Button>
  );
}
