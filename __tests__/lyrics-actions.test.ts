import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { fetchLyrics } from "../app/actions/lyrics"
import { cleanTrackTitle, cleanArtistName, pickLyrics } from "../app/lib/lyrics-utils"

vi.mock("../app/utils/supabase/server", () => ({ createClient: vi.fn() }))

import { createClient } from "../app/utils/supabase/server"

const mockCreateClient = vi.mocked(createClient)

function makeSupabase(user: unknown, lesson: unknown) {
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    single: vi.fn().mockResolvedValue({ data: lesson, error: null }),
  }
  builder.select.mockReturnValue(builder)
  builder.eq.mockReturnValue(builder)
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from: vi.fn().mockReturnValue(builder),
    builder,
  }
}

function jsonResponse(ok: boolean, body: unknown) {
  return Promise.resolve({ ok, status: ok ? 200 : 500, json: () => Promise.resolve(body) } as Response)
}

const song = { title: "Yellow (Remastered 2020)", music_artist: "Coldplay", source_type: "music" }

describe("cleanTrackTitle", () => {
  it("remove parênteses, colchetes e participações", () => {
    expect(cleanTrackTitle("Yellow (Remastered 2020)")).toBe("Yellow")
    expect(cleanTrackTitle("Stay [Live]")).toBe("Stay")
    expect(cleanTrackTitle("Señorita feat. Camila Cabello")).toBe("Señorita")
  })

  it("remove sufixos de versão depois de hífen", () => {
    expect(cleanTrackTitle("Hey Jude - Remastered 2015")).toBe("Hey Jude")
    expect(cleanTrackTitle("Say It Ain't So - Live Version")).toBe("Say It Ain't So")
  })

  it("mantém títulos com hífen que não são versão", () => {
    expect(cleanTrackTitle("Anti-Hero")).toBe("Anti-Hero")
    expect(cleanTrackTitle("Stayin' Alive - Bee Gees")).toBe("Stayin' Alive - Bee Gees")
  })
})

describe("cleanArtistName", () => {
  it("remove participações", () => {
    expect(cleanArtistName("Drake feat. Rihanna")).toBe("Drake")
    expect(cleanArtistName("Calvin Harris ft. Dua Lipa")).toBe("Calvin Harris")
  })

  it("não quebra nomes com vírgula, &, X ou que começam com feat", () => {
    expect(cleanArtistName("Tyler, The Creator")).toBe("Tyler, The Creator")
    expect(cleanArtistName("Earth, Wind & Fire")).toBe("Earth, Wind & Fire")
    expect(cleanArtistName("Lil Nas X")).toBe("Lil Nas X")
    expect(cleanArtistName("Feather")).toBe("Feather")
  })
})

describe("pickLyrics", () => {
  it("devolve a primeira letra não instrumental", () => {
    expect(pickLyrics([
      { plainLyrics: "", instrumental: false },
      { plainLyrics: "la la", instrumental: true },
      { plainLyrics: "Look at the stars", instrumental: false },
    ])).toBe("Look at the stars")
  })

  it("devolve null para resposta inválida", () => {
    expect(pickLyrics(null)).toBeNull()
    expect(pickLyrics({})).toBeNull()
    expect(pickLyrics([{ plainLyrics: null }])).toBeNull()
  })
})

