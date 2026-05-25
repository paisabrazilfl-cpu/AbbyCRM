FROM node:22-slim AS app

WORKDIR /app

ENV NODE_ENV=production
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"

COPY . .

RUN corepack enable \
  && corepack prepare pnpm@10.26.1 --activate \
  && pnpm install --no-frozen-lockfile \
  && pnpm --filter @workspace/api-server run build

CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/server/index.mjs"]
