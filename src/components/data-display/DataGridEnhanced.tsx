"use client";

import React, { useState } from "react";
import {
  ColumnPicker,
  KanbanBoard,
  type ColumnPickerOption,
  type KanbanColumn,
  type KanbanItem,
} from "@kannan19302/ui/data-grid";

export interface DataGridEnhancedProps<T extends KanbanItem> {
  mode?: "table" | "kanban";
  columns: ColumnPickerOption[];
  kanbanColumns?: KanbanColumn[];
  items?: T[];
  renderCard?: (item: T) => React.ReactNode;
  onCardMove?: (itemId: string, fromColumn: string, toColumn: string) => void;
  children?: React.ReactNode;
}

export function DataGridEnhanced<T extends KanbanItem>({
  mode = "table",
  columns,
  kanbanColumns = [
    { key: "open", title: "Open / Backlog" },
    { key: "in_progress", title: "Investigating" },
    { key: "resolved", title: "Resolved" },
  ],
  items = [],
  renderCard = (item) => <div>{String(item.title || item.id)}</div>,
  onCardMove,
  children,
}: DataGridEnhancedProps<T>) {
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() =>
    columns.map((c) => c.key)
  );

  return (
    <div>
      {mode === "table" ? (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "var(--space-2)" }}>
            <ColumnPicker
              options={columns}
              visible={visibleColumns}
              onChange={setVisibleColumns}
              label="Columns"
            />
          </div>
          {children}
        </div>
      ) : (
        <KanbanBoard
          columns={kanbanColumns}
          items={items}
          renderCard={renderCard}
          onCardMove={onCardMove}
        />
      )}
    </div>
  );
}
