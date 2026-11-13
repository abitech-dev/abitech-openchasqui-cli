import type { Random } from "./random.js";

export const FEMALE_NAMES = [
  "María",
  "Rosa",
  "Carmen",
  "Ana",
  "Lucía",
  "Elena",
  "Patricia",
  "Sofía",
  "Gabriela",
  "Milagros",
  "Fernanda",
  "Isabel",
] as const;

export const MALE_NAMES = [
  "José",
  "Juan",
  "Luis",
  "Carlos",
  "Jorge",
  "Miguel",
  "Pedro",
  "César",
  "Víctor",
  "Raúl",
  "Alberto",
  "Manuel",
] as const;

export const SURNAMES = [
  "Quispe",
  "Flores",
  "Sánchez",
  "Rodríguez",
  "García",
  "Mamani",
  "Huamán",
  "Chávez",
  "Ramos",
  "Torres",
  "Vásquez",
  "Rojas",
  "Mendoza",
  "Castillo",
  "Gutiérrez",
  "Condori",
  "Díaz",
  "Ccahuana",
  "Cárdenas",
  "Ticona",
] as const;

export interface Person {
  readonly firstName: string;
  /** One or two given names, as RENIEC returns them in `nombres`. */
  readonly givenNames: string;
  readonly paternalSurname: string;
  readonly maternalSurname: string;
  /** Both surnames, as a Peruvian form asks for them. */
  readonly surnames: string;
  readonly fullName: string;
  readonly email: string;
}

/** A person with two surnames, as in Peru. The email uses a reserved domain. */
export function person(random: Random): Person {
  const names: readonly string[] = random.integer(0, 1) === 0 ? FEMALE_NAMES : MALE_NAMES;
  const firstName = random.pick(names);
  const givenNames =
    random.integer(1, 2) === 1
      ? firstName
      : `${firstName} ${random.pick(names.filter((name) => name !== firstName))}`;
  const paternalSurname = random.pick(SURNAMES);
  const maternalSurname = random.pick(SURNAMES.filter((surname) => surname !== paternalSurname));
  const surnames = `${paternalSurname} ${maternalSurname}`;
  return {
    firstName,
    givenNames,
    paternalSurname,
    maternalSurname,
    surnames,
    fullName: `${givenNames} ${surnames}`,
    email: `${ascii(firstName)}.${ascii(paternalSurname)}@example.com`,
  };
}

function ascii(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}
