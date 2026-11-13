<p align="center">
  <a href="https://github.com/abitech-dev/abitech-openchasqui-cli#readme"><img alt="OpenChasqui" src="https://raw.githubusercontent.com/abitech-dev/abitech-openchasqui-cli/main/.github/assets/logo-light.svg" width="320"></a>
</p>

# @abitechdev/openchasqui-generator-examples

[![npm](https://img.shields.io/npm/v/@abitechdev/openchasqui-generator-examples?color=c2410c&label=npm)](https://www.npmjs.com/package/@abitechdev/openchasqui-generator-examples)
[![CI](https://github.com/abitech-dev/abitech-openchasqui-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/abitech-dev/abitech-openchasqui-cli/actions/workflows/ci.yml)
[![Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue)](https://github.com/abitech-dev/abitech-openchasqui-cli/blob/main/LICENSE)

Completa los ejemplos que faltan en parámetros y cuerpos con datos sintéticos deterministas. Con `data: es-pe` usa datos peruanos: nombres, DNI, RUC, celular y ubigeo.

> **¿Solo quieres generar colecciones?** Instala el CLI,
> [`@abitechdev/openchasqui`](https://www.npmjs.com/package/@abitechdev/openchasqui), que ya incluye este paquete.

## Instalación

```bash
npm i @abitechdev/openchasqui-core @abitechdev/openchasqui-loader-openapi @abitechdev/openchasqui-emitter-bruno @abitechdev/openchasqui-generator-examples
pnpm add @abitechdev/openchasqui-core @abitechdev/openchasqui-loader-openapi @abitechdev/openchasqui-emitter-bruno @abitechdev/openchasqui-generator-examples
yarn add @abitechdev/openchasqui-core @abitechdev/openchasqui-loader-openapi @abitechdev/openchasqui-emitter-bruno @abitechdev/openchasqui-generator-examples
```

Requiere Node.js 22 o superior.

## Uso

```ts
import { readFile } from "node:fs/promises";
import { run } from "@abitechdev/openchasqui-core";
import { openApiLoader } from "@abitechdev/openchasqui-loader-openapi";
import { brunoEmitter } from "@abitechdev/openchasqui-emitter-bruno";
import { examplesGenerator } from "@abitechdev/openchasqui-generator-examples";

const result = await run(
  { version: 1, source: "openapi.yaml", data: "es-pe", targets: ["bruno"], output: "collections" },
  {
    reader: { readText: (path) => readFile(path, "utf8") },
    plugins: [openApiLoader, examplesGenerator, brunoEmitter],
  },
);
```

Respeta los ejemplos que el contrato ya declara. La misma operación produce
siempre los mismos datos.

## Documentación

[Español](https://github.com/abitech-dev/abitech-openchasqui-cli#readme) · [English](https://github.com/abitech-dev/abitech-openchasqui-cli/blob/main/README.en.md)

## Licencia

[Apache-2.0](https://github.com/abitech-dev/abitech-openchasqui-cli/blob/main/LICENSE). Parte de [OpenChasqui](https://github.com/abitech-dev/abitech-openchasqui-cli).
