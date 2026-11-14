# @abitechdev/openchasqui

## 0.2.1

### Patch Changes

- ce6cf33: A missing configuration file, source document or overlay now ends with `error missing-file` and its path instead of a Node.js stack trace.
- @abitechdev/openchasqui-data-es-pe@0.2.1
  - @abitechdev/openchasqui-plugin-kit@0.2.1

## 0.2.0

### Minor Changes

- 2d62c24: OpenChasqui now ships three packages. The CLI bundles the pipeline and every built-in plugin, `plugin-kit` also carries the plugin contract and the canonical model that lived in `openchasqui-spec`, and `data-es-pe` is unchanged. The other nine packages are no longer published; import their types from `@abitechdev/openchasqui-plugin-kit`.

### Patch Changes

- Updated dependencies [2d62c24]
  - @abitechdev/openchasqui-plugin-kit@0.2.0
  - @abitechdev/openchasqui-data-es-pe@0.2.0

## 0.1.2

### Patch Changes

- cccf0be: Spanish package descriptions for npm search.
- Updated dependencies [cccf0be]
  - @abitechdev/openchasqui-core@0.1.2
  - @abitechdev/openchasqui-emitter-bruno@0.1.2
  - @abitechdev/openchasqui-emitter-postman@0.1.2
  - @abitechdev/openchasqui-generator-examples@0.1.2
  - @abitechdev/openchasqui-generator-tests@0.1.2
  - @abitechdev/openchasqui-loader-openapi@0.1.2
  - @abitechdev/openchasqui-spec@0.1.2
  - @abitechdev/openchasqui-transformer-overlay@0.1.2
  - @abitechdev/openchasqui-validator-policies@0.1.2

## 0.1.1

### Patch Changes

- Spanish READMEs with installation and usage examples, and npm keywords.
- Updated dependencies
  - @abitechdev/openchasqui-core@0.1.1
  - @abitechdev/openchasqui-emitter-bruno@0.1.1
  - @abitechdev/openchasqui-emitter-postman@0.1.1
  - @abitechdev/openchasqui-generator-examples@0.1.1
  - @abitechdev/openchasqui-generator-tests@0.1.1
  - @abitechdev/openchasqui-loader-openapi@0.1.1
  - @abitechdev/openchasqui-spec@0.1.1
  - @abitechdev/openchasqui-transformer-overlay@0.1.1
  - @abitechdev/openchasqui-validator-policies@0.1.1

## 0.1.0

### Minor Changes

- b9d26ae: First release: OpenAPI 3.0 and 3.1 loader, Postman v2.1 emitter and the `generate` command.
- 9fa5781: Overlay 1.0, synthetic examples with Peruvian data, contract tests, policies, the Bruno emitter and the `init` and `verify` commands.

### Patch Changes

- Updated dependencies [b9d26ae]
- Updated dependencies [9fa5781]
  - @abitechdev/openchasqui-core@0.1.0
  - @abitechdev/openchasqui-spec@0.1.0
  - @abitechdev/openchasqui-loader-openapi@0.1.0
  - @abitechdev/openchasqui-emitter-postman@0.1.0
  - @abitechdev/openchasqui-transformer-overlay@0.1.0
  - @abitechdev/openchasqui-generator-examples@0.1.0
  - @abitechdev/openchasqui-generator-tests@0.1.0
  - @abitechdev/openchasqui-validator-policies@0.1.0
  - @abitechdev/openchasqui-emitter-bruno@0.1.0
