"use client";

import { useState, useCallback, useEffect } from "react";
import { useToast } from "./use-toast";

export interface CrudAdapter<T extends { id: string | number }> {
  list: (params: { page: number; pageSize: number; sort?: string; dir?: string; filters?: Record<string, string>; search?: string }) => Promise<{ items: T[]; total: number }>;
  create: (data: Partial<T>) => Promise<T>;
  update: (id: string | number, data: Partial<T>) => Promise<T>;
  delete: (id: string | number) => Promise<void>;
}

export interface UseCrudOptions<T extends { id: string | number }> {
  entityName: string;
  adapter: CrudAdapter<T>;
  defaultPageSize?: number;
  initialSort?: string;
  initialDir?: "asc" | "desc";
  autoLoad?: boolean;
}

export function useCrud<T extends { id: string | number }>({
  entityName,
  adapter,
  defaultPageSize = 10,
  initialSort = "createdAt",
  initialDir = "desc",
  autoLoad = true,
}: UseCrudOptions<T>) {
  const toast = useToast();

  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sortColumn, setSortColumn] = useState<string | undefined>(initialSort);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(initialDir);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Drawer / modal states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [activeItem, setActiveItem] = useState<T | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  // Fetch items
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adapter.list({
        page,
        pageSize,
        sort: sortColumn,
        dir: sortDirection || undefined,
        filters,
        search: searchQuery || undefined,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (err: any) {
      const msg = err?.message || `Failed to fetch ${entityName} records`;
      setError(msg);
      toast.error(msg, "Fetch Error");
    } finally {
      setLoading(false);
    }
  }, [adapter, page, pageSize, sortColumn, sortDirection, filters, searchQuery, entityName, toast]);

  useEffect(() => {
    if (autoLoad) {
      reload();
    }
  }, [reload, autoLoad]);

  // Open drawer for create
  const openCreate = useCallback(() => {
    setActiveItem(null);
    setDrawerMode("create");
    setDrawerOpen(true);
  }, []);

  // Open drawer for edit
  const openEdit = useCallback((item: T) => {
    setActiveItem(item);
    setDrawerMode("edit");
    setDrawerOpen(true);
  }, []);

  // Close drawer
  const closeDrawer = useCallback(() => {
    if (!isMutating) {
      setDrawerOpen(false);
      setActiveItem(null);
    }
  }, [isMutating]);

  // Handle submit from CrudDrawer
  const handleSave = useCallback(
    async (formData: Record<string, any>) => {
      setIsMutating(true);
      const prevItems = [...items];

      try {
        if (drawerMode === "create") {
          // Perform create
          const created = await adapter.create(formData as Partial<T>);
          // Optimistic / immediate prepend
          setItems((prev) => [created, ...prev]);
          setTotal((prev) => prev + 1);
          toast.success(`${entityName} created successfully`);
        } else if (drawerMode === "edit" && activeItem) {
          // Perform update
          const updated = await adapter.update(activeItem.id, formData as Partial<T>);
          // In-place update
          setItems((prev) => prev.map((item) => (item.id === activeItem.id ? updated : item)));
          toast.success(`${entityName} updated successfully`);
        }
        setDrawerOpen(false);
        setActiveItem(null);
        await reload();
      } catch (err: any) {
        // Rollback
        setItems(prevItems);
        const msg = err?.message || `Failed to save ${entityName}`;
        toast.error(msg, "Save Failed");
        throw err;
      } finally {
        setIsMutating(false);
      }
    },
    [drawerMode, activeItem, items, adapter, entityName, toast, reload]
  );

  // Handle delete
  const handleDelete = useCallback(
    async (id: string | number) => {
      const prevItems = [...items];
      // Optimistic delete
      setItems((prev) => prev.filter((item) => item.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));

      try {
        await adapter.delete(id);
        toast.success(`${entityName} deleted successfully`);
        await reload();
      } catch (err: any) {
        // Rollback
        setItems(prevItems);
        setTotal(prevItems.length);
        const msg = err?.message || `Failed to delete ${entityName}`;
        toast.error(msg, "Delete Failed");
        throw err;
      }
    },
    [items, adapter, entityName, toast, reload]
  );

  return {
    items,
    total,
    page,
    pageSize,
    sortColumn,
    sortDirection,
    searchQuery,
    filters,
    loading,
    error,
    drawerOpen,
    drawerMode,
    activeItem,
    isMutating,
    setPage,
    setPageSize,
    setSort: (col: string, dir: "asc" | "desc" | null) => {
      setSortColumn(col);
      setSortDirection(dir);
    },
    setSearchQuery,
    setFilters,
    setFilter: (key: string, value: string) => {
      setFilters((prev) => {
        const next = { ...prev };
        if (!value) delete next[key];
        else next[key] = value;
        return next;
      });
    },
    reload,
    openCreate,
    openEdit,
    closeDrawer,
    handleSave,
    handleUpdate: async (id: string | number, data: Record<string, any>) => {
      setIsMutating(true);
      try {
        const updated = await adapter.update(id, data as Partial<T>);
        setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
        toast.success(`${entityName} updated successfully`);
        await reload();
        return updated;
      } catch (err: any) {
        toast.error(err?.message || `Failed to update ${entityName}`, "Update Failed");
        throw err;
      } finally {
        setIsMutating(false);
      }
    },
    handleDelete,
  };
}
