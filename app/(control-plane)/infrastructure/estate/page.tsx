"use client";
/**
 * Infrastructure → Estate.
 * M15 — server-side search/filter/sort across every resource kind (M07),
 * with a multi-select bulk plan wired to the M15 BulkOperationService.
 * Composed entirely from B11's enterprise patterns and DataTable's built-in
 * selection/sort: no hand-rolled table, no client-side pagination — the
 * estate can hold far more than fits in a browser tab.
 */
import { useState } from "react";
import {
  Card,
  Badge,
  Input,
  Button,
  DataTable,
  Pagination,
  FilterBar,
  SavedViewSwitcher,
  ConfirmDialog,
  ErrorState,
  ForbiddenState,
  usePermission,
  useToast,
  type SortOrder,
  type SavedView,
} from "@kannan19302/ui";
import { useList, useMutation } from "@/lib/data";
import { api } from "@/lib/api";
import DomainShell from "@/components/domain-shell";

interface EstateResource {
  id: string;
  name: string;
  kindName: string;
  createdAt: string;
}

interface UnattributedEntry {
  resourceId: string;
  name: string;
  kindName: string;
  ageMs: number;
  missingFields: string[];
}

function formatAge(ageMs: number): string {
  const days = Math.floor(ageMs / (24 * 60 * 60 * 1000));
  if (days >= 1) return `${days}d`;
  const hours = Math.floor(ageMs / (60 * 60 * 1000));
  if (hours >= 1) return `${hours}h`;
  return `${Math.max(0, Math.floor(ageMs / 60000))}m`;
}

const PAGE_SIZE = 25;

const SAVED_VIEWS: SavedView[] = [
  { id: "all", name: "All resources" },
  { id: "dns-zone", name: "DNS zones" },
  { id: "db-instance", name: "Database instances" },
];

