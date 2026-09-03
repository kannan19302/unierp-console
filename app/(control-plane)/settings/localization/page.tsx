"use client";
/**
 * Settings → Localization.
 *
 * Locales, per-locale formatting rules, glossary terms, translation-memory
 * entries and fallback chains — real reads from the `admin/localization`
 * surface. Every section renders honest loading/error/empty states.
 */
import { BookOpen, Globe, Languages, Layers } from "lucide-react";
import {
  Badge,
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  type StatCardItem,
} from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface LocaleRow {
  id: string;
  code: string;
  name?: string;
  direction?: string;
  isActive?: boolean;
  isDefault?: boolean;
  sortOrder?: number;
  _count?: { translations?: number };
}

interface FormattingRule {
  id: string;
  locale?: { code?: string; name?: string } | null;
  dateFormat?: string;
  timeFormat?: string;
  numberFormat?: string;
  currencyCode?: string;
  currencySymbol?: string;
  firstDayOfWeek?: number;
  timezone?: string;
}

interface GlossaryEntry {
  id: string;
  term: string;
  contextId?: string;
  definition?: string;
  translation?: string;
  usage?: string;
  archivedAt?: string | null;
}

interface MemoryEntry {
  id: string;
  sourceText?: string;
  sourceLocale?: string;
  targetLocale?: string;
  translatedText?: string;
  matchType?: string;
  matchScore?: number;
  approvedAt?: string | null;
}

interface FallbackChain {
  id: string;
  localeCode?: string;
  fallbackOrder?: string[];
}

export default function LocalizationSettingsPage() {
  const locales = useList<LocaleRow>({ path: "/admin/localization/locales" });
  const rules = useList<FormattingRule>({ path: "/admin/localization/formatting-rules" });
  const glossary = useList<GlossaryEntry>({ path: "/admin/localization/glossary" });
  const memory = useList<MemoryEntry>({ path: "/admin/localization/translation-memory" });
  const falls = useList<FallbackChain>({ path: "/admin/localization/fallback-chains" });

  const activeLocales = locales.data.filter((l) => l.isActive).length;

  const stats: StatCardItem[] = [
    { label: "Locales", value: locales.data.length, icon: <Globe size={18} /> },
    { label: "Active locales", value: activeLocales, icon: <Languages size={18} /> },
    { label: "Formatting rules", value: rules.data.length, icon: <Layers size={18} /> },
    { label: "Glossary terms", value: glossary.data.length, icon: <BookOpen size={18} /> },
    { label: "Memory entries", value: memory.data.length, icon: <Layers size={18} /> },
  ];

  if (
    locales.loading ||
    rules.loading ||
    glossary.loading ||
    memory.loading ||
    falls.loading
  ) {
    return (
      <DomainShell domainId="settings" title="Localization">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="lg" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="settings"
      title="Localization"
      description="Locales, formatting rules, glossary, translation memory and fallback chains."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={5} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "var(--space-4)" }}>
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Locales</h3>
            {locales.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
                {locales.error.message}
              </p>
            ) : locales.data.length === 0 ? (
              <div style={{ margin: "var(--space-3) 0 0" }}>
                <EmptyState title="No locales" description="The locales endpoint returned no rows." />
              </div>
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {locales.data.slice(0, 30).map((l) => (
                  <li key={l.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                    <span>
                      <span style={{ fontWeight: 500 }}>{l.name ?? l.code}</span>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginLeft: "var(--space-2)" }}>
                        {l.code} · {l.direction ?? "—"}
                      </span>
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      {l._count?.translations != null && (
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                          {l._count.translations} translations
                        </span>
                      )}
                      {l.isDefault && <Badge variant="primary">DEFAULT</Badge>}
                      <Badge variant={l.isActive ? "success" : "default"}>
                        {l.isActive ? "ACTIVE" : "INACTIVE"}
                      </Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Formatting rules</h3>
            {rules.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
                {rules.error.message}
              </p>
            ) : rules.data.length === 0 ? (
              <div style={{ margin: "var(--space-3) 0 0" }}>
                <EmptyState title="No formatting rules" description="The formatting-rules endpoint returned no rows." />
              </div>
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {rules.data.slice(0, 20).map((r) => (
                  <li key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                    <span style={{ fontWeight: 500 }}>{r.locale?.name ?? r.locale?.code ?? "—"}</span>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {r.currencySymbol ?? "—"} {r.currencyCode ?? ""} · {r.dateFormat ?? "—"} · {r.timezone ?? "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "var(--space-4)" }}>
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Glossary</h3>
            {glossary.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
                {glossary.error.message}
              </p>
            ) : glossary.data.length === 0 ? (
              <div style={{ margin: "var(--space-3) 0 0" }}>
                <EmptyState title="No glossary terms" description="The glossary endpoint returned no entries." />
              </div>
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {glossary.data.slice(0, 20).map((g) => (
                  <li key={g.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                    <span style={{ fontWeight: 500 }}>{g.term}</span>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {g.definition ?? g.translation ?? "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Translation memory</h3>
            {memory.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
                {memory.error.message}
              </p>
            ) : memory.data.length === 0 ? (
              <div style={{ margin: "var(--space-3) 0 0" }}>
                <EmptyState title="No translation memory" description="The translation-memory endpoint returned no entries." />
              </div>
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {memory.data.slice(0, 20).map((m) => (
                  <li key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                    <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>
                      {m.sourceText ?? "—"}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        {m.sourceLocale ?? "—"} → {m.targetLocale ?? "—"}
                      </span>
                      {m.matchScore != null && <Badge variant="info">{m.matchScore}%</Badge>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Fallback chains</h3>
          {falls.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
              {falls.error.message}
            </p>
          ) : falls.data.length === 0 ? (
            <div style={{ margin: "var(--space-3) 0 0" }}>
              <EmptyState title="No fallback chains" description="The fallback-chains endpoint returned no chains." />
            </div>
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {falls.data.slice(0, 20).map((f) => (
                <li key={f.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ fontWeight: 500 }}>{f.localeCode ?? "—"}</span>
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                    {(f.fallbackOrder ?? []).join(" → ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </DomainShell>
  );
}