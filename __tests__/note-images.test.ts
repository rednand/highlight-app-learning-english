import { describe, it, expect, vi, beforeEach } from "vitest"
import { buildImagePath, fitWithin, isAllowedImageType, isImagePathOf } from "../app/lib/note-images"
import { collectImagePaths, removeStoredImages, signImageUrls } from "../app/lib/note-images-server"
import { addNoteImage, removeNoteImage } from "../app/actions/note-images"

vi.mock("../app/utils/supabase/server", () => ({ createClient: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
import { createClient } from "../app/utils/supabase/server"
import { revalidatePath } from "next/cache"
const mockCreateClient = vi.mocked(createClient)
type MockFn = ReturnType<typeof vi.fn>

describe("regras das imagens", () => {
  it("caminho começa sempre pela pasta da pessoa", () => {
    expect(buildImagePath("u1", "n1", "abc", "image/png")).toBe("u1/n1/abc.png")
    expect(buildImagePath("u1", "n1", "abc", "image/heic")).toBe("u1/n1/abc.jpg")
  })

  it("reconhece só caminhos da pessoa e da anotação", () => {
    expect(isImagePathOf("u1/n1/abc.jpg", "u1", "n1")).toBe(true)
    expect(isImagePathOf("u2/n1/abc.jpg", "u1", "n1")).toBe(false)
    expect(isImagePathOf("u1/n2/abc.jpg", "u1", "n1")).toBe(false)
    expect(isImagePathOf("u1/n1/../x.jpg", "u1", "n1")).toBe(false)
    expect(isImagePathOf("u1/n1/abc.exe", "u1", "n1")).toBe(false)
  })

  it("aceita só JPG, PNG e WebP", () => {
    expect(isAllowedImageType("image/jpeg")).toBe(true)
    expect(isAllowedImageType("image/gif")).toBe(false)
  })

  it("reduz mantendo a proporção e nunca aumenta", () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 1600, height: 1200 })
    expect(fitWithin(1000, 3000)).toEqual({ width: 533, height: 1600 })
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 })
    expect(fitWithin(0, 10)).toEqual({ width: 0, height: 0 })
  })
})

describe("ajudantes do Storage", () => {
  it("junta os caminhos de várias anotações", () => {
    expect(collectImagePaths([{ image_paths: ["a"] }, { image_paths: null }, { image_paths: ["b", "c"] }])).toEqual(["a", "b", "c"])
    expect(collectImagePaths(null)).toEqual([])
  })

  it("apaga em lotes de 100 e não chama nada sem caminhos", async () => {
    const remove = vi.fn().mockResolvedValue({})
    const supa = { storage: { from: vi.fn().mockReturnValue({ remove }) } }
    await removeStoredImages(supa as never, [])
    expect(remove).not.toHaveBeenCalled()
    await removeStoredImages(supa as never, Array.from({ length: 150 }, (_, i) => `p${i}`))
    expect(remove).toHaveBeenCalledTimes(2)
    expect(remove.mock.calls[1][0]).toHaveLength(50)
  })

  it("gera links temporários indexados pelo caminho", async () => {
    const createSignedUrls = vi.fn().mockResolvedValue({ data: [{ path: "a", signedUrl: "https://x/a" }, { path: "b", signedUrl: null }] })
    const supa = { storage: { from: vi.fn().mockReturnValue({ createSignedUrls }) } }
    expect(await signImageUrls(supa as never, ["a", "b"])).toEqual({ a: "https://x/a" })
    expect(await signImageUrls(supa as never, [])).toEqual({})
  })
})

function makeSupa(opts: { user?: unknown; note?: unknown; uploadError?: unknown; updateError?: unknown } = {}) {
  const builder: Record<string, MockFn | unknown> = { error: opts.updateError ?? null }
  for (const m of ["select", "eq", "update"]) builder[m] = vi.fn().mockReturnValue(builder)
  builder.single = vi.fn().mockResolvedValue({ data: "note" in opts ? opts.note : { id: "n1", image_paths: [] } })
  const bucket = { upload: vi.fn().mockResolvedValue({ error: opts.uploadError ?? null }), remove: vi.fn().mockResolvedValue({}) }
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: "user" in opts ? opts.user : { id: "u1" } } }) },
    from: vi.fn().mockReturnValue(builder),
    storage: { from: vi.fn().mockReturnValue(bucket) },
    builder: builder as Record<string, MockFn>,
    bucket,
  }
}

function form(file?: File) {
  const fd = new FormData()
  fd.append("noteId", "n1")
  fd.append("lessonId", "l1")
  if (file) fd.append("file", file)
  return fd
}
const jpg = () => new File([new Uint8Array(10)], "foto.jpg", { type: "image/jpeg" })

