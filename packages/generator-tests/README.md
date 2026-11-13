<p align="center">
  <a href="https://github.com/abitech-dev/abitech-openchasqui-cli#readme"><img alt="OpenChasqui" src="https://raw.githubusercontent.com/abitech-dev/abitech-openchasqui-cli/main/.github/assets/logo-light.svg" width="320"></a>
</p>

# @abitechdev/openchasqui-generator-tests

[![npm](https://img.shields.io/npm/v/@abitechdev/openchasqui-generator-tests?color=c2410c&label=npm)](https://www.npmjs.com/package/@abitechdev/openchasqui-generator-tests)
[![CI](https://github.com/abitech-dev/abitech-openchasqui-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/abitech-dev/abitech-openchasqui-cli/actions/workflows/ci.yml)
[![Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue)](https://github.com/abitech-dev/abitech-openchasqui-cli/blob/main/LICENSE)

Genera pruebas de contrato para cada petición: código de estado, tipo de contenido, esquema de la respuesta y tiempo de respuesta.

> **¿Solo quieres generar colecciones?** Instala el CLI,
> [`@abitechdev/openchasqui`](https://www.npmjs.com/package/@abitechdev/openchasqui), que ya incluye este paquete.

## Instalación

```bash
npm i @abitechdev/openchasqui-core @abitechdev/openchasqui-loader-openapi @abitechdev/openchasqui-emitter-bruno @abitechdev/openchasqui-generator-tests
pnpm add @abitechdev/openchasqui-core @abitechdev/openchasqui-loader-openapi @abitechdev/openchasqui-emitter-bruno @abitechdev/openchasqui-generator-tests
yarn add @abitechdev/openchasqui-core @abitechdev/openchasqui-loader-openapi @abitechdev/openchasqui-emitter-bruno @abitechdev/openchasqui-generator-tests
```

Requiere Node.js 22 o superior.

## Uso

```ts
import { readFile } from "node:fs/promises";
import { run } from "@abitechdev/openchasqui-core";
import { openApiLoader } from "@abitechdev/openchasqui-loader-openapi";
import { brunoEmitter } from "@abitechdev/openchasqui-emitter-bruno";
import { testsGenerator } from "@abitechdev/openchasqui-generator-tests";

const result = await run(
  { version: 1, source: "openapi.yaml", targets: ["bruno"], output: "collections" },
  {
    reader: { readText: (path) => readFile(path, "utf8") },
    plugins: [openApiLoader, testsGenerator, brunoEmitter],
  },
);
```

`forValidators` convierte un esquema OpenAPI en JSON Schema que Ajv acepta:

```ts
import { forValidators } from "@abitechdev/openchasqui-generator-tests";

forValidators({ type: "string", format: "date", nullable: true });
// { type: ["string", "null"] }
```

## Documentación

[Español](https://github.com/abitech-dev/abitech-openchasqui-cli#readme) · [English](https://github.com/abitech-dev/abitech-openchasqui-cli/blob/main/README.en.md)

## Licencia

[Apache-2.0](https://github.com/abitech-dev/abitech-openchasqui-cli/blob/main/LICENSE). Parte de [OpenChasqui](https://github.com/abitech-dev/abitech-openchasqui-cli).
