import type { ColumnDef } from "@tanstack/vue-table";
import type { BranchInfo } from "@/core/types/branch.types";
import {
  actionColumn,
  plainColumn,
  sortableColumn,
} from "@/lib/data-table-column";
import DataTableBranchAction from "../pages/branch/DataTableBranchAction.vue"; 
import { h } from "vue";
import ColumnStatus from "@/components/ColumnStatus.vue";
import { useCan } from "@/core/composables/useCan.ts";
import ColumnName from "../pages/branch/ColumnName.vue";

type branchActions = {
  onDelete: (branch: BranchInfo) => void;
  onEdit: (branch: BranchInfo) => void;
};

const { can } = useCan();

export const branchColumns = (action: branchActions): ColumnDef<BranchInfo, any>[] => {
  return [
    sortableColumn<BranchInfo>("code", "Kode"),
    sortableColumn<BranchInfo>("name", "Cabang", {
      cell: ({row}) => {
        return h(
          "div", { 
            class: "relative" 
          }, 
          h(ColumnName, { 
            row: {
              name: row.original.name,
              is_main: row.original.is_main
            }
           }),
        
        )
        
      }
    }),
    sortableColumn<BranchInfo>("main_warehouse.name", "Gudang Utama"),
    
    plainColumn<BranchInfo>("region?.name", "Regional", (row) => row.region?.name ?? '-'),
    
    plainColumn<BranchInfo>("address?.province?.nama", "Provinsi", (row) => row.address?.province?.nama ?? '-'),
    plainColumn<BranchInfo>("address?.regency?.nama", "Kota", (row) => row.address?.regency?.nama ?? '-'),

    plainColumn<BranchInfo>("is_active", "Status", (row) => row.is_active, {
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

    ...(can("core.branch.delete") || can("core.branch.update")
      ? [
          actionColumn<BranchInfo>(DataTableBranchAction, {
            onDelete: (val) => action.onDelete(val),
            onEdit: (val) => action.onEdit(val),
          }),
        ]
      : []),
  ];
};
