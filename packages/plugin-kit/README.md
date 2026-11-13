<p align="center">
  <a href="https://github.com/abitech-dev/abitech-openchasqui-cli#readme"><img alt="OpenChasqui" src="https://raw.githubusercontent.com/abitech-dev/abitech-openchasqui-cli/main/.github/assets/logo-light.svg" width="320"></a>
</p>

# @abitechdev/openchasqui-plugin-kit

[![npm](https://img.shields.io/npm/v/@abitechdev/openchasqui-plugin-kit?color=c2410c&label=npm)](https://www.npmjs.com/package/@abitechdev/openchasqui-plugin-kit)
[![CI](https://github.com/abitech-dev/abitech-openchasqui-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/abitech-dev/abitech-openchasqui-cli/actions/workflows/ci.yml)
[![Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue)](https://github.com/abitech-dev/abitech-openchasqui-cli/blob/main/LICENSE)

Utilidades para autores de plugins de OpenChasqui: resolver y aplanar esquemas, nombres de archivo seguros y valores de ejemplo para parámetros.

> **¿Solo quieres generar colecciones?** Instala el CLI,
> [`@abitechdev/openchasqui`](https://www.npmjs.com/package/@abitechdev/openchasqui), que ya incluye este paquete.

## Instalación

```bash
npm i @abitechdev/openchasqui-plugin-kit
pnpm add @abitechdev/openchasqui-plugin-kit
yarn add @abitechdev/openchasqui-plugin-kit
```

Requiere Node.js 22 o superior.

## Uso

```ts
import { fileName, slugify } from "@abitechdev/openchasqui-plugin-kit";

slugify("Catálogos de Bancos"); // "catalogos-de-bancos"
fileName('Listar "bancos" / activos'); // "Listar -bancos- - activos"
```

| Función                                         | Qué hace                                                          |
| ----------------------------------------------- | ----------------------------------------------------------------- |
| `resolveSchema`, `inlineSchema`, `flattenAllOf` | Resuelven `$ref` y `allOf`; `inlineSchema` corta los ciclos       |
| `slugify`, `fileName`                           | Nombres seguros para carpetas y archivos en cualquier sistema     |
| `mostUsedScheme`, `parameterValue`              | Esquema de seguridad más usado y valor de ejemplo de un parámetro |

## Documentación

[Español](https://github.com/abitech-dev/abitech-openchasqui-cli#readme) · [English](https://github.com/abitech-dev/abitech-openchasqui-cli/blob/main/README.en.md)

## Licencia

[Apache-2.0](https://github.com/abitech-dev/abitech-openchasqui-cli/blob/main/LICENSE). Parte de [OpenChasqui](https://github.com/abitech-dev/abitech-openchasqui-cli).
