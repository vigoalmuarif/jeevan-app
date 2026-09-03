import type { ColumnDef } from "@tanstack/vue-table";
import type { WarehouseInfo } from "@/core/types/warehouse.types";
import {
  actionColumn,
  plainColumn,
  sortableColumn,
} from "@/lib/data-table-column";
import DataTableWarehouseAction from "../pages/warehouse/DataTableWarehouseAction.vue"; 
import { h } from "vue";
import ColumnStatus from "@/components/ColumnStatus.vue";
import { useCan } from "@/core/composables/useCan.ts";

type warehouseActions = {
  onDelete: (warehouse: WarehouseInfo) => void;
  onEdit: (warehouse: WarehouseInfo) => void;
};

const { can } = useCan();

export const warehouseColumns = (action: warehouseActions): ColumnDef<WarehouseInfo, any>[] => {
  return [
    sortableColumn<WarehouseInfo>("code", "Kode Gudang"),
    sortableColumn<WarehouseInfo>("name", "Nama Gudang"),
    plainColumn<WarehouseInfo>("type", "Tipe", (row) => row.type),
    
    plainColumn<WarehouseInfo>("phone", "Telepon", (row) => row.phone ? row.phone : '-'),
    plainColumn<WarehouseInfo>("address", "Alamat", (row) => row.address ? row.address : '-'),

    plainColumn<WarehouseInfo>("is_active", "Status", (row) => row.is_active, {
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

    ...(can("core.warehouse.delete") || can("core.warehouse.update")
      ? [
          actionColumn<WarehouseInfo>(DataTableWarehouseAction, {
            onDelete: (val) => action.onDelete(val),
            onEdit: (val) => action.onEdit(val),
          }),
        ]
      : []),
  ];
};
