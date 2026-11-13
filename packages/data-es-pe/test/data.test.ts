import { describe, expect, it } from "vitest";
import {
  createRandom,
  dni,
  FEMALE_NAMES,
  isValidRuc,
  MALE_NAMES,
  mobilePhone,
  person,
  ruc,
  rucCheckDigit,
  ubigeo,
} from "../src/index.js";

describe("RUC", () => {
  it("computes the SUNAT check digit of real public RUCs", () => {
    for (const real of ["20131312955", "20100047218", "20100070970", "20131380951"]) {
      expect(rucCheckDigit(real.slice(0, 10))).toBe(real[10]);
      expect(isValidRuc(real)).toBe(true);
    }
  });

  it("rejects a RUC with a wrong check digit or prefix", () => {
    expect(isValidRuc("20131312956")).toBe(false);
    expect(isValidRuc("30131312955")).toBe(false);
  });

  it("generates valid RUCs for companies and people", () => {
    const random = createRandom("ruc");
    for (let index = 0; index < 200; index++) {
      const company = ruc(random, "company");
      const individual = ruc(random, "person");
      expect(isValidRuc(company) && company.startsWith("20")).toBe(true);
      expect(isValidRuc(individual) && individual.startsWith("10")).toBe(true);
    }
  });
});

describe("generators", () => {
  it("returns the same values for the same seed", () => {
    expect(person(createRandom("seed"))).toEqual(person(createRandom("seed")));
    expect(dni(createRandom("seed"))).toBe(dni(createRandom("seed")));
  });

  it("returns different values for different seeds", () => {
    expect(dni(createRandom("a"))).not.toBe(dni(createRandom("b")));
  });

  it("builds DNIs and mobile phones with the Peruvian format", () => {
    const random = createRandom("formats");
    for (let index = 0; index < 100; index++) {
      expect(dni(random)).toMatch(/^[1-9]\d{7}$/);
      expect(mobilePhone(random)).toMatch(/^9\d{8}$/);
    }
  });

  it("gives people two different surnames and an email on a reserved domain", () => {
    const random = createRandom("person");
    for (let i = 0; i < 200; i++) {
      const { paternalSurname, maternalSurname, surnames } = person(random);
      expect(paternalSurname).not.toBe(maternalSurname);
      expect(surnames).toBe(`${paternalSurname} ${maternalSurname}`);
    }
    const someone = person(createRandom("person"));
    expect(someone.fullName).toBe(`${someone.givenNames} ${someone.surnames}`);
    expect(someone.email).toMatch(/^[a-z]+\.[a-z]+@example\.com$/);
  });

  it("gives one or two distinct given names of the same gender, as RENIEC returns them", () => {
    const random = createRandom("given names");
    const counts = new Set<number>();
    for (let i = 0; i < 200; i++) {
      const someone = person(random);
      const names = someone.givenNames.split(" ");
      counts.add(names.length);
      expect(new Set(names).size).toBe(names.length);
      expect(names[0]).toBe(someone.firstName);
      const list = (FEMALE_NAMES as readonly string[]).includes(someone.firstName)
        ? FEMALE_NAMES
        : MALE_NAMES;
      for (const name of names) expect(list).toContain(name);
    }
    expect([...counts].sort()).toEqual([1, 2]);
  });

  it("uses six-digit INEI codes", () => {
    expect(ubigeo(createRandom("ubigeo")).code).toMatch(/^\d{2}0101$/);
  });
});
