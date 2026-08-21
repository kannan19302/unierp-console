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

# ── local package build (DEV ONLY) ──────────────────────────────────────────
#
# Two subpaths this app imports exist in the local packages but NOT in the
# published tarballs of the same version number:
#
#   @kannan19302/shared/auth-client        OIDC client, PKCE, useSession
#   @kannan19302/ui/shell                  PlatformShell, PlatformWizardGrid
#
# shared@1.0.5 on the registry has no dist/auth-client at all, and its exports
# map is the older catch-all `"./*": "./dist/*/index.js"` rather than the
# explicit "./auth-client/react" entry the local package declares. ui@1.0.15
# likewise ships no "./shell". Neither version was bumped when those subpaths
# were added, so npm resolves a package that looks correct by version and is
# missing the code — the failure surfaces as a Next.js "Module not found" at
# request time rather than at install time, which is why it reads as an app bug.
#
# This stage is deliberately IDENTICAL (byte for byte, and rooted at
# node:22-slim rather than at this app's `builder`) in every platform
# Dockerfile that needs the overlay. That is what lets BuildKit hash it to the
# same cache key and build shared + design-system ONCE for the whole platform,
# instead of once per image. Keep it identical, or every image pays the compile
# again.
#
# DEV target only — prod-builder still builds against the registry, so
# publishing stays the real release path and a released image never silently
# depends on a developer's working tree. Sources come from the `localpkgs`
# named build context (repo root, wired in infra/docker-compose.platform.yml).
FROM node:22-slim AS localpkgs-build
WORKDIR /build

# tsconfig.base.json is required, not optional: a missing `extends` target makes
# tsc fall back to its ES3/ES5 defaults and report dozens of spurious
# "Property 'padStart' does not exist" errors instead of the real cause.
COPY --from=localpkgs shared/package.json shared/tsconfig.json shared/tsconfig.base.json ./shared/
COPY --from=localpkgs shared/src ./shared/src
RUN cd shared && npm install --no-audit --no-fund --legacy-peer-deps && npm run build

# The design-system build is more than `tsc`: it also copies CSS, re-hoists the
# "use client" directives tsc strips, and bundles CSS modules — so scripts/ has
# to come across or `npm run build` dies on a missing module.
COPY --from=localpkgs design-system/package.json design-system/tsconfig.json design-system/tsconfig.base.json design-system/tsconfig.build.json ./ui/
COPY --from=localpkgs design-system/src ./ui/src
COPY --from=localpkgs design-system/scripts ./ui/scripts
RUN cd ui && npm install --no-audit --no-fund --legacy-peer-deps && npm run build

# ── local package overlay (DEV ONLY) ────────────────────────────────────────
# Drop the registry copies and put the locally built ones in their place. Only
# dist/ and package.json are needed at runtime; node_modules comes from the
# build above so the packages' own deps resolve.
FROM builder AS localdeps
COPY --from=localpkgs-build /build/shared/package.json /tmp/shared/package.json
COPY --from=localpkgs-build /build/shared/dist /tmp/shared/dist
COPY --from=localpkgs-build /build/shared/node_modules /tmp/shared/node_modules
COPY --from=localpkgs-build /build/ui/package.json /tmp/ui/package.json
COPY --from=localpkgs-build /build/ui/dist /tmp/ui/dist
COPY --from=localpkgs-build /build/ui/node_modules /tmp/ui/node_modules
RUN rm -rf node_modules/@kannan19302/shared node_modules/@kannan19302/ui \
 && mkdir -p node_modules/@kannan19302 \
 && mv /tmp/shared node_modules/@kannan19302/shared \
 && mv /tmp/ui node_modules/@kannan19302/ui

# ── dev ─────────────────────────────────────────────────────────────────────
FROM localdeps AS dev
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--max-old-space-size=8192
EXPOSE 4002
CMD ["npx", "next", "dev", "-p", "4002", "-H", "0.0.0.0"]

# ── build ───────────────────────────────────────────────────────────────────
# FROM builder, not dev: the production artifact is built against the registry,
# so a published release never silently depends on a developer's working tree.
# The ENVs below were previously inherited from the dev stage; they are set
# explicitly now that this no longer descends from it.
FROM builder AS prod-builder
ENV NODE_ENV=development
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

EXPOSE 4002
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://localhost:4002/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["npx", "next", "start", "-p", "4002"]
