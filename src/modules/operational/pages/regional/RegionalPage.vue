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
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "@lucide/vue";
import type { DataTableFilterDef } from "@/core/types/data-table.types";
import DataTableToolbar from "@/components/data-table/DataTableToolbar.vue";
import DataTable from "@/components/data-table/DataTable.vue";
import DataTablePagination from "@/components/data-table/DataTablePagination.vue";
import type { Region } from "@/core/types/region.types.ts";
import { toast } from "vue-sonner";
import { useCan } from "@/core/composables/useCan.ts";
import { regionService } from "../../services/region.service.ts";
import { normalizeError } from "@/lib/errors.ts";
import Spinner from "@/components/ui/spinner/Spinner.vue";
import { useRoute } from "vue-router";
import { onMounted } from "vue";
import { regionColumns } from "../../config/regional-colums.ts";

const route = useRoute();
const { can } = useCan();

const statusFilter = ref<string>(); // '1' = aktif, '0' = nonaktif
const selectedRegion = ref<Region>();
const showFormDialog = ref(false);
const showDeleteDialog = ref(false);
const deleteLoading = ref(false);

const flashCreated = ref(route.query.isCreated);

const columnsAlt = regionColumns({
  onDelete: (region) => {
    if (!can("core.region.delete")) {
      return toast.warning("Whops!, kamu gak punya akses buat hapus data 😊");
    }
    selectedRegion.value = region;
    showDeleteDialog.value = true;
  },
  onEdit: (region) => {
    if (!can("core.region.create"))
      return toast.warning("Whops!, kamu gak punya akses buat edit data 😊");
    selectedRegion.value = region;
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
  if (!can("core.region.create"))
    return toast.warning("Whoopps!, kamu gak punya akses buat tambah data 😊");
  selectedRegion.value = undefined;
  showFormDialog.value = true;
};

const onSaved = (data: { type: string; region: Region }) => {
  toast.success(
    `Regional ${data.region.name} berhasil ${data.type === "created" ? "ditambahkan" : "diperbarui"}🎉`,
  );
  refetch();
};

const handleDelete = async () => {
  deleteLoading.value = true;

  try {
    await regionService.delete(selectedRegion.value?.id as number);
    toast.success(`Regional ${selectedRegion.value?.name} berhasil dihapus 🎉`);
    selectedRegion.value = undefined;
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
    endpoint: "/regions",
    columns: columnsAlt,
    filters,
  });

onMounted(() => {
  if(flashCreated.value === 'true'){
    toast.success('Regional berhasil ditambahkan 🎉')
  }
})
</script>

<template>
  <div class="space-y-4">
    <div v-if="can('core.regional.create')">
      <Button> <Plus /> Regional Baru </Button>
    </div>

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
            Kalo Regional
            <span class="text-destructive font-semibold">{{
              selectedRegion?.name
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

  <!-- <div class="flex h-svh items-center justify-center">
    <FormRegionPage
      @saved="onSaved"
      v-model:open="showFormDialog"
      :selected-region="selectedRegion"
    />
  </div> -->
</template>
