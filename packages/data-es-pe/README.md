<p align="center">
  <a href="https://github.com/abitech-dev/abitech-openchasqui-cli#readme"><img alt="OpenChasqui" src="https://raw.githubusercontent.com/abitech-dev/abitech-openchasqui-cli/main/.github/assets/logo-light.svg" width="320"></a>
</p>

# @abitechdev/openchasqui-data-es-pe

[![npm](https://img.shields.io/npm/v/@abitechdev/openchasqui-data-es-pe?color=c2410c&label=npm)](https://www.npmjs.com/package/@abitechdev/openchasqui-data-es-pe)
[![CI](https://github.com/abitech-dev/abitech-openchasqui-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/abitech-dev/abitech-openchasqui-cli/actions/workflows/ci.yml)
[![Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue)](https://github.com/abitech-dev/abitech-openchasqui-cli/blob/main/LICENSE)

Datos de prueba peruanos, sintéticos y deterministas: nombres como los devuelve RENIEC, DNI, RUC con dígito verificador SUNAT, celulares y ubigeo. Sirve también fuera de OpenChasqui, en cualquier prueba.

## Instalación

```bash
npm i @abitechdev/openchasqui-data-es-pe
pnpm add @abitechdev/openchasqui-data-es-pe
yarn add @abitechdev/openchasqui-data-es-pe
```

Requiere Node.js 22 o superior.

## Uso

```ts
import {
  createRandom,
  dni,
  isValidRuc,
  person,
  ruc,
  ubigeo,
} from "@abitechdev/openchasqui-data-es-pe";

const random = createRandom("mi-prueba"); // la misma semilla da los mismos datos

const cliente = person(random);
cliente.givenNames; // "Jorge Manuel"
cliente.surnames; // "Díaz Mendoza"
cliente.email; // "jorge.diaz@example.com"

dni(random); // "91836612"
ruc(random, "company"); // "20288603341"
ubigeo(random); // { code: "010101", department: "Amazonas", district: "Chachapoyas" }
isValidRuc("20131312955"); // true
```

Los correos usan dominios reservados y ningún dato corresponde a una persona
real.

## Documentación

[Español](https://github.com/abitech-dev/abitech-openchasqui-cli#readme) · [English](https://github.com/abitech-dev/abitech-openchasqui-cli/blob/main/README.en.md)

## Licencia

[Apache-2.0](https://github.com/abitech-dev/abitech-openchasqui-cli/blob/main/LICENSE). Parte de [OpenChasqui](https://github.com/abitech-dev/abitech-openchasqui-cli).
