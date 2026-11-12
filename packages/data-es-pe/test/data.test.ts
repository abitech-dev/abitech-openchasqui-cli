import { describe, expect, it } from "vitest";
import {
  createRandom,
  dni,
  isValidRuc,
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

  it("gives people two surnames and an email on a reserved domain", () => {
    const someone = person(createRandom("person"));
    expect(someone.fullName.split(" ")).toHaveLength(3);
    expect(someone.email).toMatch(/^[a-z]+\.[a-z]+@example\.com$/);
  });

  it("uses six-digit INEI codes", () => {
    expect(ubigeo(createRandom("ubigeo")).code).toMatch(/^\d{2}0101$/);
  });
});
