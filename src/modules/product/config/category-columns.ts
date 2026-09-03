import type { ColumnDef } from "@tanstack/vue-table";
import type { Category } from "@/core/types/product.types";
import {
  actionColumn,
  plainColumn,
  sortableColumn,
} from "@/lib/data-table-column";
import DataTableCategoryAction from "../pages/category/DataTableCategoryAction.vue";
import { h } from "vue";
import ColumnStatus from "@/components/ColumnStatus.vue";
import { useCan } from "@/core/composables/useCan.ts";

type categoryActions = {
  onDelete: (category: Category) => void;
  onEdit: (category: Category) => void;
};

const { can } = useCan();

export const categoryColumns = (action: categoryActions): ColumnDef<Category, any>[] => {
  return [
    sortableColumn<Category>("name", "Nama Kategori"),
    plainColumn<Category>("description", "Deskripsi", (row) => row.description),

    plainColumn<Category>("is_active", "Status", (row) => row.is_active, {
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

    ...(can("product.category.delete") || can("product.category.update")
      ? [
          actionColumn<Category>(DataTableCategoryAction, {
            onDelete: (val) => action.onDelete(val),
            onEdit: (val) => action.onEdit(val),
          }),
        ]
      : []),
  ];
};