export default function InfrastructureEstate() {
  const canRead = usePermission("system.estate.read");
  const canBulk = usePermission("system.estate.bulk");

  const [activeView, setActiveView] = useState("all");
  const [nameQuery, setNameQuery] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const kindName = activeView === "all" ? undefined : activeView;
  const cursor = (page - 1) * PAGE_SIZE;

  const estate = useList<EstateResource>({
    path: "/platform/v1/estate/resources",
    params: {
      kind: kindName,
      q: nameQuery || undefined,
      sortBy: sortBy as "name" | "createdAt",
      sortDir: sortOrder,
      cursor,
      limit: PAGE_SIZE,
    },
    disabled: !canRead,
  });

  // M18 — never hidden: rendered unconditionally whenever there's anything
  // in it, not tucked behind a filter toggle someone has to know to flip.
  const unattributed = useList<UnattributedEntry>({
    path: "/platform/v1/estate/unattributed",
    disabled: !canRead,
  });

  const total = estate.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const toast = useToast();
  const bulkArchive = useMutation(async (resourceIds: string[]) =>
    api.post("/platform/v1/estate/bulk", {
      kind: kindName ?? "mixed",
      resourceIds,
      proposedState: { archived: true },
    }),
  );

  const runBulkArchive = async () => {
    setConfirmOpen(false);
    try {
      const result = (await bulkArchive.run(selectedKeys)) as {
        status: string;
        items: Array<{ resourceId: string; status: string; error?: string }>;
      };
      const failed = result.items.filter((it) => it.status === "FAILED");
      if (failed.length > 0) {
        toast.warning(
          `${failed.length} of ${result.items.length} items failed`,
          failed.map((f) => `${f.resourceId}: ${f.error}`).join("; "),
        );
      } else {
        toast.success(`${result.items.length} resources archived`);
      }
      setSelectedKeys([]);
      estate.reload();
    } catch (e) {
      toast.error("Bulk archive failed", e instanceof Error ? e.message : String(e));
    }
  };

  const domainShellProps = {
    domainId: "infrastructure",
    title: "Infrastructure · Estate",
    description: `Search and bulk-operate across every managed resource. ${total} resource${total === 1 ? "" : "s"} across the platform.`,
    actions: (
      <SavedViewSwitcher
        views={SAVED_VIEWS}
        activeViewId={activeView}
        onSelectView={(id: string) => {
          setActiveView(id);
          setPage(1);
          setSelectedKeys([]);
        }}
      />
    ),
  } as const;

  if (!canRead) {
    return (
      <DomainShell {...domainShellProps}>
        <ForbiddenState />
      </DomainShell>
    );
  }

  return (
    <DomainShell {...domainShellProps}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <FilterBar
          onClearAll={() => {
            setNameQuery("");
            setSortBy("createdAt");
            setSortOrder("desc");
            setPage(1);
          }}
        >
          <Input
            placeholder="Search by name..."
            value={nameQuery}
            onChange={(e: any) => {
              setNameQuery(e.target.value);
              setPage(1);
            }}
          />
        </FilterBar>

        {unattributed.data.length > 0 && (
          <Card padding="md" style={{ borderColor: "var(--color-warning)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-3)" }}>
              <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
                Unattributed <Badge variant="warning">{unattributed.data.length}</Badge>
              </h3>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                Missing tenant, service, environment or owner — M27 cost allocation cannot attribute these
              </span>
            </div>
            <DataTable<UnattributedEntry>
              columns={[
                { key: "name", header: "Resource", render: (row) => row.name },
                { key: "kindName", header: "Kind", render: (row) => <Badge variant="default">{row.kindName}</Badge> },
                { key: "age", header: "Age", render: (row) => formatAge(row.ageMs) },
                {
                  key: "missingFields",
                  header: "Missing",
                  render: (row) => (
                    <div style={{ display: "flex", gap: "var(--space-1)", flexWrap: "wrap" }}>
                      {row.missingFields.map((f) => (
                        <Badge key={f} variant="warning">
                          {f}
                        </Badge>
                      ))}
                    </div>
                  ),
                },
              ]}
              data={unattributed.data}
              loading={unattributed.loading}
              rowKey={(row) => row.resourceId}
            />
          </Card>
        )}

        <Card padding="md">
          {estate.error ? (
            <ErrorState description={estate.error.message} onRetry={estate.reload} />
          ) : (
            <>
              <DataTable<EstateResource>
                columns={[
                  { key: "name", header: "Name", sortable: true, render: (row) => row.name },
                  { key: "kindName", header: "Kind", render: (row) => <Badge variant="default">{row.kindName}</Badge> },
                  { key: "createdAt", header: "Created", sortable: true, render: (row) => new Date(row.createdAt).toLocaleString() },
                ]}
                data={estate.data}
                loading={estate.loading}
                rowKey={(row) => row.id}
                emptyTitle={nameQuery || kindName ? "No matching resources" : "No resources yet"}
                emptyMessage={
                  nameQuery || kindName
                    ? "Try clearing filters or the search query."
                    : "Nothing has been registered in the resource model."
                }
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={(key, order) => {
                  setSortBy(key);
                  setSortOrder(order);
                  setPage(1);
                }}
                selectedKeys={canBulk ? selectedKeys : undefined}
                onSelectionChange={canBulk ? setSelectedKeys : undefined}
                bulkActions={
                  canBulk
                    ? (keys) => (
                        <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)} disabled={bulkArchive.loading || keys.length === 0}>
                          Archive {keys.length} selected
                        </Button>
                      )
                    : undefined
                }
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--space-4)" }}>
                <Pagination page={page} pageCount={pageCount} onChange={setPage} />
              </div>
            </>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={runBulkArchive}
        title="Archive selected resources?"
        message={`This will set desired-state archived=true on ${selectedKeys.length} resource(s). Each item's outcome is reported individually, and the operation resumes if interrupted.`}
        confirmLabel="Archive"
        variant="danger"
        isLoading={bulkArchive.loading}
      />
    </DomainShell>
  );
}
