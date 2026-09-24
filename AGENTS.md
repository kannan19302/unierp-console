    <!-- UniERP-Agent-Protocol: 1.1.0 -->
    # provider-admin agent rules

    This is the only repository agent instruction file. Read [the workspace entrypoint](../AGENTS.md),
    the [canonical protocol](../platform/docs/standards/AI_AGENT_DEVELOPMENT_PROTOCOL.md),
    the enterprise brain, applicable accepted ADRs and the owning platform requirements before
    material work. Follow authority precedence; this file narrows implementation behavior only.
    If a required authority is missing, stop before mutation.

    **Layer:** L4. **Accountable platform:** PLT-PAO. **Scope:** Provider control plane and support operations.
    Resolve actual dependencies, packages and scripts from current manifests and the platform catalog.
    Preserve unrelated changes. Define numbered acceptance criteria and a knowledge delta before editing.
    For coordinated changes, publish the change contract, validate upstream first, and hand off
    to downstream consumers with exact evidence.

    ## Repository rules

    - Use pcc authority only; do not silently exercise occ or tenant business authority. Bound privileged access by target, purpose, time and audit.
- Require server-side controls and approval for high-impact actions. Never expose secrets or invent telemetry.
- Prove provisioning, suspension/recovery, health, billing visibility and support paths with wrong-role and provider/tenant crossover negatives.

    ## Verification

    Run applicable commands from this repository, plus risk-specific contract, security, data,
    accessibility, integration, migration or release gates required by the canonical protocol:
    pnpm typecheck; pnpm lint; pnpm check:tokens; pnpm test; pnpm build; focused pnpm test:e2e; node ../platform/workspace/scripts/check-layer.mjs

    A command's presence here is not proof that it ran. Report exact results, failures and NOT RUN
    reasons; review the diff; then follow the canonical status and source-control procedure.
