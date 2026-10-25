<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDataTable } from '@/core/composables/useDataTable'
import { useCan } from '@/core/composables/useCan'
import type { DataTableFilterDef } from '@/core/types/data-table.types'
import type { Product } from '@/core/types/product.types'
import { productColumns } from '../../config/product-columns'
import { productService } from '../../services/product.service'
import { normalizeError } from '@/lib/errors'
import { toast } from 'vue-sonner'
import { Add01Icon, PackageIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import Spinner from '@/components/ui/spinner/Spinner.vue'
import DataTableToolbar from '@/components/data-table/DataTableToolbar.vue'
import DataTable from '@/components/data-table/DataTable.vue'
import DataTablePagination from '@/components/data-table/DataTablePagination.vue'

const { can } = useCan()
const router = useRouter()
const typeFilter = ref<string>()
const statusFilter = ref<string>()
const selectedProduct = ref<Product>()
const showArchive = ref(false)
const savingArchive = ref(false)
const filters: DataTableFilterDef[] = [
  { id: 'type', label: 'Jenis', value: typeFilter, format: (value) => value === 'service' ? 'Jasa' : 'Produk fisik' },
  { id: 'is_active', label: 'Status', value: statusFilter, format: (value) => value === '1' ? 'Aktif' : 'Nonaktif' },
]

const columns = productColumns({
  onEdit: (product) => {
    if (!can('product.update')) return toast.warning('Anda tidak memiliki akses untuk mengubah produk.')
    router.push({ name: 'products.edit', params: { productId: product.id } })
  },
  onDelete: (product) => {
    if (!can('product.delete')) return toast.warning('Anda tidak memiliki akses untuk mengarsipkan produk.')
    selectedProduct.value = product
    showArchive.value = true
  },
})

const { table, refetch, loading, total, search, clearFilter, clearAllFilters, failedFetch } = useDataTable<Product>({
  endpoint: '/products', columns, filters,
})
const formattedTotal = computed(() => new Intl.NumberFormat('id-ID').format(total.value))

function openCreate() {
  if (!can('product.create')) return toast.warning('Anda tidak memiliki akses untuk menambah produk.')
  router.push({ name: 'products.create' })
}
async function archiveProduct() {
  if (!selectedProduct.value) return
  savingArchive.value = true
  try {
    await productService.delete(selectedProduct.value.id)
    toast.success(`Produk ${selectedProduct.value.name} berhasil diarsipkan.`)
    showArchive.value = false
    selectedProduct.value = undefined
    refetch()
  } catch (error) {
    toast.error(normalizeError(error).message)
  } finally {
    savingArchive.value = false
  }
}
</script>

<template>
  <main class="flex flex-col gap-6">
    <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div class="flex items-start gap-3">
        <div class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><HugeiconsIcon :icon="PackageIcon" aria-hidden="true" /></div>
        <div class="flex flex-col gap-1"><h1 class="text-2xl font-semibold tracking-tight">Produk</h1><p class="text-sm text-muted-foreground">Kelola katalog, varian, satuan, harga referensi, dan pajak produk.</p></div>
      </div>
      <div class="flex items-center justify-between gap-3 sm:justify-end"><p class="text-sm text-muted-foreground" aria-live="polite"><span class="font-medium text-foreground">{{ formattedTotal }}</span> produk</p><Button v-if="can('product.create')" @click="openCreate"><HugeiconsIcon :icon="Add01Icon" data-icon="inline-start" />Produk Baru</Button></div>
    </header>

    <DataTableToolbar v-model:search="search" :table="table" :filters="filters" :on-clear-filter="clearFilter" :on-clear-all="clearAllFilters" :refresh="refetch" :loading="loading">
      <template #filters>
        <Select v-model="typeFilter"><SelectTrigger class="h-8 w-[145px]"><SelectValue placeholder="Jenis" /></SelectTrigger><SelectContent><SelectItem value="product">Produk fisik</SelectItem><SelectItem value="service">Jasa</SelectItem></SelectContent></Select>
        <Select v-model="statusFilter"><SelectTrigger class="h-8 w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="1">Aktif</SelectItem><SelectItem value="0">Nonaktif</SelectItem></SelectContent></Select>
      </template>
    </DataTableToolbar>

    <div v-if="failedFetch" class="rounded-lg border border-destructive/30 bg-destructive/5 p-5 text-sm"><p class="font-medium">Daftar produk gagal dimuat.</p><p class="mt-1 text-muted-foreground">Periksa koneksi atau hak akses, lalu coba lagi.</p><Button class="mt-3" variant="outline" size="sm" @click="refetch">Coba lagi</Button></div>
    <DataTable v-else :table="table" :loading="loading" />
    <DataTablePagination :table="table" :total="total" />

    <AlertDialog v-model:open="showArchive"><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Arsipkan produk?</AlertDialogTitle><AlertDialogDescription>Produk <span class="font-semibold text-foreground">{{ selectedProduct?.name }}</span> akan dinonaktifkan dan tidak muncul dalam pilihan produk aktif.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel :disabled="savingArchive">Batal</AlertDialogCancel><Button variant="destructive" :disabled="savingArchive" @click="archiveProduct"><Spinner v-if="savingArchive" />{{ savingArchive ? 'Mengarsipkan…' : 'Arsipkan Produk' }}</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </main>
</template>
