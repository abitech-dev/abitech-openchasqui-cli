<p align="center">
  <a href="https://github.com/abitech-dev/abitech-openchasqui-cli#readme"><img alt="OpenChasqui" src="https://raw.githubusercontent.com/abitech-dev/abitech-openchasqui-cli/main/.github/assets/logo-light.svg" width="320"></a>
</p>

# @abitechdev/openchasqui-transformer-overlay

[![npm](https://img.shields.io/npm/v/@abitechdev/openchasqui-transformer-overlay?color=c2410c&label=npm)](https://www.npmjs.com/package/@abitechdev/openchasqui-transformer-overlay)
[![CI](https://github.com/abitech-dev/abitech-openchasqui-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/abitech-dev/abitech-openchasqui-cli/actions/workflows/ci.yml)
[![Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue)](https://github.com/abitech-dev/abitech-openchasqui-cli/blob/main/LICENSE)

Aplica documentos [OpenAPI Overlay 1.0](https://spec.openapis.org/overlay/v1.0.html) antes de cargar el contrato: renombra, reagrupa u oculta endpoints sin tocar el original.

> **¿Solo quieres generar colecciones?** Instala el CLI,
> [`@abitechdev/openchasqui`](https://www.npmjs.com/package/@abitechdev/openchasqui), que ya incluye este paquete.

## Instalación

```bash
npm i @abitechdev/openchasqui-core @abitechdev/openchasqui-loader-openapi @abitechdev/openchasqui-emitter-bruno @abitechdev/openchasqui-transformer-overlay
pnpm add @abitechdev/openchasqui-core @abitechdev/openchasqui-loader-openapi @abitechdev/openchasqui-emitter-bruno @abitechdev/openchasqui-transformer-overlay
yarn add @abitechdev/openchasqui-core @abitechdev/openchasqui-loader-openapi @abitechdev/openchasqui-emitter-bruno @abitechdev/openchasqui-transformer-overlay
```

Requiere Node.js 22 o superior.

## Uso

```yaml
# nombres.overlay.yaml
overlay: 1.0.0
info: { title: Nombres en español, version: 1.0.0 }
actions:
  - target: $.paths['/pets'].get
    update:
      summary: Listar mascotas
      x-openchasqui-folder: Mascotas
```

```ts
import { readFile } from "node:fs/promises";
import { run } from "@abitechdev/openchasqui-core";
import { openApiLoader } from "@abitechdev/openchasqui-loader-openapi";
import { brunoEmitter } from "@abitechdev/openchasqui-emitter-bruno";
import { overlayTransformer } from "@abitechdev/openchasqui-transformer-overlay";

const result = await run(
  {
    version: 1,
    source: "openapi.yaml",
    overlays: ["nombres.overlay.yaml"],
    targets: ["bruno"],
    output: "collections",
  },
  {
    reader: { readText: (path) => readFile(path, "utf8") },
    plugins: [overlayTransformer, openApiLoader, brunoEmitter],
  },
);
```

## Documentación

[Español](https://github.com/abitech-dev/abitech-openchasqui-cli#readme) · [English](https://github.com/abitech-dev/abitech-openchasqui-cli/blob/main/README.en.md)

## Licencia

[Apache-2.0](https://github.com/abitech-dev/abitech-openchasqui-cli/blob/main/LICENSE). Parte de [OpenChasqui](https://github.com/abitech-dev/abitech-openchasqui-cli).
