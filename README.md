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

Requires Node.js 22 or later.

```yaml
# openchasqui.config.yaml
version: 1
source: openapi.yaml
targets: [postman]
output: collections
environments:
  qa:
    variables:
      baseUrl: https://api.qa.example.com
    secrets: [token]
```

```bash
npx @abitech/openchasqui generate
```

The result lands in `collections/postman/`: the collection and one environment
per entry, ready to import in Postman or run with newman.

## Configuration

| Key            | Required | Description                                          |
| -------------- | -------- | ---------------------------------------------------- |
| `version`      | yes      | Configuration version, `1`                           |
| `source`       | yes      | OpenAPI 3.0 or 3.1 document, JSON or YAML            |
| `targets`      | yes      | Emitters to run, e.g. `[postman]`                    |
| `output`       | yes      | Folder for the collections, one subfolder per target |
| `environments` | no       | Variables and secret names per environment           |
| `variables`    | no       | Names for the base URL, token and API key variables  |

`openchasqui` only replaces folders it created before; it refuses to write over
anything else.

## Packages

| Package                                                            | Purpose                             |
| ------------------------------------------------------------------ | ----------------------------------- |
| [`@abitech/openchasqui`](packages/cli)                             | Command line                        |
| [`@abitech/openchasqui-core`](packages/core)                       | Pipeline                            |
| [`@abitech/openchasqui-spec`](packages/spec)                       | Canonical model and plugin contract |
| [`@abitech/openchasqui-loader-openapi`](packages/loader-openapi)   | OpenAPI 3.0 and 3.1 loader          |
| [`@abitech/openchasqui-emitter-postman`](packages/emitter-postman) | Postman Collection v2.1             |

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
