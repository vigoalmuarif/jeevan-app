<script setup lang="ts">
import { ref } from "vue";
import { useDataTable } from "@/core/composables/useDataTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "@lucide/vue";
import type { DataTableFilterDef } from "@/core/types/data-table.types";
import { categoryColumns } from "../../config/category-columns.ts";
import DataTableToolbar from "@/components/data-table/DataTableToolbar.vue";
import DataTable from "@/components/data-table/DataTable.vue";
import DataTablePagination from "@/components/data-table/DataTablePagination.vue";
import FormCategoryPage from "./FormCategoryPage.vue";
import type { Category } from "@/core/types/product.types.ts";
import { toast } from "vue-sonner";
import { useCan } from "@/core/composables/useCan.ts";
import { categoryService } from "../../services/category.service.ts";
import { normalizeError } from "@/lib/errors.ts";
import Spinner from "@/components/ui/spinner/Spinner.vue";

const { can } = useCan();

const createdBySystemFilter = ref<string>();
const statusFilter = ref<string>(); // '1' = aktif, '0' = nonaktif
const selectedCategory = ref<Category>();
const showFormDialog = ref(false);
const showDeleteDialog = ref(false);
const deleteLoading = ref(false);

const columnsAlt = categoryColumns({
  onDelete: (category) => {
    selectedCategory.value = category;
    showDeleteDialog.value = true;
  },
  onEdit: (category) => {
    if (!can("product.category.create"))
      return toast.warning("Whops!, kamu gak punya akses buat edit data 😊");
    selectedCategory.value = category;
    showFormDialog.value = true;
  },
});

const filters: DataTableFilterDef[] = [
  {
    id: "is_active",
    label: "Status",
    value: statusFilter,
    format: (v) => (v === "1" ? "Aktif" : "Nonaktif"),
  },
];

const openCreate = () => {
  if (!can("product.category.create"))
    return toast.warning("Whoopps!, kamu gak punya akses buat tambah data 😊");
  selectedCategory.value = undefined;
  showFormDialog.value = true;
};

const onSaved = (data: { type: string; category: Category }) => {
  toast.success(
    `Kategori ${data.category.name} berhasil ${data.type === "created" ? "ditambahkan" : "diperbarui"}🎉`,
  );
  refetch();
};

const handleDelete = async () => {
  deleteLoading.value = true;

  try {
    await categoryService.delete(selectedCategory.value?.id as number);
    toast.success(`Satuan ${selectedCategory.value?.name} berhasil dihapus 🎉`);
    selectedCategory.value = undefined;
    showDeleteDialog.value = false;
    refetch();
  } catch (err) {
    const error = normalizeError(err);
    toast.error(`error.message`);
  } finally {
    deleteLoading.value = false;
  }
};

const { table, refetch, loading, total, search, clearFilter, clearAllFilters } =
  useDataTable({
    endpoint: "/categories",
    columns: columnsAlt,
    filters,
  });
</script>

<template>
  <div class="space-y-4">
    <Button @click="openCreate" v-if="can('product.category.create')"
      ><Plus /> Kategori Baru
    </Button>

    <DataTableToolbar
      v-model:search="search"
      :table="table"
      :filters="filters"
      :on-clear-filter="clearFilter"
      :on-clear-all="clearAllFilters"
      :refresh="refetch"
      :loading="loading"
    >
      <template #filters>
        <Select v-model="statusFilter">
          <SelectTrigger class="h-8 w-[130px]"
            ><SelectValue placeholder="Status"
          /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Aktif</SelectItem>
            <SelectItem value="0">Nonaktif</SelectItem>
          </SelectContent>
        </Select>
      </template>
    </DataTableToolbar>

    <DataTable :table="table" :loading="loading" />
    <DataTablePagination :table="table" :total="total" />

    <AlertDialog v-model:open="showDeleteDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Serius mau dihapus?</AlertDialogTitle>
          <AlertDialogDescription>
            Kalo kategori
            <span class="text-destructive font-semibold">{{
              selectedCategory?.name
            }}</span>
            udah dihapus, gak bisa dikembaliin lagi ya!
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="deleteLoading">Batal</AlertDialogCancel>
            <Button
              variant="destructive"
              @click="handleDelete"
              :disabled="deleteLoading"
            >
              <Spinner v-if="deleteLoading" />
              {{ deleteLoading ? "Menghapus..." : "Ya, Hapus" }}
            </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>

  <FormCategoryPage
    @saved="onSaved"
    v-model:open="showFormDialog"
    :selected-category="selectedCategory"
  />
</template>
