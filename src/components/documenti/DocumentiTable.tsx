// src/components/documenti/DocumentiTable.tsx
"use client";

import Link from "next/link";
import { useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/DataTable";
import { ScadenzaBadge } from "@/components/shared/ScadenzaBadge";
import type { Documento } from "@/lib/supabase/types";

type Row = Documento & { cliente_nome?: string | null };

export function DocumentiTable({ rows }: { rows: Row[] }) {
  const columns = useMemo<ColumnDef<Row>[]>(() => [
    {
      accessorKey: "cliente_nome",
      header: "Cliente",
      cell: ({ row }) => (
        <Link href={`/clienti/${row.original.cliente_id}`} className="font-medium hover:underline">
          {row.original.cliente_nome ?? "—"}
        </Link>
      ),
    },
    { accessorKey: "tipo", header: "Tipo", cell: ({ row }) => <span className="capitalize">{row.original.tipo.replace(/_/g, " ")}</span> },
    { accessorKey: "descrizione", header: "Descrizione" },
    {
      accessorKey: "data_scadenza",
      header: "Scadenza",
      cell: ({ row }) => row.original.data_scadenza ? (
        <div className="flex items-center gap-2">
          <span className="text-sm">{row.original.data_scadenza}</span>
          <ScadenzaBadge data={row.original.data_scadenza} />
        </div>
      ) : <span className="text-muted-foreground">—</span>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Link href={`/documenti/${row.original.id}/modifica`} className="text-sm text-primary hover:underline">
          Modifica
        </Link>
      ),
    },
  ], []);
  return <DataTable<Row, unknown> columns={columns} data={rows} />;
}
