"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportClientiButton({ params }: { params: Record<string, string> }) {
  function onClick() {
    const qs = new URLSearchParams(params).toString();
    window.location.href = `/clienti/export${qs ? "?" + qs : ""}`;
  }
  return (
    <Button onClick={onClick} variant="outline">
      <Download className="mr-2 h-4 w-4" /> Esporta CSV
    </Button>
  );
}
