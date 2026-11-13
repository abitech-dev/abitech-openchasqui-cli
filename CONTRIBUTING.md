# Contributing

Thanks for helping. This guide covers what a pull request needs.

## Setup

```bash
corepack enable
pnpm install
pnpm verify      # lint, build and tests
```

Requires Node.js 22 or later.

## Pull requests

1. Open an issue first for anything larger than a fix, so the design is agreed
   before the code.
2. One logical change per pull request, with its tests.
3. A behavior change adds a changeset: `pnpm changeset`.
4. Commits follow [Conventional Commits](https://www.conventionalcommits.org)
   and are signed off (see below).
5. `pnpm verify` passes.

Breaking changes to the plugin contract, the canonical model or the
configuration file need an RFC in `rfcs/` before the code.

## Developer Certificate of Origin

Every commit carries a `Signed-off-by` line, added with `git commit -s`. It
certifies that you wrote the change or have the right to submit it under the
project license, as described in the
[Developer Certificate of Origin](https://developercertificate.org).

## Tests

- A bug fix comes with the test that reproduces it.
- Emitters are checked against reference files in `test/__golden__`. Update
  them with `pnpm vitest run -u` and review the diff before committing.

## Releases

Nobody publishes from a laptop. When changesets reach `main`, the release
workflow opens a "version packages" pull request; merging it publishes every
package to npm through trusted publishing, with provenance, and creates the
GitHub release. All packages share one version.

## Code of conduct

Everyone taking part follows the [Code of Conduct](CODE_OF_CONDUCT.md).
