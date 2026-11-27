# Referencia de configuración

Claves de `openchasqui.config.yaml`, overlays y políticas, para quien ya
generó sus primeras colecciones y quiere ajustarlas.

## Configuración

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

| Clave          | Obligatoria | Descripción                                                           |
| -------------- | ----------- | --------------------------------------------------------------------- |
| `version`      | sí          | Versión de la configuración, `1`                                      |
| `source`       | sí          | Documento OpenAPI 3.0 o 3.1, en JSON o YAML                           |
| `targets`      | sí          | `postman`, `bruno` o ambos                                            |
| `output`       | sí          | Carpeta de las colecciones, una subcarpeta por destino                |
| `overlays`     | no          | Documentos [Overlay 1.0](https://spec.openapis.org/overlay/v1.0.html) |
| `data`         | no          | Ejemplos sintéticos: `generic` (por defecto) o `es-pe`                |
| `environments` | no          | Variables y nombres de secretos por entorno                           |
| `variables`    | no          | Nombres de las variables de URL base, token y API key                 |
| `tests`        | no          | `responseTimeMs`, la respuesta más lenta aceptable (por defecto 5000) |

`openchasqui` solo reemplaza carpetas que él mismo creó; se niega a escribir
sobre cualquier otra. Ningún entorno puede parecer de producción y un secreto
nunca lleva valor.

## Qué obtienes

```text
collections/
├── postman/
│   ├── petstore.postman_collection.json
│   └── petstore-dev.postman_environment.json
└── bruno/
    ├── opencollection.yml
    ├── environments/dev.yml
    ├── pets/
    │   ├── folder.yml
    │   ├── List pets.yml
    │   └── Create a pet.yml
    └── store/
        └── Opening hours.yml
```

Cada petición trae sus pruebas: código de estado, tipo de contenido, esquema de
la respuesta y tiempo de respuesta.

Con `data: es-pe`, los ejemplos que faltan se llenan con datos de prueba
peruanos con la forma de una consulta a RENIEC: uno o dos nombres, los dos
apellidos, una persona y un lugar por objeto, y un RUC con dígito verificador
SUNAT válido:

```json
{
  "nombres": "Isabel Lucía",
  "apellidoPaterno": "Gutiérrez",
  "apellidoMaterno": "Castillo",
  "correo": "isabel.gutierrez@example.com",
  "dni": "11067581",
  "ruc": "20968504291",
  "celular": "925340375",
  "ubigeo": "170101",
  "distrito": "Tambopata"
}
```

## Overlays

Un overlay renombra, reagrupa o recorta la colección sin tocar el contrato. Dos
extensiones controlan la organización:

```yaml
overlay: 1.0.0
info: { title: Nombres en español, version: 1.0.0 }
actions:
  - target: $.paths['/banks'].get
    update:
      summary: Listar bancos
      x-openchasqui-folder: Catálogos/Bancos
      x-openchasqui-order: 1
  - target: $.paths['/internal/metrics']
    remove: true
```

## Políticas

`generate` y `verify` informan:

| Regla                    | Severidad   | Cuándo                                                     |
| ------------------------ | ----------- | ---------------------------------------------------------- |
| `no-secrets-in-examples` | error       | Un ejemplo contiene un JWT, una clave de nube o un token   |
| `reserved-email-domains` | advertencia | Un correo de ejemplo no usa `example.com` u otro reservado |
| `success-response`       | advertencia | Una operación no documenta ninguna respuesta 2xx           |
| `public-write`           | advertencia | Una operación de escritura no pide autenticación           |
