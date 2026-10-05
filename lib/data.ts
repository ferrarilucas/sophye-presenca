import "server-only";
import { createClient } from "@supabase/supabase-js";

export type Rsvp = {
  id: string;
  grupo: string;
  nome: string;
  vai: boolean;
  titular: boolean;
  mensagem: string | null;
  created_at: string;
};

// O convite só tem permissão de INSERT (anon). Para ler, usamos a service role no servidor.
export async function getRsvps(): Promise<Rsvp[]> {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await sb
    .from("rsvps")
    .select("id, grupo, nome, vai, titular, mensagem, created_at")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data as Rsvp[];
}
