import type { ColumnDef } from "@tanstack/vue-table";

import {
  actionColumn,
  plainColumn,
  sortableColumn,
} from "@/lib/data-table-column";
import DataTableSupplierAction from "../pages/supplier/DataTableSupplierAction.vue"; 
import { h } from "vue";
import ColumnStatus from "@/components/ColumnStatus.vue";
import { useCan } from "@/core/composables/useCan.ts";
import ColumnName from "../pages/supplier/ColumnName.vue";
import type { SupplierListItem } from "@/core/types/supplier.types.ts";

type supplierActions = {
  onDelete: (supplier: SupplierListItem) => void;
  onEdit: (supplier: SupplierListItem) => void;
  onShow: (supplier: SupplierListItem) => void;
};

const { can } = useCan();

export const supplierColumns = (action: supplierActions): ColumnDef<SupplierListItem, any>[] => {
  return [
    sortableColumn<SupplierListItem>("code", "Kode"),
    sortableColumn<SupplierListItem>("name", "Nama", {
      cell: ({row}) => {
        return h(
          "div", { 
            class: "relative" 
          }, 
          h(ColumnName, { 
            row: {
              name: row.original.name,
            }
           }),
        
        )
        
      }
    }),
    sortableColumn<SupplierListItem>("contact_person", "Kontak"),
    
    plainColumn<SupplierListItem>("phone", "Phone", (row) => row.phone ?? '-'),
    
    plainColumn<SupplierListItem>("payment_term_days", "Payment Term", (row) => row.payment_term_days ?? '-'),

    plainColumn<SupplierListItem>("is_active", "Status", (row) => row.is_active, {
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

    ...(can("partner.supplier.delete") || can("partner.supplier.update")
      ? [
          actionColumn<SupplierListItem>(DataTableSupplierAction, {
            onDelete: (val) => action.onDelete(val),
            onEdit: (val) => action.onEdit(val),
            onShow: (val) => action.onShow(val),
          }),
        ]
      : []),
  ];
};
