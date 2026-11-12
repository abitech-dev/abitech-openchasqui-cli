import type { Random } from "./random.js";

const RUC_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2] as const;

/** SUNAT check digit for the first 10 digits of a RUC (modulo 11). */
export function rucCheckDigit(firstTen: string): string {
  const sum = RUC_WEIGHTS.reduce(
    (total, weight, index) => total + weight * Number(firstTen[index]),
    0,
  );
  return String((11 - (sum % 11)) % 10);
}

export function isValidRuc(ruc: string): boolean {
  return /^(10|15|17|20)\d{9}$/.test(ruc) && rucCheckDigit(ruc.slice(0, 10)) === ruc[10];
}

/** Eight digits that never start with 0, like most DNIs in use. */
export function dni(random: Random): string {
  return `${random.integer(1, 9)}${random.digits(7)}`;
}

/** RUC of a person (10 and a DNI) or a company (20), with check digit. */
export function ruc(random: Random, holder: "person" | "company" = "company"): string {
  const firstTen = holder === "person" ? `10${dni(random)}` : `20${random.digits(8)}`;
  return firstTen + rucCheckDigit(firstTen);
}

/** Peruvian mobile number, nine digits starting with 9. */
export function mobilePhone(random: Random): string {
  return `9${random.digits(8)}`;
}
