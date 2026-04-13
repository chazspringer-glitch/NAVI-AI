import { supabase } from "./supabase";

export interface Client {
  id: string;
  name: string;
  email: string;
  business_name: string;
  service_type: string;
  created_at: string;
}

/**
 * Fetch all clients, newest first.
 */
export async function fetchClients(): Promise<Client[]> {
  console.log("[Supabase] Fetching clients...");
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Supabase] fetchClients error:", error.message);
    return [];
  }

  console.log("[Supabase] Fetched", data?.length ?? 0, "clients successfully");
  return data ?? [];
}

/**
 * Create a new client record.
 */
export async function createClient(client: Omit<Client, "id" | "created_at">): Promise<Client | null> {
  console.log("[Supabase] Inserting client:", client.name);
  const { data, error } = await supabase
    .from("clients")
    .insert(client)
    .select()
    .single();

  if (error) {
    console.error("[Supabase] createClient error:", error.message);
    return null;
  }

  console.log("[Supabase] Client inserted successfully:", data.id);
  return data;
}
