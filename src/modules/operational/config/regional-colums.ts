import type { ColumnDef } from "@tanstack/vue-table";
import {
  actionColumn,
  plainColumn,
  sortableColumn,
} from "@/lib/data-table-column";
import { h } from "vue";
import ColumnStatus from "@/components/ColumnStatus.vue";
import { useCan } from "@/core/composables/useCan.ts";
import type { Region } from "@/core/types/region.types.ts";
import DataTableRegionalAction from "../pages/regional/DataTableRegionalAction.vue";

type regionActions = {
  onDelete: (region: Region) => void;
  onEdit: (region: Region) => void;
};

const { can } = useCan();

export const regionColumns = (action: regionActions): ColumnDef<Region, any>[] => {
  return [
    sortableColumn<Region>("code", "Kode"),
    sortableColumn<Region>("name", "Regional"),
    sortableColumn<Region>("type", "Tipe"),
    
    // plainColumn<Region>("address?.regency?.nama", "Kota", (row) => row.address?.regency?.nama ?? '-'),

    plainColumn<Region>("is_active", "Status", (row) => row.is_active, {
      cell: ({ row }) => {
        return h(
          "div",
          { class: "relative w-fit" },
          h(ColumnStatus, {
            status: row.original.is_active,
            onExpand: row.toggleExpanded,
          }),
        );
      },
    }),

    ...(can("core.regional.delete") || can("core.regional.update")
      ? [
          actionColumn<Region>(DataTableRegionalAction, {
            onDelete: (val) => action.onDelete(val),
            onEdit: (val) => action.onEdit(val),
          }),
        ]
      : []),
  ];
};
