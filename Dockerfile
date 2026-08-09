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


# Server-side only. The browser must call the web origin so next.config's
# rewrite can send /api/v1/auth/* to the IdP and everything else to the API —
# setting NEXT_PUBLIC_API_URL to a bare origin makes the browser bypass its own
# proxy and aim auth at the service that does not own it.
ARG API_URL=http://api:3001
ARG IDP_URL=http://idp:3005
ENV API_URL=$API_URL
ENV IDP_URL=$IDP_URL
ENV NEXT_PUBLIC_API_URL=""
ENV NEXT_TELEMETRY_DISABLED=1
# Next.js holds the whole route graph in memory and this app has ~470 routes.
# The container default heap is well under what that needs, and V8 aborts with
# SIGABRT rather than anything Next reports, so it reads as a mystery crash.
# The monorepo raised this globally in NODE_OPTIONS for the same reason.
ENV NODE_OPTIONS=--max-old-space-size=8192
RUN npm run build

# ── runtime ─────────────────────────────────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs

EXPOSE 3002
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://localhost:3002/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["npx", "next", "start", "-p", "3002"]
