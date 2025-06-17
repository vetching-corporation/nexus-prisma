# Hello World

### Try It

```
docker run --detach --publish 5432:5432 -e POSTGRES_PASSWORD=postgres --name 'nexus-schema-plugin-prisma-hello-world' postgres:10.12
```

```
pnpm -s prisma generate
pnpm -s prisma migrate reset --preview-feature
```

```
pnpm && pnpm dev
```
