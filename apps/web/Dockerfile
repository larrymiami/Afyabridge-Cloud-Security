FROM node:22.14.0-alpine AS build

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV APP_ENV=development
ENV APP_COUNTRY=KE
ENV APP_BASE_URL=http://localhost:3000
ENV DATABASE_URL=postgresql://afyabridge:afyabridge-local-only@127.0.0.1:5432/afyabridge
ENV LOG_LEVEL=info

RUN corepack enable && corepack prepare pnpm@10.14.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
COPY scripts ./scripts

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @afyabridge/web build

FROM node:22.14.0-alpine AS runtime

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN corepack enable && corepack prepare pnpm@10.14.0 --activate

WORKDIR /app

COPY --from=build --chown=node:node /app /app

USER node
EXPOSE 3000

CMD ["pnpm", "--filter", "@afyabridge/web", "start"]
