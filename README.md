# OpenChasqui

Generate API collections for Postman and other tools from an OpenAPI contract,
with tests, environments and no secrets inside.

The _chasqui_ carried messages across the Inca road network. OpenChasqui
carries your API contract to every tool your team uses.

> Status: early development (0.x). The configuration and plugin contract may
> change before 1.0.

## Why

- **One source.** The OpenAPI document is the source of truth; collections are
  generated, never edited by hand, so they cannot drift from the API.
- **Safe by default.** No production environment, no secret with a value, no
  file written outside its folder.
- **Pluggable.** Loaders, emitters and validators are plugins. Adding a tool
  does not touch the core.

## Quick start

Requires Node.js 22 or later. In the folder of your `openapi.yaml`:

```bash
npx @abitechdev/openchasqui init       # writes openchasqui.config.yaml
npx @abitechdev/openchasqui generate   # writes collections/postman and collections/bruno
npx @abitechdev/openchasqui verify     # in CI: policies pass and collections are up to date
```

Each target gets its folder with the collection, one environment per entry and
tests for every request: status, content type, response schema and response
time. Import it in Postman or Bruno, or run it with newman or `bru run`.

## Configuration

```yaml
version: 1
source: openapi.yaml
overlays: [names.overlay.yaml]
data: es-pe
targets: [postman, bruno]
output: collections
environments:
  qa:
    variables:
      baseUrl: https://api.qa.example.com
    secrets: [token]
```

| Key            | Required | Description                                                          |
| -------------- | -------- | -------------------------------------------------------------------- |
| `version`      | yes      | Configuration version, `1`                                           |
| `source`       | yes      | OpenAPI 3.0 or 3.1 document, JSON or YAML                            |
| `targets`      | yes      | `postman`, `bruno` or both                                           |
| `output`       | yes      | Folder for the collections, one subfolder per target                 |
| `overlays`     | no       | [Overlay 1.0](https://spec.openapis.org/overlay/v1.0.html) documents |
| `data`         | no       | Synthetic examples: `generic` (default) or `es-pe`                   |
| `environments` | no       | Variables and secret names per environment                           |
| `variables`    | no       | Names for the base URL, token and API key variables                  |
| `tests`        | no       | `responseTimeMs`, the slowest acceptable response (default 5000)     |

`openchasqui` only replaces folders it created before; it refuses to write over
anything else. No environment may look like production, and a secret never
gets a value.

### Overlays

An overlay renames, regroups or trims the collection without touching the
contract. Two extensions control the layout:

```yaml
overlay: 1.0.0
info: { title: Spanish names, version: 1.0.0 }
actions:
  - target: $.paths['/banks'].get
    update:
      summary: Listar bancos
      x-openchasqui-folder: Catálogos/Bancos
      x-openchasqui-order: 1
  - target: $.paths['/internal/metrics']
    remove: true
```

### Policies

`generate` and `verify` report:

| Rule                     | Severity | When                                                |
| ------------------------ | -------- | --------------------------------------------------- |
| `no-secrets-in-examples` | error    | An example contains a JWT, a cloud key or a token   |
| `reserved-email-domains` | warning  | An example email is not on `example.com` or similar |
| `success-response`       | warning  | An operation documents no 2xx response              |
| `public-write`           | warning  | A write operation has no authentication             |

## Packages

| Package                                                                       | Purpose                                      |
| ----------------------------------------------------------------------------- | -------------------------------------------- |
| [`@abitechdev/openchasqui`](packages/cli)                                     | Command line                                 |
| [`@abitechdev/openchasqui-core`](packages/core)                               | Pipeline                                     |
| [`@abitechdev/openchasqui-spec`](packages/spec)                               | Canonical model and plugin contract          |
| [`@abitechdev/openchasqui-plugin-kit`](packages/plugin-kit)                   | Helpers for plugin authors                   |
| [`@abitechdev/openchasqui-transformer-overlay`](packages/transformer-overlay) | Overlay 1.0                                  |
| [`@abitechdev/openchasqui-loader-openapi`](packages/loader-openapi)           | OpenAPI 3.0 and 3.1 loader                   |
| [`@abitechdev/openchasqui-generator-examples`](packages/generator-examples)   | Synthetic examples                           |
| [`@abitechdev/openchasqui-generator-tests`](packages/generator-tests)         | Contract tests                               |
| [`@abitechdev/openchasqui-validator-policies`](packages/validator-policies)   | Security and quality policies                |
| [`@abitechdev/openchasqui-emitter-postman`](packages/emitter-postman)         | Postman Collection v2.1                      |
| [`@abitechdev/openchasqui-emitter-bruno`](packages/emitter-bruno)             | Bruno, OpenCollection YAML                   |
| [`@abitechdev/openchasqui-data-es-pe`](packages/data-es-pe)                   | Peruvian test data: DNI, RUC, phones, ubigeo |

## Roadmap

| Version | Scope                                                                                                                                        |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0     | Overlay 1.0, examples and contract tests, policies and coverage, Bruno (OpenCollection) and Postman, `init` and `verify`, Peruvian test data |
| 1.1     | Arazzo workflows, GitHub Action, SARIF                                                                                                       |
| 1.2     | `.http` and Insomnia, OpenAPI 3.2                                                                                                            |
| 2.0     | k6 and Playwright, stable third-party plugin contract                                                                                        |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Security reports go through
[SECURITY.md](SECURITY.md).

## License

[Apache License 2.0](LICENSE).
