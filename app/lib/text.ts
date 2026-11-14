export function foldAccents(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
}

/** Chave para comparar textos: sem acento, minúsculo, apóstrofo reto e espaços normalizados. */
export function textKey(value: string): string {
  return foldAccents(value).replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim()
}
