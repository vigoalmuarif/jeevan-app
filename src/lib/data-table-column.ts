import { h } from "vue";
import type { ColumnDef } from "@tanstack/vue-table";
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue";
import type { Component } from "vue";

/**
 * Helper untuk kolom yang bisa di-sort & punya accessorKey langsung.
 * Otomatis isi header (dengan sort indicator) + meta.label dari satu sumber `label`.
 */
export function sortableColumn<T>(
  accessorKey: string,
  label: string,
  extra: Partial<ColumnDef<T, any>> = {},
): ColumnDef<T, any> {
  return {
    accessorKey,
    header: ({ column }) => h(DataTableColumnHeader, { column, title: label }),
    meta: { label },
    ...extra,
  };
}

/**
 * Helper untuk kolom non-sortable / accessorFn (mis. relasi, computed value).
 */
export function plainColumn<T>(
  id: string,
  label: string,
  accessorFn: (row: T) => unknown,
  extra: Partial<ColumnDef<T, any>> = {},
): ColumnDef<T, any> {
  return {
    id,
    accessorFn,
    header: label,
    meta: { label },
    enableSorting: false,
    ...extra,
  };
}

/**
 * Helper untuk kolom action dropdown.
 */
export function actionColumn<T>(
  component: Component,
  event: Record<string, (row: T) => unknown >,
): ColumnDef<T, any> {
  return {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      return h(
        "div",
        { class: "relative flex justify-end" },
        h(component, {
          row: row.original,
          onExpand: row.toggleExpanded,
          ...event
        }),
      );
    },
  };
}
