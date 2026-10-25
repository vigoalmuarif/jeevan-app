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
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Add01Icon, DeliveryTruck01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/vue";
import type { DataTableFilterDef } from "@/core/types/data-table.types";
import { supplierColumns } from "../../config/supplier-columns.ts";
import DataTableToolbar from "@/components/data-table/DataTableToolbar.vue";
import DataTable from "@/components/data-table/DataTable.vue";
import DataTablePagination from "@/components/data-table/DataTablePagination.vue";
import type { SupplierListItem } from "@/core/types/supplier.types.ts";
import { toast } from "vue-sonner";
import { useCan } from "@/core/composables/useCan.ts";
import { supplierService } from "../../services/supplier.service.ts";
import { normalizeError } from "@/lib/errors.ts";
import Spinner from "@/components/ui/spinner/Spinner.vue";
import { useRoute } from "vue-router";
import { onMounted } from "vue";
import SupplierDetailPage from "./SupplierDetailPage.vue";

const route = useRoute();
const { can } = useCan();

const statusFilter = ref<string>(); // '1' = aktif, '0' = nonaktif
const selectedSupplier = ref<SupplierListItem>();
const showDetail = ref(false);
const showDeleteDialog = ref(false);
const deleteLoading = ref(false);

const flashCreated = ref(route.query.isCreated);

const columnsAlt = supplierColumns({
  onDelete: (supplier) => {
    if (!can("core.supplier.delete")) {
      return toast.warning("Whops!, kamu gak punya akses buat hapus data 😊");
    }
    selectedSupplier.value = supplier;
    showDeleteDialog.value = true;
  },

  onShow: (supplier) => {
    // if (!can("partner.supplier.show"))
    //   return toast.warning("Whops!, kamu gak punya akses buat edit data 😊");
    selectedSupplier.value = supplier;
    showDetail.value = true;
  },

  onEdit: (supplier) => {
    if (!can("partner.supplier.create"))
      return toast.warning("Whops!, kamu gak punya akses buat edit data 😊");
    selectedSupplier.value = supplier;
    showDetail.value = true;
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

// const openCreate = () => {
//   if (!can("core.supplier.create"))
//     return toast.warning("Whoopps!, kamu gak punya akses buat tambah data 😊");
//   selectedSupplier.value = undefined;
//   showDetail.value = true;
// };

const onSaved = (data: { type: string; supplier: SupplierListItem }) => {
  toast.success(
    `Supplier ${data.supplier.name} berhasil ${data.type === "created" ? "ditambahkan" : "diperbarui"}🎉`,
  );
  refetch();
};

const handleDelete = async () => {
  deleteLoading.value = true;

  try {
    await supplierService.delete(selectedSupplier.value?.id as number);
    toast.success(`Supplier ${selectedSupplier.value?.name} berhasil dihapus 🎉`);
    selectedSupplier.value = undefined;
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
    endpoint: "/partner/suppliers",
    columns: columnsAlt,
    filters,
  });

const formattedTotal = computed(() => new Intl.NumberFormat("id-ID").format(total.value));

onMounted(() => {
  if(flashCreated.value === 'true'){
    toast.success('Supplier berhasil ditambahkan 🎉')
  }
})
</script>

<template>
  <main class="flex flex-col gap-6">
    <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div class="flex items-start gap-3">
        <div class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <HugeiconsIcon :icon="DeliveryTruck01Icon" aria-hidden="true" />
        </div>
        <div class="flex flex-col gap-1">
          <h1 class="text-2xl font-semibold tracking-tight">Supplier</h1>
          <p class="text-sm text-muted-foreground">Kelola data pemasok, informasi kontak, dan ketentuan pembayaran.</p>
        </div>
      </div>
      <div class="flex items-center justify-between gap-3 sm:justify-end">
        <p class="text-sm text-muted-foreground" aria-live="polite"><span class="font-medium text-foreground">{{ formattedTotal }}</span> supplier</p>
        <RouterLink
          v-if="can('partner.supplier.create')"
          :to="{ name: 'partner.suppliers.create' }"
          as-child
        >
          <Button><HugeiconsIcon :icon="Add01Icon" data-icon="inline-start" /> Supplier Baru</Button>
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
            Kalo Supplier
            <span class="text-destructive font-semibold">{{
              selectedSupplier?.name
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

  <SupplierDetailPage
    v-model:open="showDetail"
    :selected-supplier="selectedSupplier"
  />
</template>
