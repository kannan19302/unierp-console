# unierp-console — L4.
#
# Built from THIS repository alone; `@unerp/*` comes from the registry.
#
#   docker build -t unierp-console .

# ── build ───────────────────────────────────────────────────────────────────
FROM node:22-slim AS builder
WORKDIR /app

COPY package.json package-lock.json* ./

# See unierp-api's Dockerfile for why the registry is written into a
# project-level .npmrc and why the lockfile's tarball host is rewritten: npm's
# precedence puts the project file above the user config, and a lockfile written
# against `localhost` only installs on the machine that wrote it.
ARG UNIERP_REGISTRY=https://registry.npmjs.org/
RUN printf '@kannan19302:registry=%s\nregistry=https://registry.npmjs.org/\n' "$UNIERP_REGISTRY" > .npmrc \
 && rm -f package-lock.json \
 && npm install --no-audit --no-fund --legacy-peer-deps

COPY tsconfig.json next.config.mjs next-env.d.ts ./
COPY src ./src
COPY app ./app

# ── dev ─────────────────────────────────────────────────────────────────────
FROM builder AS dev
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--max-old-space-size=8192
EXPOSE 3002
CMD ["npx", "next", "dev", "-p", "3002", "-H", "0.0.0.0"]

# ── build ───────────────────────────────────────────────────────────────────
FROM dev AS prod-builder
ARG API_URL=http://api:3001
ARG IDP_URL=http://idp:3005
ENV API_URL=$API_URL
ENV IDP_URL=$IDP_URL
ENV NEXT_PUBLIC_API_URL=""
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--max-old-space-size=8192
RUN npm run build

# ── runtime ─────────────────────────────────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=prod-builder /app/node_modules ./node_modules
COPY --from=prod-builder /app/.next ./.next

COPY --from=prod-builder /app/package.json ./package.json
COPY --from=prod-builder /app/next.config.mjs ./next.config.mjs

EXPOSE 3002
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://localhost:3002/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["npx", "next", "start", "-p", "3002"]
