export type DiffToken = { text: string; match: boolean }

function normalize(word: string): string {
  return word.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\p{L}\p{N}']/gu, "")
}

export function wordDiff(mine: string, reference: string): { mine: DiffToken[]; reference: DiffToken[] } {
  const a = mine.split(/\s+/).filter(Boolean)
  const b = reference.split(/\s+/).filter(Boolean)
  const na = a.map(normalize)
  const nb = b.map(normalize)

  const lcs: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] = na[i] === nb[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1])
    }
  }

  const matchA = new Array<boolean>(a.length).fill(false)
  const matchB = new Array<boolean>(b.length).fill(false)
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (na[i] === nb[j]) {
      matchA[i] = true
      matchB[j] = true
      i++
      j++
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      i++
    } else {
      j++
    }
  }

  return {
    mine: a.map((text, k) => ({ text, match: matchA[k] })),
    reference: b.map((text, k) => ({ text, match: matchB[k] })),
  }
}
