# @abitechdev/openchasqui

Generate, validate and distribute API collections from OpenAPI.

## Usage

Requires Node.js 22 or later. In the folder of your `openapi.yaml`:

```bash
npx @abitechdev/openchasqui init       # writes openchasqui.config.yaml
npx @abitechdev/openchasqui generate   # writes the Postman and Bruno collections
npx @abitechdev/openchasqui verify     # fails when collections are out of date
```

Configuration, overlays and policies are described in the
[main README](https://github.com/abitech-dev/abitech-openchasqui-cli/blob/main/README.en.md)
([documentación en español](https://github.com/abitech-dev/abitech-openchasqui-cli#readme)).

## License

Apache-2.0
