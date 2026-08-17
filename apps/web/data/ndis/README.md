# NDIS provider finder data

Official export URL:

https://ndis.gov.au/sites/default/files/react_extract/provider_finder/build/data/list-providers.json

## Local copy

```bash
pnpm fetch:ndis-list-providers
```

Tries HTTP first, then **rsync** from `NDIS_LIST_PROVIDERS_RSYNC_SOURCE` if set, then rsyncs the bundled snapshot:

```bash
rsync -a public/data/provider-outlets.json data/ndis/list-providers.json
```

Remote example:

```bash
export NDIS_LIST_PROVIDERS_RSYNC_SOURCE=user@devbox:/data/list-providers.json
pnpm fetch:ndis-list-providers
```

## Prisma seed

```bash
pnpm prisma migrate deploy
pnpm seed:ndis-provider-outlets
```

See `docs/data/ndis-provider-registry-prisma.md`.
