"use client";
/**
 * Integrations → Mapping.
 * Field mappings between enrichment sources and target entities from the CRM
 * enrichment API, plus term synonym groups from enterprise search.
 */
import { GitMerge, Braces, Bookmark } from "lucide-react";
import {
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  Badge,
  type StatCardItem,
} from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface FieldMapping {
  id: string;
  sourceId?: string;
  ruleId?: string;
  sourceField?: string;
  targetField?: string;
  targetEntity?: string;
  transform?: string | null;
  customScript?: string | null;
  overwrite?: boolean;
  createdAt?: string;
}

interface SynonymGroup {
  id: string;
  term?: string;
  name?: string;
  synonyms?: string[];
  isOneWay?: boolean;
  isActive?: boolean;
}

interface SavedSearch {
  id?: string;
  name?: string;
  query?: string;
  scope?: string;
  isDefault?: boolean;
  createdAt?: string;
}

export default function IntegrationsMapping() {
  const mappings = useList<FieldMapping>({ path: "/crm/lead-enrichment/field-mappings" });
  const synonyms = useList<SynonymGroup>({ path: "/communication/enterprise-search/synonyms" });
  const saved = useList<SavedSearch>({ path: "/communication/enterprise-search/saved" });

  const stats: StatCardItem[] = [
    { label: "Field mappings", value: mappings.total ?? mappings.data.length, icon: <GitMerge size={18} /> },
    { label: "Synonym groups", value: synonyms.data.length, icon: <Braces size={18} /> },
    { label: "Saved searches", value: saved.data.length, icon: <Bookmark size={18} /> },
  ];

  if (mappings.loading || synonyms.loading || saved.loading) {
    return (
      <DomainShell
        domainId="integrations"
        title="Integrations"
        description="SaaS integrations, connectors, credentials and gateway activity across the platform."
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="integrations"
      title="Integrations"
      description="SaaS integrations, connectors, credentials and gateway activity across the platform."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <div>
          <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700, margin: 0 }}>Mapping</h2>
          <p style={{ color: "var(--color-text-secondary)", margin: "var(--space-1) 0 0" }}>
            Field-level mappings and term synonym groups across connected data planes.
          </p>
        </div>

        <StatCardRow stats={stats} columns={3} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Field mappings</h3>
          {mappings.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{mappings.error.message}</p>
          ) : mappings.data.length === 0 ? (
            <EmptyState title="No field mappings" description="The lead-enrichment field-mappings endpoint returned no rows." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {mappings.data.slice(0, 20).map((m) => (
                <li
                  key={m.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <code style={{ fontSize: "var(--text-sm)" }}>{m.sourceField ?? "—"}</code>
                    <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>→</span>
                    <code style={{ fontSize: "var(--text-sm)" }}>{m.targetField ?? "—"}</code>
                  </div>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <Badge variant="info">{m.targetEntity ?? "—"}</Badge>
                    <Badge variant={m.transform && m.transform !== "NONE" ? "primary" : "default"}>{m.transform ?? "—"}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-4)" }}>
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Synonym groups</h3>
            {synonyms.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{synonyms.error.message}</p>
            ) : synonyms.data.length === 0 ? (
              <EmptyState title="No synonym groups" description="The enterprise-search synonyms endpoint returned no rows." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {synonyms.data.map((s) => (
                  <li key={s.id} style={{ display: "flex", flexDirection: "column", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 500 }}>{s.term ?? s.name ?? s.id}</span>
                      <Badge variant={s.isActive === false ? "default" : "success"}>
                        {s.isActive === false ? "Inactive" : "Active"}
                      </Badge>
                    </div>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {(s.synonyms ?? []).join(", ") || "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Saved searches</h3>
            {saved.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{saved.error.message}</p>
            ) : saved.data.length === 0 ? (
              <EmptyState title="No saved searches" description="The enterprise-search saved endpoint returned no rows." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {saved.data.map((s) => (
                  <li key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                    <span style={{ fontWeight: 500 }}>{s.name ?? s.query}</span>
                    <Badge variant={s.isDefault ? "primary" : "default"}>{s.scope ?? "ALL"}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </DomainShell>
  );
}