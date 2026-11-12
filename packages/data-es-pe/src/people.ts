import type { Random } from "./random.js";

export const FIRST_NAMES = [
  "María",
  "José",
  "Rosa",
  "Juan",
  "Carmen",
  "Luis",
  "Ana",
  "Carlos",
  "Lucía",
  "Jorge",
  "Elena",
  "Miguel",
  "Patricia",
  "Pedro",
  "Sofía",
  "César",
  "Gabriela",
  "Víctor",
  "Milagros",
  "Raúl",
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
  readonly paternalSurname: string;
  readonly maternalSurname: string;
  readonly fullName: string;
  readonly email: string;
}

/** A person with two surnames, as in Peru. The email uses a reserved domain. */
export function person(random: Random): Person {
  const firstName = random.pick(FIRST_NAMES);
  const paternalSurname = random.pick(SURNAMES);
  const maternalSurname = random.pick(SURNAMES);
  return {
    firstName,
    paternalSurname,
    maternalSurname,
    fullName: `${firstName} ${paternalSurname} ${maternalSurname}`,
    email: `${ascii(firstName)}.${ascii(paternalSurname)}@example.com`,
  };
}

function ascii(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}
