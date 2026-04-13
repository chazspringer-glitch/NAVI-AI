import { supabase } from "./supabase";

export interface ContentUpload {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  public_url: string;
  created_at: string;
}

const BUCKET = "content-uploads";

/**
 * Upload a file to Supabase Storage and record metadata.
 */
export async function uploadContent(
  file: File,
  userId: string,
): Promise<ContentUpload | null> {
  const ext = file.name.split(".").pop() || "bin";
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  console.log("[uploads] Uploading", file.name, "→", path);

  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (storageError) {
    console.error("[uploads] Storage error:", storageError.message);
    return null;
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = urlData.publicUrl;

  console.log("[uploads] File stored, public URL:", publicUrl);

  const { data, error: dbError } = await supabase
    .from("content_uploads")
    .insert({
      user_id: userId,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_path: path,
      public_url: publicUrl,
    })
    .select()
    .single();

  if (dbError) {
    console.error("[uploads] DB insert error:", dbError.message);
    return null;
  }

  console.log("[uploads] Upload recorded:", data.id);
  return data;
}

/**
 * Fetch all uploads for a user, newest first.
 */
export async function fetchUploads(userId: string): Promise<ContentUpload[]> {
  const { data, error } = await supabase
    .from("content_uploads")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[uploads] fetchUploads error:", error.message);
    return [];
  }

  return data ?? [];
}
