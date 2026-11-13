<p align="center">
  <a href="https://github.com/abitech-dev/abitech-openchasqui-cli#readme"><img alt="OpenChasqui" src="https://raw.githubusercontent.com/abitech-dev/abitech-openchasqui-cli/main/.github/assets/logo-light.svg" width="320"></a>
</p>

# @abitechdev/openchasqui-core

[![npm](https://img.shields.io/npm/v/@abitechdev/openchasqui-core?color=c2410c&label=npm)](https://www.npmjs.com/package/@abitechdev/openchasqui-core)
[![CI](https://github.com/abitech-dev/abitech-openchasqui-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/abitech-dev/abitech-openchasqui-cli/actions/workflows/ci.yml)
[![Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue)](https://github.com/abitech-dev/abitech-openchasqui-cli/blob/main/LICENSE)

Motor de OpenChasqui. Valida la configuración, ejecuta los plugins en orden (overlays, cargador, generadores, validadores y emisores) y devuelve las colecciones en memoria.

> **¿Solo quieres generar colecciones?** Instala el CLI,
> [`@abitechdev/openchasqui`](https://www.npmjs.com/package/@abitechdev/openchasqui), que ya incluye este paquete.

## Instalación

```bash
npm i @abitechdev/openchasqui-core
pnpm add @abitechdev/openchasqui-core
yarn add @abitechdev/openchasqui-core
```

Requiere Node.js 22 o superior.

## Uso

Arma tu propio pipeline con los plugins que necesites:

```ts
import { readFile } from "node:fs/promises";
import { run } from "@abitechdev/openchasqui-core";
import { brunoEmitter } from "@abitechdev/openchasqui-emitter-bruno";
import { examplesGenerator } from "@abitechdev/openchasqui-generator-examples";
import { testsGenerator } from "@abitechdev/openchasqui-generator-tests";
import { openApiLoader } from "@abitechdev/openchasqui-loader-openapi";

const result = await run(
  { version: 1, source: "openapi.yaml", targets: ["bruno"], output: "collections" },
  {
    reader: { readText: (path) => readFile(path, "utf8") },
    plugins: [openApiLoader, examplesGenerator, testsGenerator, brunoEmitter],
  },
);

for (const { target, files } of result.outputs) {
  console.log(
    target,
    files.map((file) => file.path),
  );
}
```

`run` devuelve los archivos en memoria y `result.findings` trae los avisos de
las políticas. El CLI es quien escribe los archivos en disco.

## Documentación

[Español](https://github.com/abitech-dev/abitech-openchasqui-cli#readme) · [English](https://github.com/abitech-dev/abitech-openchasqui-cli/blob/main/README.en.md)

## Licencia

[Apache-2.0](https://github.com/abitech-dev/abitech-openchasqui-cli/blob/main/LICENSE). Parte de [OpenChasqui](https://github.com/abitech-dev/abitech-openchasqui-cli).
