import type { ColumnDef } from "@tanstack/vue-table";
import type { Brand } from "@/core/types/product.types";
import {
  actionColumn,
  plainColumn,
  sortableColumn,
} from "@/lib/data-table-column";
import DataTableBrandAction from "../pages/brand/DataTableBrandAction.vue";
import { h } from "vue";
import ColumnStatus from "@/components/ColumnStatus.vue";
import { useCan } from "@/core/composables/useCan.ts";

type brandActions = {
  onDelete: (brand: Brand) => void;
  onEdit: (brand: Brand) => void;
};

const { can } = useCan();

export const brandColumns = (action: brandActions): ColumnDef<Brand, any>[] => {
  return [
    sortableColumn<Brand>("name", "Nama Kategori"),
    
    plainColumn<Brand>("is_active", "Status", (row) => row.is_active, {
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

    ...(can("product.brand.delete") || can("product.brand.update")
      ? [
          actionColumn<Brand>(DataTableBrandAction, {
            onDelete: (val) => action.onDelete(val),
            onEdit: (val) => action.onEdit(val),
          }),
        ]
      : []),
  ];
};
