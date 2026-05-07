// src/components/contratti/ContrattiTable.tsx
"use client";

import Link from "next/link";
import { useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/DataTable";
import { ContrattoStatoBadge } from "./ContrattoStatoBadge";
import { ScadenzaBadge } from "@/components/shared/ScadenzaBadge";
import type { Contratto } from "@/lib/supabase/types";

type Row = Contratto & { cliente_nome?: string | null; fornitore_nome?: string | null };

export function ContrattiTable({ rows }: { rows: Row[] }) {
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
    { accessorKey: "fornitore_nome", header: "Fornitore" },
    { accessorKey: "categoria", header: "Categoria" },
    { accessorKey: "tipo", header: "Tipo" },
    {
      accessorKey: "stato",
      header: "Stato",
      cell: ({ row }) => <ContrattoStatoBadge stato={row.original.stato} />,
    },
    {
      accessorKey: "data_scadenza",
      header: "Scadenza",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="text-sm">{row.original.data_scadenza}</span>
          {row.original.stato === "attivo" && <ScadenzaBadge data={row.original.data_scadenza} />}
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Link href={`/contratti/${row.original.id}`} className="text-sm text-primary hover:underline">
          Dettagli
        </Link>
      ),
    },
  ], []);
  return <DataTable<Row, unknown> columns={columns} data={rows} />;
}
