/** Seeded mulberry32 generator. The same seed yields the same values. */
export interface Random {
  next(): number;
  integer(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
  digits(count: number): string;
}

export function createRandom(seed: string): Random {
  let state = hash(seed);
  const next = (): number => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const integer = (min: number, max: number): number => min + Math.floor(next() * (max - min + 1));
  return {
    next,
    integer,
    pick: <T>(items: readonly T[]): T => items[integer(0, items.length - 1)] as T,
    digits: (count: number) => Array.from({ length: count }, () => integer(0, 9)).join(""),
  };
}

/** FNV-1a, enough to spread similar seeds apart. */
function hash(text: string): number {
  let value = 0x811c9dc5;
  for (let index = 0; index < text.length; index++) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 0x01000193);
  }
  return value >>> 0;
}
