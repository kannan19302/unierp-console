<!-- UniERP-Agent-Protocol: 1.1.0 -->
# UniERP Repository Agent Entrypoint: Provider Admin (`provider-admin`)

This repository is one delivery unit in the UniERP polyrepo. Before analysis, planning, review, or mutation, every
AI agent from every provider MUST read and follow:

1. the workspace entrypoint at [`../AGENTS.md`](../AGENTS.md);
2. the canonical standard at
   [`../platform/docs/standards/AI_AGENT_DEVELOPMENT_PROTOCOL.md`](../platform/docs/standards/AI_AGENT_DEVELOPMENT_PROTOCOL.md);
3. the owning platform documents selected through
   [`../platform/docs/PLATFORM_CATALOG.md`](../platform/docs/PLATFORM_CATALOG.md).

If the workspace entrypoint or canonical standard is unavailable, the protocol bundle is incomplete. The agent
MUST stop before mutation and report the missing dependency. This bootstrap adds no weaker or conflicting rules.
Repository-specific additions may be appended below only when they narrow implementation behavior without
redefining platform ownership, security, contracts, or cross-platform standards.

---

## 1. Repository Identity & Mission

- **Repository**: `provider-admin`
- **Platform Owner**: `PLT-PAO` (Platform Administration & Operations)
- **Architectural Layer**: **Layer 4 (Application & Control Plane)**
- **Runtime Port**: `4001`
- **Mission**: Host the **Provider Control Center (PCC)** — the multi-cluster, cloud operator management plane for platform administrators, SREs, and operations personnel managing global tenant lifecycles, billing operations, system health, and threat intelligence.

---

## 2. Zero-Trust Security & Control-Plane Authority

1. **Provider Isolation**:
   - Operator authority (`pcc.*`) MUST NEVER cross into tenant authority (`occ.*`).
   - Requests require operator session verification via Sovereign IdP and explicit role gating (`SUPER_ADMIN` / `PLATFORM_OPERATOR`).
2. **Break-Glass & Mutating Operations**:
   - Destructive operations (tenant suspension, database maintenance, key rotation) require two-person verification (`TwoPersonControlGuard`) and immutable audit logging.
3. **Defense in Depth**:
   - Zero-trust input validation via Zod schemas on all API proxy routes.
   - Secure server-side session cookies; zero bearer tokens stored in browser localStorage.
4. **Secret Quarantine**:
   - Never commit or log API keys, private keys, or credentials. Use synthetic test fixtures.

---

## 3. Industrial Software Engineering Standards (Anti-Vibe-Coding)

1. **Strict Static Typing**:
   - Strict TypeScript mode enabled; zero implicit `any` in public boundaries or data access methods.
   - All server responses and navigation descriptors must strictly implement contracts from `@kannan19302/contracts`.
2. **Strict Zero-Mock Policy**:
   - Never mock live metrics or system health with hardcoded timer intervals or random math in production code.
   - Use real WebSocket subscriptions (`useConsoleSocket`) and live telemetry endpoints.
   - When services are degraded, render explicit `ErrorState` or `DegradedState` envelopes — never hide faults behind synthetic fallbacks.
3. **Strata DL 2.0 Compliance**:
   - Mandatory `OpsShell` and `DataWorkspace` floorplans.
   - High-density operational data tables (`data-density="compact"`).
   - Zero raw hex codes or inline styles; 100% tokens from `@kannan19302/ui`.
   - WCAG 2.2 AA compliant keyboard navigation across all 22 PCC control centers.

---

## 4. Verification Gates & Mandatory Toolchain

Before declaring any cycle `DONE`, run and verify:

```powershell
pnpm typecheck              # Strict TypeScript verification (tsc --noEmit)
pnpm lint                   # ESLint standards verification
pnpm test                   # Vitest unit & component test suite
node scripts/check-layer.mjs # Canonical Layer Gate enforcement
```
