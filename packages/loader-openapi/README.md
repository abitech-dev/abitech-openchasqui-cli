<p align="center">
  <a href="https://github.com/abitech-dev/abitech-openchasqui-cli#readme"><img alt="OpenChasqui" src="https://raw.githubusercontent.com/abitech-dev/abitech-openchasqui-cli/main/.github/assets/logo-light.svg" width="320"></a>
</p>

# @abitechdev/openchasqui-loader-openapi

[![npm](https://img.shields.io/npm/v/@abitechdev/openchasqui-loader-openapi?color=c2410c&label=npm)](https://www.npmjs.com/package/@abitechdev/openchasqui-loader-openapi)
[![CI](https://github.com/abitech-dev/abitech-openchasqui-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/abitech-dev/abitech-openchasqui-cli/actions/workflows/ci.yml)
[![Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue)](https://github.com/abitech-dev/abitech-openchasqui-cli/blob/main/LICENSE)

Lee documentos OpenAPI 3.0 y 3.1, en JSON o YAML, y los convierte al modelo de OpenChasqui: operaciones, parámetros, cuerpos, respuestas, seguridad y carpetas.

> **¿Solo quieres generar colecciones?** Instala el CLI,
> [`@abitechdev/openchasqui`](https://www.npmjs.com/package/@abitechdev/openchasqui), que ya incluye este paquete.

## Instalación

```bash
npm i @abitechdev/openchasqui-core @abitechdev/openchasqui-loader-openapi @abitechdev/openchasqui-emitter-bruno
pnpm add @abitechdev/openchasqui-core @abitechdev/openchasqui-loader-openapi @abitechdev/openchasqui-emitter-bruno
yarn add @abitechdev/openchasqui-core @abitechdev/openchasqui-loader-openapi @abitechdev/openchasqui-emitter-bruno
```

Requiere Node.js 22 o superior.

## Uso

```ts
import { readFile } from "node:fs/promises";
import { run } from "@abitechdev/openchasqui-core";
import { openApiLoader } from "@abitechdev/openchasqui-loader-openapi";
import { brunoEmitter } from "@abitechdev/openchasqui-emitter-bruno";

const result = await run(
  { version: 1, source: "openapi.yaml", targets: ["bruno"], output: "collections" },
  {
    reader: { readText: (path) => readFile(path, "utf8") },
    plugins: [openApiLoader, brunoEmitter],
  },
);
```

La carpeta de cada operación sale de `x-openchasqui-folder`, de su primer
tag o del primer segmento de la ruta, en ese orden. `x-openchasqui-order` fija
su posición.

## Documentación

[Español](https://github.com/abitech-dev/abitech-openchasqui-cli#readme) · [English](https://github.com/abitech-dev/abitech-openchasqui-cli/blob/main/README.en.md)

## Licencia

[Apache-2.0](https://github.com/abitech-dev/abitech-openchasqui-cli/blob/main/LICENSE). Parte de [OpenChasqui](https://github.com/abitech-dev/abitech-openchasqui-cli).
