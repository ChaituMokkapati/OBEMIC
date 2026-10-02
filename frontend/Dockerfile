# 1. Base Image
FROM node:20-bookworm-slim AS base
WORKDIR /app

# 2. Dependencies Stage
FROM base AS deps
COPY package*.json ./
RUN npm install

# 3. Builder Stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:5000/api/v1}
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# 4. Production Runner Stage
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy standalone output and static assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
