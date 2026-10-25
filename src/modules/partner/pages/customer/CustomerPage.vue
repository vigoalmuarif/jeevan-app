<script setup lang="ts">
import { computed, ref } from 'vue'
import { Add01Icon, Alert02Icon, UserMultipleIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useCan } from '@/core/composables/useCan'
import { toast } from 'vue-sonner'
import Spinner from '@/components/ui/spinner/Spinner.vue'
import { normalizeError } from '@/lib/errors'
import type { CustomerListItem } from '@/core/types/customer.types'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import DataTable from '@/components/data-table/DataTable.vue'
import DataTablePagination from '@/components/data-table/DataTablePagination.vue'
import DataTableToolbar from '@/components/data-table/DataTableToolbar.vue'
import { useDataTable } from '@/core/composables/useDataTable'
import type { DataTableFilterDef } from '@/core/types/data-table.types'
import { customerColumns } from '../../config/customer-columns'
import CustomerFormDialog from './CustomerFormDialog.vue'
import CustomerDetailDialog from './CustomerDetailDialog.vue'
import { customerService } from '../../services/customer.service'

const { can } = useCan()
const showFormDialog = ref(false)
const showDetailDialog = ref(false)
const showDeleteDialog = ref(false)
const deleteLoading = ref(false)
const selectedCustomer = ref<CustomerListItem>()
const statusFilter = ref<string>()
const filters: DataTableFilterDef[] = [
  {
    id: 'is_active',
    label: 'Status',
    value: statusFilter,
    format: (value) => value === '1' ? 'Aktif' : 'Nonaktif',
  },
]

const columns = customerColumns({
  onShow: (customer) => {
    selectedCustomer.value = customer
    showDetailDialog.value = true
  },
  onEdit: (customer) => {
    selectedCustomer.value = customer
    showFormDialog.value = true
  },
  onDelete: (customer) => {
    selectedCustomer.value = customer
    showDeleteDialog.value = true
  },
})

const { table, refetch, loading, total, search, clearFilter, clearAllFilters, failedFetch } = useDataTable({
  endpoint: '/partner/customers',
  columns,
  filters,
})

const formattedTotal = computed(() => new Intl.NumberFormat('id-ID').format(total.value))

const refreshCustomers = async () => {
  failedFetch.value = false
  await refetch()
}

const startCreate = () => {
  selectedCustomer.value = undefined
  showFormDialog.value = true
}

const onCustomerSaved = async (result: { type: 'created' | 'updated'; customer: CustomerListItem }) => {
  toast.success(`Customer ${result.customer.name} berhasil ${result.type === 'created' ? 'ditambahkan' : 'diperbarui'}.`)
  await refetch()
}

const handleDelete = async () => {
  if (!selectedCustomer.value) return
  deleteLoading.value = true
  try {
    await customerService.delete(selectedCustomer.value.id)
    toast.success(`Customer ${selectedCustomer.value.name} berhasil dihapus.`)
    showDeleteDialog.value = false
    selectedCustomer.value = undefined
    await refetch()
  } catch (error) {
    toast.error(normalizeError(error).message)
  } finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <main class="flex flex-col gap-6">
    <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div class="flex items-start gap-3">
        <div class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <HugeiconsIcon :icon="UserMultipleIcon" aria-hidden="true" />
        </div>
        <div class="flex flex-col gap-1">
          <h1 class="text-2xl font-semibold tracking-tight">Customer</h1>
          <p class="text-sm text-muted-foreground">Kelola data customer, informasi kontak, dan ketentuan pembayaran.</p>
        </div>
      </div>
      <div class="flex items-center justify-between gap-3 sm:justify-end">
        <p class="text-sm text-muted-foreground" aria-live="polite">
          <span class="font-medium text-foreground">{{ formattedTotal }}</span> customer
        </p>
        <Button v-if="can('partner.customer.create')" @click="startCreate">
          <HugeiconsIcon :icon="Add01Icon" data-icon="inline-start" />
          Tambah customer
        </Button>
      </div>
    </header>

    <section aria-label="Daftar customer" class="flex flex-col gap-4">
      <DataTableToolbar
        v-model:search="search"
        :table="table"
        :filters="filters"
        :on-clear-filter="clearFilter"
        :on-clear-all="clearAllFilters"
        :refresh="refreshCustomers"
        :loading="loading"
      >
        <template #filters>
          <Select v-model="statusFilter">
            <SelectTrigger class="h-8 w-[140px]" aria-label="Filter status customer">
              <SelectValue placeholder="Semua status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="1">Aktif</SelectItem>
                <SelectItem value="0">Nonaktif</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </template>
      </DataTableToolbar>

      <Alert v-if="failedFetch" variant="destructive">
        <HugeiconsIcon :icon="Alert02Icon" aria-hidden="true" />
        <AlertTitle>Daftar customer gagal dimuat</AlertTitle>
        <AlertDescription class="flex flex-wrap items-center justify-between gap-3">
          <span>Periksa koneksi lalu coba muat ulang data.</span>
          <Button variant="outline" size="sm" @click="refreshCustomers">Coba lagi</Button>
        </AlertDescription>
      </Alert>

      <DataTable :table="table" :loading="loading" empty-text="Belum ada customer yang cocok dengan pencarian atau filter ini." />
      <DataTablePagination :table="table" :total="total" />
    </section>

    <CustomerFormDialog
      v-model:open="showFormDialog"
      :selected-customer="selectedCustomer"
      @saved="onCustomerSaved"
    />
    <CustomerDetailDialog v-model:open="showDetailDialog" :selected-customer="selectedCustomer" />

    <AlertDialog v-model:open="showDeleteDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus customer ini?</AlertDialogTitle>
          <AlertDialogDescription>
            Customer <span class="font-semibold text-foreground">{{ selectedCustomer?.name }}</span> akan dihapus dari daftar.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="deleteLoading">Batal</AlertDialogCancel>
          <Button variant="destructive" :disabled="deleteLoading" @click="handleDelete">
            <Spinner v-if="deleteLoading" />
            {{ deleteLoading ? 'Menghapus...' : 'Hapus customer' }}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </main>
</template>
