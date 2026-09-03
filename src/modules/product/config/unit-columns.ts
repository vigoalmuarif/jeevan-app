import type { ColumnDef } from "@tanstack/vue-table";
import type { Unit } from "@/core/types/product.types";
import {
  actionColumn,
  plainColumn,
  sortableColumn,
} from "@/lib/data-table-column";
import DataTableUnitAction from "../pages/unit/DataTableUnitAction.vue";
import { h } from "vue";
import ColumnStatus from "@/components/ColumnStatus.vue";
import { useCan } from "@/core/composables/useCan.ts";

type unitActions = {
  onDelete: (unit: Unit) => void;
  onEdit: (unit: Unit) => void;
};

const { can } = useCan();

export const unitColumns = (action: unitActions): ColumnDef<Unit, any>[] => {
  return [
    sortableColumn<Unit>("name", "Nama Satuan"),
    plainColumn<Unit>("code", "Kode", (row) => row.code),

    plainColumn<Unit>("is_system", "Asal", (row) =>
      row.is_system ? "Sistem" : "Merchant",
    ),

    plainColumn<Unit>("is_active", "Status", (row) => row.is_active, {
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

    ...(can("product.unit.delete") || can("product.unit.update")
      ? [
          actionColumn<Unit>(DataTableUnitAction, {
            onDelete: (val) => action.onDelete(val),
            onEdit: (val) => action.onEdit(val),
          }),
        ]
      : []),
  ];
};
