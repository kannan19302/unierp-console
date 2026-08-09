"use client";
/**
 * Integrations → Catalog.
 * The available SaaS integration catalog from the real `/saas/integrations`
 * module, the ext-gateway built-in integration templates, and integration
 * categories.
 */
import { PackageOpen, ListFilter, Boxes } from "lucide-react";
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

interface AvailableIntegration {
  id: string;
  name: string;
  category?: string;
  description?: string;
  isInstalled?: boolean;
  popularity?: number;
}

interface CatalogCategory {
  category: string;
  count: number;
}

interface BuiltInTemplate {
  name?: string;
  slug?: string;
  provider?: string;
  category?: string;
  authTypes?: string[];
  webhookEvents?: string[];
}

interface ExtensionInstallation {
  id: string;
  extensionId?: string;
  version?: string;
  publisher?: string;
  status?: string;
  installedAt?: string;
}

export default function IntegrationsCatalog() {
  const available = useList<AvailableIntegration>({ path: "/saas/integrations/available" });
  const categories = useList<CatalogCategory>({ path: "/saas/integrations/categories" });
  const templates = useList<BuiltInTemplate>({ path: "/ext-gateway/templates/built-in" });
  const extensions = useList<ExtensionInstallation>({ path: "/extensions" });

  const installedCount = available.data.filter((a) => a.isInstalled).length;

  const stats: StatCardItem[] = [
    { label: "Catalog entries", value: available.total ?? available.data.length, icon: <PackageOpen size={18} /> },
    { label: "Installed", value: installedCount, icon: <Boxes size={18} /> },
    { label: "Categories", value: categories.data.length, icon: <ListFilter size={18} /> },
    { label: "Gateway templates", value: templates.data.length, icon: <PackageOpen size={18} /> },
  ];

  if (available.loading || categories.loading || templates.loading || extensions.loading) {
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
          <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700, margin: 0 }}>Catalog</h2>
          <p style={{ color: "var(--color-text-secondary)", margin: "var(--space-1) 0 0" }}>
            Available SaaS integrations, gateway templates and categories from the platform API.
          </p>
        </div>

        <StatCardRow stats={stats} columns={4} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Available integrations</h3>
          {available.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{available.error.message}</p>
          ) : available.data.length === 0 ? (
            <EmptyState title="No catalog entries" description="The integrations available endpoint returned no rows." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {available.data.map((a) => (
                <li
                  key={a.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 500 }}>{a.name}</div>
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {a.description ?? "—"}
                    </div>
                  </div>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <Badge variant="default">{a.category ?? "—"}</Badge>
                    <Badge variant={a.isInstalled ? "success" : "info"}>
                      {a.isInstalled ? "Installed" : "Available"}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-4)" }}>
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Categories</h3>
            {categories.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{categories.error.message}</p>
            ) : categories.data.length === 0 ? (
              <EmptyState title="No categories" description="The integration categories endpoint returned no rows." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {categories.data.map((c) => (
                  <li
                    key={c.category}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "var(--space-2) 0",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <span>{c.category}</span>
                    <Badge variant="default">{c.count}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Built-in gateway templates</h3>
            {templates.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{templates.error.message}</p>
            ) : templates.data.length === 0 ? (
              <EmptyState title="No templates" description="The ext-gateway built-in templates endpoint returned no rows." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {templates.data.map((t) => (
                  <li
                    key={t.slug ?? t.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "var(--space-2) 0",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{t.name ?? t.slug}</span>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {(t.authTypes ?? []).join(", ") || "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Installed extensions</h3>
            {extensions.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{extensions.error.message}</p>
            ) : extensions.data.length === 0 ? (
              <EmptyState title="No extensions installed" description="The extensions registry endpoint returned no rows." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {extensions.data.map((e) => (
                  <li
                    key={e.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "var(--space-2) 0",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 500 }}>{e.extensionId ?? e.id}</div>
                      <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        {e.publisher ?? "—"} · v{e.version ?? "—"}
                      </div>
                    </div>
                    <Badge
                      variant={
                        e.status === "ENABLED" ? "success" : e.status === "DISABLED" ? "default" : "info"
                      }
                    >
                      {e.status ?? "—"}
                    </Badge>
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
