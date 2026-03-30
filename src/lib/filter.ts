const BAD_WORDS = ["비속어1", "비속어2", "욕설", "바보", "스팸단어"];

export function findBadWord(text: string): string | null {
  if (!text) return null;
  // text에 포함된 첫 번째 금칙어를 찾아 반환합니다.
  return BAD_WORDS.find((word) => text.includes(word)) || null;
}
