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
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[clients] fetchClients error:", error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Create a new client record.
 */
export async function createClient(client: Omit<Client, "id" | "created_at">): Promise<Client | null> {
  const { data, error } = await supabase
    .from("clients")
    .insert(client)
    .select()
    .single();

  if (error) {
    console.error("[clients] createClient error:", error.message);
    return null;
  }

  return data;
}
