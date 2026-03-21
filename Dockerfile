FROM node:22-alpine AS base
WORKDIR /app

# Устанавливаем все зависимости (включая dev — нужны для сборки и миграций)
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# Сборка Next.js
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Минимальный production-образ на основе standalone-вывода Next.js
FROM base AS runner
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
