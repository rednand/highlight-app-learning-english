import type { SupabaseClient } from "@supabase/supabase-js"
import { NOTE_IMAGES_BUCKET } from "./note-images"

/** Junta os caminhos de imagens de várias anotações. */
export function collectImagePaths(rows: { image_paths: string[] | null }[] | null | undefined): string[] {
  return (rows ?? []).flatMap((row) => row.image_paths ?? [])
}

/** Apaga arquivos do Storage. Falha aqui não deve impedir a exclusão do conteúdo. */
export async function removeStoredImages(supabase: SupabaseClient, paths: string[]): Promise<void> {
  if (paths.length === 0) return
  for (let i = 0; i < paths.length; i += 100) {
    await supabase.storage.from(NOTE_IMAGES_BUCKET).remove(paths.slice(i, i + 100))
  }
}

/** Links temporários (24h) para mostrar as imagens privadas; se vencerem, a tela recarrega. */
export async function signImageUrls(supabase: SupabaseClient, paths: string[], expiresIn = 24 * 60 * 60): Promise<Record<string, string>> {
  if (paths.length === 0) return {}
  const { data } = await supabase.storage.from(NOTE_IMAGES_BUCKET).createSignedUrls(paths, expiresIn)
  const urls: Record<string, string> = {}
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) urls[item.path] = item.signedUrl
  }
  return urls
}
