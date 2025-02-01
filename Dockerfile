# src Dockerfile: https://github.com/vercel/turbo/blob/main/examples/with-docker/apps/web/Dockerfile
FROM node:22.12.0-alpine3.20 AS alpine

# setup pnpm on the alpine base
FROM alpine AS base

ARG TURBO_API="https://turbocache.chadasaniya.in"
ARG TURBO_TOKEN="123"
ARG TURBO_TEAM="dhruv2015"

ENV TURBO_API=$TURBO_API
ENV TURBO_TOKEN=$TURBO_TOKEN
ENV TURBO_TEAM=$TURBO_TEAM
ENV CI=true


ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
RUN apk add --no-cache libc6-compat && rm -rf /var/cache/apk/*
RUN pnpm install turbo --global


FROM base AS builderweb

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
# Set working directory
WORKDIR /app
COPY . .
RUN turbo prune --scope=@workspace/web --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installerweb
WORKDIR /app

# First install the dependencies (as they change less often)
# COPY ./.gitignore ./.gitignore
COPY --from=builderweb /app/out/json/ .
COPY --from=builderweb /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builderweb /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile

# Build the project
COPY --from=builderweb /app/out/full/ .
COPY turbo.json turbo.json

# Uncomment and use build args to enable remote caching
# ARG TURBO_TEAM
# ENV TURBO_TEAM=$TURBO_TEAM
# /app/apps/web

# ARG TURBO_TOKEN
# ENV TURBO_TOKEN=$TURBO_TOKEN
# COPY .env .
RUN turbo run build --filter=@workspace/web

# use alpine as the thinest image
FROM alpine AS webrunner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=installerweb /app/apps/web/package.json .
COPY --from=installerweb /app/apps/web/next.config.mjs .

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=installerweb --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=installerweb --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
# COPY --from=installerweb --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

CMD node apps/web/server.js

# web builed






FROM base AS builderapi
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
# Set working directory
WORKDIR /app
COPY . .
RUN turbo prune --scope=@workspace/api --docker


FROM base AS installerapi
WORKDIR /app

# First install the dependencies (as they change less often)
# COPY ./.gitignore ./.gitignore
COPY --from=builderapi /app/out/json/ .
COPY --from=builderapi /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builderapi /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile

# Build the project
COPY --from=builderapi /app/out/full/ .
COPY turbo.json turbo.json

# Uncomment and use build args to enable remote caching
# ARG TURBO_TEAM
# ENV TURBO_TEAM=$TURBO_TEAM

# ARG TURBO_TOKEN
# ENV TURBO_TOKEN=$TURBO_TOKEN

RUN turbo run build --filter=@workspace/api

RUN --mount=type=cache,id=pnpm-store-api,target=/pnpm/store pnpm --filter @workspace/api deploy --prod --frozen-lockfile --ignore-scripts ./out
# RUN --mount=type=cache,id=pnpm-store-api,target=/pnpm/store pnpm --filter @workspace/api deploy --prod --frozen-lockfile --offline --ignore-scripts ./out



# use alpine as the thinest image
FROM alpine AS apirunner

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 express

WORKDIR /app
RUN mkdir -p /app/logs && chown -R express:nodejs /app

# COPY --from=installerapi /app/apps/api/package.json .

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
# COPY --from=installerapi --chown=express:nodejs /app/out .
COPY --from=installerapi --chown=express:nodejs /app/out/dist .
COPY --from=installerapi --chown=express:nodejs /app/out/node_modules ./node_modules
COPY --from=installerapi --chown=express:nodejs /app/out/package.json .
COPY --from=installerapi --chown=express:nodejs /app/packages/database/generated ./packages/database/generated


USER express
# CMD /bin/sh
CMD node index.js
# CMD node ./dist/index.js
# CMD node ./apps/api/dist/index.js




# apirunner and webrunner