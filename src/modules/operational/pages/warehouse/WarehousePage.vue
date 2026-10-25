<script setup lang="ts">
import { computed, ref, watch } from "vue";
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
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Add01Icon, WarehouseIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/vue";
import type { DataTableFilterDef } from "@/core/types/data-table.types";
import { warehouseColumns } from "../../config/warehouse-columns.ts";
import DataTableToolbar from "@/components/data-table/DataTableToolbar.vue";
import DataTable from "@/components/data-table/DataTable.vue";
import DataTablePagination from "@/components/data-table/DataTablePagination.vue";
import type { WarehouseInfo } from "@/core/types/warehouse.types.ts";
import { toast } from "vue-sonner";
import { useCan } from "@/core/composables/useCan.ts";
import { warehouseService } from "../../services/warehouse.service.ts";
import { normalizeError } from "@/lib/errors.ts";
import Spinner from "@/components/ui/spinner/Spinner.vue";
import { useRoute } from "vue-router";
import { onMounted } from "vue";
import { branchService } from "../../services/branch.service.ts";
import type { BranchCombobox } from "@/core/types/branch.types.ts";

const route = useRoute();
const { can } = useCan();

const statusFilter = ref<string>(); // '1' = aktif, '0' = nonaktif
const branchFilter = ref<number | undefined>(); // '1' = aktif, '0' = nonaktif
const selectedWarehouse = ref<WarehouseInfo>();
const branches = ref<BranchCombobox[]>();
const showFormDialog = ref(false);
const showDeleteDialog = ref(false);
const deleteLoading = ref(false);
const loadingFetchBranch = ref(false);

const flashCreated = ref(route.query.isCreated);

const columnsAlt = warehouseColumns({
  onDelete: (warehouse) => {
    if (!can("core.warehouse.delete")) {
      return toast.warning("Whops!, kamu gak punya akses buat hapus data 😊");
    }
    selectedWarehouse.value = warehouse;
    showDeleteDialog.value = true;
  },
  onEdit: (warehouse) => {
    if (!can("core.warehouse.create"))
      return toast.warning("Whops!, kamu gak punya akses buat edit data 😊");
    selectedWarehouse.value = warehouse;
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
  {
    id: "branch_id",
    label: "Cabang",
    value: branchFilter,
    format: (v) => {
      const branch = branches?.value?.find((b) => b.id === v);
      return branch
        ? String(`${branch.name} (${branch.code})`.replace("Cabang", ""))
        : "-";
    },
  },
];

const openCreate = () => {
  if (!can("core.warehouse.create"))
    return toast.warning("Whoopps!, kamu gak punya akses buat tambah data 😊");
  selectedWarehouse.value = undefined;
  showFormDialog.value = true;
};

const onSaved = (data: { type: string; warehouse: WarehouseInfo }) => {
  toast.success(
    `Cabang ${data.warehouse.name} berhasil ${data.type === "created" ? "ditambahkan" : "diperbarui"}🎉`,
  );
  refetch();
};

const handleDelete = async () => {
  deleteLoading.value = true;

  try {
    await warehouseService.delete(selectedWarehouse.value?.id as number);
    toast.success(
      `Cabang ${selectedWarehouse.value?.name} berhasil dihapus 🎉`,
    );
    selectedWarehouse.value = undefined;
    showDeleteDialog.value = false;
    refetch();
  } catch (err) {
    const error = normalizeError(err);
    toast.error(`error.message`);
  } finally {
    deleteLoading.value = false;
  }
};

const {
  table,
  refetch,
  loading,
  total,
  search,
  clearFilter,
  clearAllFilters,
  failedFetch,
} = useDataTable({
  endpoint: "/warehouses",
  columns: columnsAlt,
  filters,
});

const formattedTotal = computed(() => new Intl.NumberFormat("id-ID").format(total.value));

const fetchBranches = async () => {
  loadingFetchBranch.value = true;
  try {
    const res = await branchService.combobox();

    branches.value = res.data;
  } catch (e) {
    toast.error("Gagal memuat gudang");
  } finally {
    loadingFetchBranch.value = false;
  }
};

fetchBranches();

onMounted(() => {
  if (flashCreated.value === "true") {
    toast.success("Cabang berhasil ditambahkan 🎉");
  }
});
</script>

<template>
  <main class="flex flex-col gap-6">
    <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div class="flex items-start gap-3">
        <div class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <HugeiconsIcon :icon="WarehouseIcon" aria-hidden="true" />
        </div>
        <div class="flex flex-col gap-1">
          <h1 class="text-2xl font-semibold tracking-tight">Gudang</h1>
          <p class="text-sm text-muted-foreground">Kelola lokasi penyimpanan stok dan penugasannya ke cabang.</p>
        </div>
      </div>
      <div class="flex items-center justify-between gap-3 sm:justify-end">
        <p class="text-sm text-muted-foreground" aria-live="polite"><span class="font-medium text-foreground">{{ formattedTotal }}</span> gudang</p>
        <RouterLink
          v-if="can('core.warehouse.create')"
          :to="{ name: 'operational.warehouses.create' }"
          as-child
        >
          <Button><HugeiconsIcon :icon="Add01Icon" data-icon="inline-start" /> Gudang Baru</Button>
        </RouterLink>
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
        <Select v-model="statusFilter">
          <SelectTrigger class=""
            ><SelectValue placeholder="Status"
          /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Aktif</SelectItem>
            <SelectItem value="0">Nonaktif</SelectItem>
          </SelectContent>
        </Select>
        <Select v-model="branchFilter" :disabled="loadingFetchBranch">
          <SelectTrigger class=""
            ><SelectValue :placeholder="loadingFetchBranch ? 'Memuat cabang' : 'Cabang'"
          /></SelectTrigger>
          <SelectContent>
            <SelectItem v-for="branch in branches" :key="branch.id" :value="branch.id">{{
              branch.name + " " + `(${branch.code})`
            }}</SelectItem>
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
            Kalo Gudang
            <span class="text-destructive font-semibold">{{
              selectedWarehouse?.name
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

  <!-- <div class="flex h-svh items-center justify-center">
    <FormWarehousePage
      @saved="onSaved"
      v-model:open="showFormDialog"
      :selected-warehouse="selectedWarehouse"
    />
  </div> -->
</template>