describe("fetchLyrics", () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
    mockCreateClient.mockReset()
  })

  it("exige usuário autenticado", async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null, song) as never)
    expect(await fetchLyrics("l1")).toEqual({ error: "unavailable" })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("recusa quando a mídia não é música ou não é do usuário", async () => {
    mockCreateClient.mockResolvedValue(makeSupabase({ id: "u1" }, { ...song, source_type: "movie" }) as never)
    expect(await fetchLyrics("l1")).toEqual({ error: "not_music" })

    mockCreateClient.mockResolvedValue(makeSupabase({ id: "u1" }, null) as never)
    expect(await fetchLyrics("l1")).toEqual({ error: "not_music" })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("filtra a aula pelo dono", async () => {
    const supa = makeSupabase({ id: "u1" }, song)
    mockCreateClient.mockResolvedValue(supa as never)
    fetchMock.mockReturnValueOnce(jsonResponse(true, [{ plainLyrics: "Look at the stars" }]))
    await fetchLyrics("l1")
    expect(supa.builder.eq).toHaveBeenCalledWith("id", "l1")
    expect(supa.builder.eq).toHaveBeenCalledWith("user_id", "u1")
  })

  it("busca por título e artista limpos", async () => {
    mockCreateClient.mockResolvedValue(makeSupabase({ id: "u1" }, song) as never)
    fetchMock.mockReturnValueOnce(jsonResponse(true, [{ plainLyrics: "Look at the stars" }]))
    expect(await fetchLyrics("l1")).toEqual({ lyrics: "Look at the stars" })
    const url = new URL(fetchMock.mock.calls[0][0])
    expect(url.origin + url.pathname).toBe("https://lrclib.net/api/search")
    expect(url.searchParams.get("track_name")).toBe("Yellow")
    expect(url.searchParams.get("artist_name")).toBe("Coldplay")
  })

  it("cai para a busca livre quando a busca exata não acha", async () => {
    mockCreateClient.mockResolvedValue(makeSupabase({ id: "u1" }, song) as never)
    fetchMock
      .mockReturnValueOnce(jsonResponse(true, []))
      .mockReturnValueOnce(jsonResponse(true, [{ plainLyrics: "Look at the stars" }]))
    expect(await fetchLyrics("l1")).toEqual({ lyrics: "Look at the stars" })
    const url = new URL(fetchMock.mock.calls[1][0])
    expect(url.searchParams.get("q")).toBe("Yellow Coldplay")
  })

  it("usa só a busca livre quando não há artista", async () => {
    mockCreateClient.mockResolvedValue(makeSupabase({ id: "u1" }, { ...song, music_artist: null }) as never)
    fetchMock.mockReturnValueOnce(jsonResponse(true, [{ plainLyrics: "Look at the stars" }]))
    expect(await fetchLyrics("l1")).toEqual({ lyrics: "Look at the stars" })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get("q")).toBe("Yellow")
  })

  it("retorna not_found quando nenhuma busca acha", async () => {
    mockCreateClient.mockResolvedValue(makeSupabase({ id: "u1" }, song) as never)
    fetchMock.mockReturnValue(jsonResponse(true, []))
    expect(await fetchLyrics("l1")).toEqual({ error: "not_found" })
  })

  it("tenta a busca livre mesmo se a busca exata falhar", async () => {
    mockCreateClient.mockResolvedValue(makeSupabase({ id: "u1" }, song) as never)
    fetchMock
      .mockReturnValueOnce(jsonResponse(false, {}))
      .mockReturnValueOnce(jsonResponse(true, [{ plainLyrics: "Look at the stars" }]))
    expect(await fetchLyrics("l1")).toEqual({ lyrics: "Look at the stars" })
  })

  it("passa um timeout para a requisição", async () => {
    mockCreateClient.mockResolvedValue(makeSupabase({ id: "u1" }, song) as never)
    fetchMock.mockReturnValueOnce(jsonResponse(true, [{ plainLyrics: "Look at the stars" }]))
    await fetchLyrics("l1")
    expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal)
  })

  it("retorna unavailable quando a API falha", async () => {
    mockCreateClient.mockResolvedValue(makeSupabase({ id: "u1" }, song) as never)
    fetchMock.mockReturnValue(jsonResponse(false, {}))
    expect(await fetchLyrics("l1")).toEqual({ error: "unavailable" })

    fetchMock.mockReset()
    fetchMock.mockRejectedValue(new Error("offline"))
    expect(await fetchLyrics("l1")).toEqual({ error: "unavailable" })
  })
})
