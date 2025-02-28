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

FROM base AS transcoderprune
WORKDIR /app
COPY . .
RUN pnpm turbo prune --scope=@workspace/transcoder --docker

FROM base AS transcoderbuilder
WORKDIR /app
COPY --from=transcoderprune /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=transcoderprune /app/out/full/ .
RUN pnpm build
RUN pnpm --filter @workspace/transcoder deploy --prod --frozen-lockfile /out

# Install required packages
RUN apt-get update && apt-get install -y \
    wget \
    xz-utils \
    && rm -rf /var/lib/apt/lists/*

# Install FFmpeg based on architecture
COPY ./apps/transcoder/download.sh download.sh
RUN bash download.sh


FROM base AS transcoderrunner
WORKDIR /app



# COPY ./apps/transcoder/download.sh download.sh
# RUN bash download.sh

# # Install FFmpeg based on architecture
# RUN if [ "$(uname -m)" = "aarch64" ]; then \
#         wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-arm64-static.tar.xz \
#         && tar xf ffmpeg-release-arm64-static.tar.xz \
#         && mv ffmpeg-*-arm64-static/ffmpeg /usr/local/bin/ \
#         && mv ffmpeg-*-arm64-static/ffprobe /usr/local/bin/ \
#         && rm -rf ffmpeg-*-arm64-static*; \
#     else \
#         wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz \
#         && tar xf ffmpeg-release-amd64-static.tar.xz \
#         && mv ffmpeg-*-amd64-static/ffmpeg /usr/local/bin/ \
#         && mv ffmpeg-*-amd64-static/ffprobe /usr/local/bin/ \
#         && rm -rf ffmpeg-*-amd64-static*; \
#     fi \
#     && chmod +x /usr/local/bin/ffmpeg \
#     && chmod +x /usr/local/bin/ffprobe

# # Install Shaka Packager based on architecture
# RUN if [ "$(uname -m)" = "aarch64" ]; then \
#         wget https://github.com/shaka-project/shaka-packager/releases/download/v2.6.1/packager-linux-arm64 \
#         && mv packager-linux-arm64 /usr/local/bin/packager; \
#     else \
#         wget https://github.com/shaka-project/shaka-packager/releases/download/v2.6.1/packager-linux-x64 \
#         && mv packager-linux-x64 /usr/local/bin/packager; \
#     fi \
#     && chmod +x /usr/local/bin/packager

# Copy application files
COPY --from=transcoderbuilder /out/dist .
COPY --from=transcoderbuilder /out/node_modules ./node_modules
COPY --from=transcoderbuilder /out/package.json .
COPY --from=transcoderbuilder /app/packages/database/generated ./packages/database/generated
COPY --from=transcoderbuilder /app/ffmpeg /usr/local/bin/ffmpeg
COPY --from=transcoderbuilder /app/ffprobe /usr/local/bin/ffprobe
COPY --from=transcoderbuilder /app/packager /usr/local/bin/packager
RUN chmod +x /usr/local/bin/ffmpeg
RUN chmod +x /usr/local/bin/ffprobe
RUN chmod +x /usr/local/bin/packager



ENV AUTH_TRUST_HOST=true
CMD [ "node", "index.js" ]