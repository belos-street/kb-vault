export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:'"“”]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function tokenize(text: string): string[] {
  return normalizeText(text)
    .split(' ')
    .filter((token) => token.length > 0)
}

export function isTextEqual(a: string, b: string): boolean {
  return normalizeText(a) === normalizeText(b)
}
