FROM node:24-alpine AS base
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/contracts/package.json packages/contracts/
COPY packages/examples/package.json packages/examples/

FROM base AS build
RUN npm ci --no-audit --no-fund
COPY packages/contracts packages/contracts
COPY apps/api apps/api
RUN npm run build -w @semantic/contracts && npm run build -w @semantic/api

FROM base AS migrate
RUN npm ci -w @semantic/api --no-audit --no-fund && rm -rf /root/.npm /root/.cache
COPY apps/api/prisma apps/api/prisma
WORKDIR /app/apps/api
USER node
CMD ["npx", "prisma", "migrate", "deploy"]

FROM base AS runtime
ENV NODE_ENV=production
RUN npm ci --omit=dev --omit=optional -w @semantic/api --no-audit --no-fund && rm -rf /root/.npm /root/.cache
COPY --from=build /app/apps/api/node_modules/.prisma apps/api/node_modules/.prisma
COPY --from=build /app/packages/contracts/dist packages/contracts/dist
COPY --from=build /app/apps/api/dist apps/api/dist
WORKDIR /app/apps/api
USER node
EXPOSE 3001
CMD ["node", "dist/main.js"]
