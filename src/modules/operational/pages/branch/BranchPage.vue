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
import { branchColumns } from "../../config/branch-columns.ts";
import DataTableToolbar from "@/components/data-table/DataTableToolbar.vue";
import DataTable from "@/components/data-table/DataTable.vue";
import DataTablePagination from "@/components/data-table/DataTablePagination.vue";
import type { BranchInfo } from "@/core/types/branch.types.ts";
import { toast } from "vue-sonner";
import { useCan } from "@/core/composables/useCan.ts";
import { branchService } from "../../services/branch.service.ts";
import { normalizeError } from "@/lib/errors.ts";
import Spinner from "@/components/ui/spinner/Spinner.vue";
import { useRoute } from "vue-router";
import { onMounted } from "vue";

const route = useRoute();
const { can } = useCan();

const statusFilter = ref<string>(); // '1' = aktif, '0' = nonaktif
const selectedBranch = ref<BranchInfo>();
const showFormDialog = ref(false);
const showDeleteDialog = ref(false);
const deleteLoading = ref(false);

const flashCreated = ref(route.query.isCreated);

const columnsAlt = branchColumns({
  onDelete: (branch) => {
    if (!can("core.branch.delete")) {
      return toast.warning("Whops!, kamu gak punya akses buat hapus data 😊");
    }
    selectedBranch.value = branch;
    showDeleteDialog.value = true;
  },
  onEdit: (branch) => {
    if (!can("core.branch.create"))
      return toast.warning("Whops!, kamu gak punya akses buat edit data 😊");
    selectedBranch.value = branch;
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
  if (!can("core.branch.create"))
    return toast.warning("Whoopps!, kamu gak punya akses buat tambah data 😊");
  selectedBranch.value = undefined;
  showFormDialog.value = true;
};

const onSaved = (data: { type: string; branch: BranchInfo }) => {
  toast.success(
    `Cabang ${data.branch.name} berhasil ${data.type === "created" ? "ditambahkan" : "diperbarui"}🎉`,
  );
  refetch();
};

const handleDelete = async () => {
  deleteLoading.value = true;

  try {
    await branchService.delete(selectedBranch.value?.id as number);
    toast.success(`Cabang ${selectedBranch.value?.name} berhasil dihapus 🎉`);
    selectedBranch.value = undefined;
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
    endpoint: "/branches",
    columns: columnsAlt,
    filters,
  });

onMounted(() => {
  if(flashCreated.value === 'true'){
    toast.success('Cabang berhasil ditambahkan 🎉')
  }
})
</script>

<template>
  <div class="space-y-4">
    <div>
      <RouterLink
        :to="{ name: 'operational.branches.create' }"
        v-if="can('core.branch.create')"
        as-child
        ><Button> <Plus /> Cabang Baru </Button>
      </RouterLink>
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
            Kalo Cabang
            <span class="text-destructive font-semibold">{{
              selectedBranch?.name
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
    <FormBranchPage
      @saved="onSaved"
      v-model:open="showFormDialog"
      :selected-branch="selectedBranch"
    />
  </div> -->
</template>
