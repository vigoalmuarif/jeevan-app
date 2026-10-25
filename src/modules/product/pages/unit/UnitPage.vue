<script setup lang="ts">
import { computed, ref } from "vue";
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
import { Add01Icon, RulerIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/vue";
import type { DataTableFilterDef } from "@/core/types/data-table.types";
import { unitColumns } from "../../config/unit-columns";
import DataTableToolbar from "@/components/data-table/DataTableToolbar.vue";
import DataTable from "@/components/data-table/DataTable.vue";
import DataTablePagination from "@/components/data-table/DataTablePagination.vue";
import FormUnitPage from "./FormUnitPage.vue";
import type { Unit } from "@/core/types/product.types.ts";
import { toast } from "vue-sonner";
import { useCan } from "@/core/composables/useCan.ts";
import { unitService } from "../../services/unit.service.ts";
import { normalizeError } from "@/lib/errors.ts";
import Spinner from "@/components/ui/spinner/Spinner.vue";

const { can } = useCan();

const isSystems = [
  { value: "1", label: "Sistem" },
  { value: "0", label: "Merchant" },
];

const createdBySystemFilter = ref<string>();
const statusFilter = ref<string>(); // '1' = aktif, '0' = nonaktif
const selectedUnit = ref<Unit>();
const showFormDialog = ref(false);
const showDeleteDialog = ref(false);
const deleteLoading = ref(false);

const columnsAlt = unitColumns({
  onDelete: (unit) => {
    if (unit.is_system) {
      return toast.warning("Satuan asal sistem gak bisa dihapus ya😊");
    }
    selectedUnit.value = unit;
    showDeleteDialog.value = true;
  },
  onEdit: (unit) => {
    if (!can("product.unit.create"))
      return toast.warning("Whops!, kamu gak punya akses buat edit data 😊");
    selectedUnit.value = unit;
    showFormDialog.value = true;
  },
});

const filters: DataTableFilterDef[] = [
  {
    id: "is_system",
    label: "Asal",
    value: createdBySystemFilter,
    format: (v) => isSystems.find((c) => c.value === v)?.label ?? v,
  },
  {
    id: "is_active",
    label: "Status",
    value: statusFilter,
    format: (v) => (v === "1" ? "Aktif" : "Nonaktif"),
  },
];

const openCreate = () => {
  if (!can("product.unit.create"))
    return toast.warning("Whoopps!, kamu gak punya akses buat tambah data 😊");
  selectedUnit.value = undefined;
  showFormDialog.value = true;
};

const onSaved = (data: { type: string; unit: Unit }) => {
  toast.success(
    `Satuan ${data.unit.name} berhasil ${data.type === "created" ? "ditambahkan" : "diperbarui"}🎉`,
  );
  refetch();
};

const handleDelete = async () => {
  deleteLoading.value = true;

  try {
    await unitService.delete(selectedUnit.value?.id as number);
    toast.success(`Satuan ${selectedUnit.value?.name} berhasil dihapus 🎉`);
    selectedUnit.value = undefined;
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
    endpoint: "/units",
    columns: columnsAlt,
    filters,
  });

const formattedTotal = computed(() => new Intl.NumberFormat("id-ID").format(total.value));
</script>

<template>
  <main class="flex flex-col gap-6">
    <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div class="flex items-start gap-3">
        <div class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <HugeiconsIcon :icon="RulerIcon" aria-hidden="true" />
        </div>
        <div class="flex flex-col gap-1">
          <h1 class="text-2xl font-semibold tracking-tight">Satuan Produk</h1>
          <p class="text-sm text-muted-foreground">Kelola satuan ukur yang digunakan pada produk dan transaksi.</p>
        </div>
      </div>
      <div class="flex items-center justify-between gap-3 sm:justify-end">
        <p class="text-sm text-muted-foreground" aria-live="polite"><span class="font-medium text-foreground">{{ formattedTotal }}</span> satuan</p>
        <Button v-if="can('product.unit.create')" @click="openCreate">
          <HugeiconsIcon :icon="Add01Icon" data-icon="inline-start" /> Satuan Baru
        </Button>
      </div>
    </header>

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
        <Select v-model="createdBySystemFilter">
          <SelectTrigger class="h-8 w-[150px]"
            ><SelectValue placeholder="Asal"
          /></SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="c in isSystems"
              :key="c.value"
              :value="c.value"
              >{{ c.label }}</SelectItem
            >
          </SelectContent>
        </Select>

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
            Kalo satuan
            <span class="text-destructive font-semibold">{{
              selectedUnit?.name
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
  </main>

  <FormUnitPage
    @saved="onSaved"
    v-model:open="showFormDialog"
    :selected-unit="selectedUnit"
  />
</template>
