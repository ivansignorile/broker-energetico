"use client";

import { useTransition } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Fetcher = () => Promise<{ url: string } | { error: string }>;

export function PdfDownloadButton({ getUrl, label = "Scarica PDF" }: { getUrl: Fetcher; label?: string }) {
  const [pending, start] = useTransition();
  function onClick() {
    start(async () => {
      const r = await getUrl();
      if ("url" in r) window.open(r.url, "_blank");
      else toast.error(r.error);
    });
  }
  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={pending}>
      <Download className="mr-2 h-4 w-4" /> {pending ? "Apertura..." : label}
    </Button>
  );
}
