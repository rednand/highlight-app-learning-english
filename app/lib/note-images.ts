export const NOTE_IMAGES_BUCKET = "note-images"
export const MAX_IMAGES_PER_NOTE = 6
/** Tamanho máximo do arquivo que chega ao servidor (depois de comprimido no celular). */
export const MAX_IMAGE_BYTES = 3.5 * 1024 * 1024
/** Lado maior da imagem depois de comprimida. */
export const MAX_IMAGE_SIDE = 1600
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const

const EXTENSIONS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }

export function isAllowedImageType(type: string): boolean {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type)
}

/** Caminho no Storage: a primeira pasta é sempre o id da pessoa (a regra de acesso depende disso). */
export function buildImagePath(userId: string, noteId: string, fileId: string, type: string): string {
  return `${userId}/${noteId}/${fileId}.${EXTENSIONS[type] ?? "jpg"}`
}

/** O caminho pertence a esta pessoa e a esta anotação? */
export function isImagePathOf(path: string, userId: string, noteId: string): boolean {
  const parts = path.split("/")
  return parts.length === 3 && parts[0] === userId && parts[1] === noteId && /^[\w-]+\.(jpg|png|webp)$/.test(parts[2])
}

/** Novas dimensões para caber em maxSide sem distorcer; nunca aumenta a imagem. */
export function fitWithin(width: number, height: number, maxSide = MAX_IMAGE_SIDE): { width: number; height: number } {
  if (width <= 0 || height <= 0) return { width: 0, height: 0 }
  const scale = Math.min(1, maxSide / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}
