<p align="center">
  <a href="https://github.com/abitech-dev/abitech-openchasqui-cli#readme"><img alt="OpenChasqui" src="https://raw.githubusercontent.com/abitech-dev/abitech-openchasqui-cli/main/.github/assets/logo-light.svg" width="320"></a>
</p>

# @abitechdev/openchasqui-validator-policies

[![npm](https://img.shields.io/npm/v/@abitechdev/openchasqui-validator-policies?color=c2410c&label=npm)](https://www.npmjs.com/package/@abitechdev/openchasqui-validator-policies)
[![CI](https://github.com/abitech-dev/abitech-openchasqui-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/abitech-dev/abitech-openchasqui-cli/actions/workflows/ci.yml)
[![Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue)](https://github.com/abitech-dev/abitech-openchasqui-cli/blob/main/LICENSE)

Políticas de seguridad y calidad para las colecciones. Un error detiene `generate` y `verify`; una advertencia solo se informa.

> **¿Solo quieres generar colecciones?** Instala el CLI,
> [`@abitechdev/openchasqui`](https://www.npmjs.com/package/@abitechdev/openchasqui), que ya incluye este paquete.

## Instalación

```bash
npm i @abitechdev/openchasqui-core @abitechdev/openchasqui-loader-openapi @abitechdev/openchasqui-emitter-bruno @abitechdev/openchasqui-validator-policies
pnpm add @abitechdev/openchasqui-core @abitechdev/openchasqui-loader-openapi @abitechdev/openchasqui-emitter-bruno @abitechdev/openchasqui-validator-policies
yarn add @abitechdev/openchasqui-core @abitechdev/openchasqui-loader-openapi @abitechdev/openchasqui-emitter-bruno @abitechdev/openchasqui-validator-policies
```

Requiere Node.js 22 o superior.

## Uso

```ts
import { readFile } from "node:fs/promises";
import { run } from "@abitechdev/openchasqui-core";
import { openApiLoader } from "@abitechdev/openchasqui-loader-openapi";
import { brunoEmitter } from "@abitechdev/openchasqui-emitter-bruno";
import { policiesValidator } from "@abitechdev/openchasqui-validator-policies";

const result = await run(
  { version: 1, source: "openapi.yaml", targets: ["bruno"], output: "collections" },
  {
    reader: { readText: (path) => readFile(path, "utf8") },
    plugins: [openApiLoader, policiesValidator, brunoEmitter],
  },
);
```

| Regla                    | Severidad   | Cuándo                                                     |
| ------------------------ | ----------- | ---------------------------------------------------------- |
| `no-secrets-in-examples` | error       | Un ejemplo contiene un JWT, una clave de nube o un token   |
| `reserved-email-domains` | advertencia | Un correo de ejemplo no usa `example.com` u otro reservado |
| `success-response`       | advertencia | Una operación no documenta ninguna respuesta 2xx           |
| `public-write`           | advertencia | Una operación de escritura no pide autenticación           |

## Documentación

[Español](https://github.com/abitech-dev/abitech-openchasqui-cli#readme) · [English](https://github.com/abitech-dev/abitech-openchasqui-cli/blob/main/README.en.md)

## Licencia

[Apache-2.0](https://github.com/abitech-dev/abitech-openchasqui-cli/blob/main/LICENSE). Parte de [OpenChasqui](https://github.com/abitech-dev/abitech-openchasqui-cli).
