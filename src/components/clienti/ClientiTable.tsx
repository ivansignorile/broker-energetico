"use client";

import Link from "next/link";
import { useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import type { Cliente } from "@/lib/supabase/types";

type Row = Cliente & { commerciale_nome?: string | null };

export function ClientiTable({ rows }: { rows: Row[] }) {
  const columns = useMemo<ColumnDef<Row>[]>(() => [
    {
      accessorKey: "nome",
      header: "Nome",
      cell: ({ row }) => (
        <Link href={`/clienti/${row.original.id}`} className="font-medium hover:underline">
          {row.original.nome}
        </Link>
      ),
    },
    {
      accessorKey: "tipo_cliente",
      header: "Tipo",
      cell: ({ row }) => (
        <Badge variant={row.original.tipo_cliente === "azienda" ? "default" : "secondary"} className="capitalize">
          {row.original.tipo_cliente}
        </Badge>
      ),
    },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "telefono", header: "Telefono" },
    {
      id: "commerciale",
      header: "Commerciale",
      cell: ({ row }) => row.original.commerciale_nome ?? <span className="text-muted-foreground">—</span>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="ghost"
          render={<Link href={`/clienti/${row.original.id}/modifica`}>Modifica</Link>}
        />
      ),
    },
  ], []);
  return <DataTable<Row, unknown> columns={columns} data={rows} />;
}