describe("addNoteImage", () => {
  beforeEach(() => vi.clearAllMocks())

  it("valida o arquivo antes de tocar no banco", async () => {
    await expect(addNoteImage(form())).rejects.toThrow("Nenhuma imagem")
    await expect(addNoteImage(form(new File(["x"], "a.gif", { type: "image/gif" })))).rejects.toThrow("Formato")
    const big = new File([new Uint8Array(4 * 1024 * 1024)], "a.jpg", { type: "image/jpeg" })
    await expect(addNoteImage(form(big))).rejects.toThrow("grande demais")
    expect(mockCreateClient).not.toHaveBeenCalled()
  })

  it("exige usuário e anotação dele", async () => {
    mockCreateClient.mockResolvedValue(makeSupa({ user: null }) as never)
    await expect(addNoteImage(form(jpg()))).rejects.toThrow("Não autenticado")
    const supa = makeSupa({ note: null })
    mockCreateClient.mockResolvedValue(supa as never)
    await expect(addNoteImage(form(jpg()))).rejects.toThrow("Anotação não encontrada")
    expect(supa.builder.eq).toHaveBeenCalledWith("user_id", "u1")
    expect(supa.bucket.upload).not.toHaveBeenCalled()
  })

  it("respeita o limite de imagens por anotação", async () => {
    mockCreateClient.mockResolvedValue(makeSupa({ note: { id: "n1", image_paths: ["1", "2", "3", "4", "5", "6"] } }) as never)
    await expect(addNoteImage(form(jpg()))).rejects.toThrow("até 6")
  })

  it("envia para a pasta da pessoa e guarda o caminho na anotação", async () => {
    const supa = makeSupa({ note: { id: "n1", image_paths: ["u1/n1/old.jpg"] } })
    mockCreateClient.mockResolvedValue(supa as never)
    const { path } = await addNoteImage(form(jpg()))
    expect(path).toMatch(/^u1\/n1\/[\w-]+\.jpg$/)
    expect(supa.bucket.upload).toHaveBeenCalledWith(path, expect.any(File), { contentType: "image/jpeg", upsert: false })
    expect(supa.builder.update).toHaveBeenCalledWith({ image_paths: ["u1/n1/old.jpg", path] })
    expect(revalidatePath).toHaveBeenCalledWith("/lessons/l1")
  })

  it("falha no envio não mexe na anotação", async () => {
    const supa = makeSupa({ uploadError: { message: "x" } })
    mockCreateClient.mockResolvedValue(supa as never)
    await expect(addNoteImage(form(jpg()))).rejects.toThrow("Não foi possível enviar")
    expect(supa.builder.update).not.toHaveBeenCalled()
  })

  it("se salvar o caminho falhar, apaga o arquivo enviado", async () => {
    const supa = makeSupa({ updateError: { message: "falhou" } })
    mockCreateClient.mockResolvedValue(supa as never)
    await expect(addNoteImage(form(jpg()))).rejects.toThrow("falhou")
    expect(supa.bucket.remove).toHaveBeenCalledTimes(1)
  })
})

describe("removeNoteImage", () => {
  beforeEach(() => vi.clearAllMocks())

  it("recusa caminho de outra pessoa ou que não está na anotação", async () => {
    mockCreateClient.mockResolvedValue(makeSupa({ note: { id: "n1", image_paths: ["u1/n1/a.jpg"] } }) as never)
    await expect(removeNoteImage("n1", "l1", "u2/n1/a.jpg")).rejects.toThrow("Imagem não encontrada")
    await expect(removeNoteImage("n1", "l1", "u1/n1/b.jpg")).rejects.toThrow("Imagem não encontrada")
  })

  it("tira o caminho da anotação e apaga o arquivo", async () => {
    const supa = makeSupa({ note: { id: "n1", image_paths: ["u1/n1/a.jpg", "u1/n1/b.jpg"] } })
    mockCreateClient.mockResolvedValue(supa as never)
    await removeNoteImage("n1", "l1", "u1/n1/a.jpg")
    expect(supa.builder.update).toHaveBeenCalledWith({ image_paths: ["u1/n1/b.jpg"] })
    expect(supa.bucket.remove).toHaveBeenCalledWith(["u1/n1/a.jpg"])
  })

  it("propaga erro do banco sem apagar o arquivo", async () => {
    const supa = makeSupa({ note: { id: "n1", image_paths: ["u1/n1/a.jpg"] }, updateError: { message: "falhou" } })
    mockCreateClient.mockResolvedValue(supa as never)
    await expect(removeNoteImage("n1", "l1", "u1/n1/a.jpg")).rejects.toThrow("falhou")
    expect(supa.bucket.remove).not.toHaveBeenCalled()
  })
})
