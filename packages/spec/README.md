<p align="center">
  <a href="https://github.com/abitech-dev/abitech-openchasqui-cli#readme"><img alt="OpenChasqui" src="https://raw.githubusercontent.com/abitech-dev/abitech-openchasqui-cli/main/.github/assets/logo-light.svg" width="320"></a>
</p>

# @abitechdev/openchasqui-spec

[![npm](https://img.shields.io/npm/v/@abitechdev/openchasqui-spec?color=c2410c&label=npm)](https://www.npmjs.com/package/@abitechdev/openchasqui-spec)
[![CI](https://github.com/abitech-dev/abitech-openchasqui-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/abitech-dev/abitech-openchasqui-cli/actions/workflows/ci.yml)
[![Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue)](https://github.com/abitech-dev/abitech-openchasqui-cli/blob/main/LICENSE)

Contrato de OpenChasqui: el modelo canónico de la API, los tipos de la configuración y la interfaz de cada tipo de plugin. Es la única dependencia que necesitas para escribir un plugin propio.

> **¿Solo quieres generar colecciones?** Instala el CLI,
> [`@abitechdev/openchasqui`](https://www.npmjs.com/package/@abitechdev/openchasqui), que ya incluye este paquete.

## Instalación

```bash
npm i @abitechdev/openchasqui-spec
pnpm add @abitechdev/openchasqui-spec
yarn add @abitechdev/openchasqui-spec
```

Requiere Node.js 22 o superior.

## Uso

Un emisor que lista las rutas del contrato:

```ts
import type { Emitter } from "@abitechdev/openchasqui-spec";

export const routesEmitter: Emitter = {
  name: "routes-emitter",
  kind: "emitter",
  apiVersion: 1,
  target: "routes",
  emit: async ({ model }) => [
    {
      path: "routes.txt",
      contents: model.operations.map((op) => `${op.method} ${op.path}`).join("\n"),
    },
  ],
};
```

Los tipos de plugin son `document-transformer`, `loader`, `transformer`,
`generator`, `validator` y `emitter`.

## Documentación

[Español](https://github.com/abitech-dev/abitech-openchasqui-cli#readme) · [English](https://github.com/abitech-dev/abitech-openchasqui-cli/blob/main/README.en.md)

## Licencia

[Apache-2.0](https://github.com/abitech-dev/abitech-openchasqui-cli/blob/main/LICENSE). Parte de [OpenChasqui](https://github.com/abitech-dev/abitech-openchasqui-cli).
