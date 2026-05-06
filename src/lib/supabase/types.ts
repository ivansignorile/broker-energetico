import type { Database } from "@/types/database";

export type Tables = Database["public"]["Tables"];
export type Enums  = Database["public"]["Enums"];

export type Profile   = Tables["profiles"]["Row"];
export type Cliente   = Tables["clienti"]["Row"];
export type Fornitore = Tables["fornitori"]["Row"];
export type Contratto = Tables["contratti"]["Row"];
export type Documento = Tables["documenti"]["Row"];

export type Ruolo              = Enums["ruolo"];
export type TipoCliente        = Enums["tipo_cliente"];
export type StatoContratto     = Enums["stato_contratto"];
export type CategoriaContratto = Enums["categoria_contratto"];
export type TipoContratto      = Enums["tipo_contratto"];
export type TipoDocumento      = Enums["tipo_documento"];
