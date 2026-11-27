# 0001. Ramas y publicación

- Estado: aceptada
- Fecha: 2026-11-27

## Contexto

OpenChasqui es un monorepo público que publica tres paquetes en npm con
Changesets. No tiene servidor ni imagen de Docker. Solo la última versión
recibe arreglos, y nadie de fuera del equipo aprueba una entrega.

## Decisión

- **`branching/github-flow`, la estrategia 2 de la guía
  [Ramas y ambientes](https://abitech.dev/blog/ramas-y-ambientes).** Hay una
  sola versión, sin oleadas y sin aprobación de fuera.
  - `main` es la única rama larga. El trabajo va en `feature/*` o `fix/*`,
    siempre por PR, y `ci.yml` corre en cada PR.
  - Todo cambio de comportamiento lleva su changeset.
- **`release/merge-to-main`.** En cada push a `main`, `release.yml` abre o
  actualiza el PR de versión de Changesets. Publicar es unir ese PR: al
  llegar a `main`, el mismo workflow verifica, empaqueta y publica en npm.
- **`environments/local-prod`.** `local` es la PC donde se prueba el CLI y
  `prod` es la versión publicada en npm.
- **Forma B, no aplica.** No hay imagen que construir ni promover.

## Consecuencias

- Las mismas prácticas que los paquetes Composer de abitech.
- Una versión publicada no se vuelve a publicar; un arreglo sale en la
  siguiente.
- Si un día hay que mantener dos versiones a la vez, se revisa esta decisión
  con la skill `choosing-delivery-strategy`.
