import { fitWithin, isAllowedImageType, MAX_IMAGE_SIDE } from "../../app/lib/note-images"

const KEEP_AS_IS_BYTES = 500 * 1024
const JPEG_QUALITY = 0.82

/**
 * Reduz a foto no próprio celular antes de enviar: lado maior de até 1600px,
 * em JPEG. Imagens pequenas e já aceitas seguem como estão.
 */
export async function compressImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file)
  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height, MAX_IMAGE_SIDE)
    const fits = width === bitmap.width && height === bitmap.height
    if (fits && file.size <= KEEP_AS_IS_BYTES && isAllowedImageType(file.type)) return file

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Não foi possível preparar a imagem")
    ctx.fillStyle = "#ffffff" // fundo branco para PNG com transparência
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(bitmap, 0, 0, width, height)

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY))
    if (!blob) throw new Error("Não foi possível preparar a imagem")
    const name = file.name.replace(/\.[^.]+$/, "") || "imagem"
    return new File([blob], `${name}.jpg`, { type: "image/jpeg" })
  } finally {
    bitmap.close()
  }
}
