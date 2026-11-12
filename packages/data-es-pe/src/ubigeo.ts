import type { Random } from "./random.js";

export interface Ubigeo {
  /** Six-digit INEI code of the district. */
  readonly code: string;
  readonly department: string;
  readonly district: string;
}

/** Capital district of each department, coded as department plus 0101. */
export const DEPARTMENT_CAPITALS: readonly Ubigeo[] = [
  { code: "010101", department: "Amazonas", district: "Chachapoyas" },
  { code: "020101", department: "Áncash", district: "Huaraz" },
  { code: "030101", department: "Apurímac", district: "Abancay" },
  { code: "040101", department: "Arequipa", district: "Arequipa" },
  { code: "050101", department: "Ayacucho", district: "Ayacucho" },
  { code: "060101", department: "Cajamarca", district: "Cajamarca" },
  { code: "070101", department: "Callao", district: "Callao" },
  { code: "080101", department: "Cusco", district: "Cusco" },
  { code: "090101", department: "Huancavelica", district: "Huancavelica" },
  { code: "100101", department: "Huánuco", district: "Huánuco" },
  { code: "110101", department: "Ica", district: "Ica" },
  { code: "120101", department: "Junín", district: "Huancayo" },
  { code: "130101", department: "La Libertad", district: "Trujillo" },
  { code: "140101", department: "Lambayeque", district: "Chiclayo" },
  { code: "150101", department: "Lima", district: "Lima" },
  { code: "160101", department: "Loreto", district: "Iquitos" },
  { code: "170101", department: "Madre de Dios", district: "Tambopata" },
  { code: "180101", department: "Moquegua", district: "Moquegua" },
  { code: "190101", department: "Pasco", district: "Chaupimarca" },
  { code: "200101", department: "Piura", district: "Piura" },
  { code: "210101", department: "Puno", district: "Puno" },
  { code: "220101", department: "San Martín", district: "Moyobamba" },
  { code: "230101", department: "Tacna", district: "Tacna" },
  { code: "240101", department: "Tumbes", district: "Tumbes" },
  { code: "250101", department: "Ucayali", district: "Callería" },
];

export function ubigeo(random: Random): Ubigeo {
  return random.pick(DEPARTMENT_CAPITALS);
}
