# # src Dockerfile: https://github.com/vercel/turbo/blob/main/examples/with-docker/apps/web/Dockerfile
# FROM node:22-bullseye-slim AS alpine

# # setup pnpm on the alpine base
# FROM alpine AS base

# ARG TURBO_API="https://turbocache.chadasaniya.in"
# ARG TURBO_TOKEN="123"
# ARG TURBO_TEAM="dhruv2015"

# ENV TURBO_API=$TURBO_API
# ENV TURBO_TOKEN=$TURBO_TOKEN
# ENV TURBO_TEAM=$TURBO_TEAM
# ENV CI=true


# ENV PNPM_HOME="/pnpm"
# ENV PATH="$PNPM_HOME:$PATH"
# RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
# # RUN apk add --no-cache libc6-compat && rm -rf /var/cache/apk/*
# RUN pnpm install turbo --global

# WORKDIR /app
# COPY . .
# RUN pnpm install --frozen-lockfile
# RUN pnpm build && pnpm --filter @workspace/api deploy --prod --frozen-lockfile /out

# WORKDIR /out

# src Dockerfile: https://github.com/vercel/turbo/blob/main/examples/with-docker/apps/web/Dockerfile

















# # api done
# FROM node:22-bullseye-slim AS base
# ENV CI=true

# ARG TURBO_API="https://turbocache.chadasaniya.in"
# ARG TURBO_TOKEN="123"
# ARG TURBO_TEAM="dhruv2015"

# ENV TURBO_API=$TURBO_API
# ENV TURBO_TOKEN=$TURBO_TOKEN
# ENV TURBO_TEAM=$TURBO_TEAM


# ENV PNPM_HOME="/pnpm"
# ENV PATH="$PNPM_HOME:$PATH"
# RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
# # RUN apk add --no-cache libc6-compat && rm -rf /var/cache/apk/*
# RUN pnpm install turbo@2.4.0 --global


# FROM base AS apiprune
# WORKDIR /app

# COPY . .
# RUN pnpm turbo prune --scope=@workspace/api --docker


# FROM base AS apibuilder

# WORKDIR /app
# COPY --from=apiprune /app/out/json/ .
# RUN pnpm install --frozen-lockfile
# COPY --from=apiprune /app/out/full/ .
# RUN pnpm build
# RUN pnpm --filter @workspace/api deploy --prod --frozen-lockfile /out


# FROM base AS apirunner
# WORKDIR /app
# COPY --from=apibuilder /out/node_modules ./node_modules
# COPY --from=apibuilder /out/dist .
# COPY --from=apibuilder /out/package.json .
# COPY --from=apibuilder /app/packages/database/generated ./packages/database/generated
# RUN node init.js

# CMD [ "node", "index.js" ]


FROM node:22-bullseye-slim AS base
ENV CI=true

ARG TURBO_API="https://turbocache.chadasaniya.in"
ARG TURBO_TOKEN="123"
ARG TURBO_TEAM="dhruv2015"

ENV TURBO_API=$TURBO_API
ENV TURBO_TOKEN=$TURBO_TOKEN
ENV TURBO_TEAM=$TURBO_TEAM


ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
# RUN apk add --no-cache libc6-compat && rm -rf /var/cache/apk/*
RUN pnpm install turbo@2.4.0 --global


FROM base AS apiprune
WORKDIR /app

COPY . .
RUN pnpm turbo prune --scope=@workspace/api --docker

FROM base AS webprune
WORKDIR /app
COPY . .
RUN pnpm turbo prune --scope=@workspace/web --docker


FROM base AS apibuilder

WORKDIR /app
COPY --from=apiprune /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=apiprune /app/out/full/ .
RUN pnpm build
RUN pnpm --filter @workspace/api deploy --prod --frozen-lockfile /out


FROM base AS webbuilder
WORKDIR /app
COPY --from=webprune /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=webprune /app/out/full/ .
RUN pnpm build


FROM base AS apirunner
WORKDIR /app
COPY --from=apibuilder /out/dist .
COPY --from=apibuilder /out/node_modules ./node_modules
COPY --from=apibuilder /out/package.json .
COPY --from=apibuilder /app/packages/database/generated ./packages/database/generated
ENV AUTH_TRUST_HOST=true
CMD [ "node", "index.js" ]


FROM base AS webrunner
WORKDIR /app
COPY --from=webbuilder /app/apps/web/.next/standalone ./
COPY --from=webbuilder /app/apps/web/.next/static ./apps/web/.next/static
ENV AUTH_TRUST_HOST=true
CMD ["node", "apps/web/server.js"]