<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Add01Icon, ArrowRight01Icon, WarehouseIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import DataTable from '@/components/data-table/DataTable.vue'
import DataTablePagination from '@/components/data-table/DataTablePagination.vue'
import DataTableToolbar from '@/components/data-table/DataTableToolbar.vue'
import Spinner from '@/components/ui/spinner/Spinner.vue'
import { useDataTable } from '@/core/composables/useDataTable'
import type { DataTableFilterDef } from '@/core/types/data-table.types'
import { useCan } from '@/core/composables/useCan'
import { normalizeError } from '@/lib/errors'
import { toast } from 'vue-sonner'
import { stockTransferService } from '../../services/stock-transfer.service'
import type { StockTransfer, StockTransferOptions, StockTransferListItem } from '../../types/stock-transfer.types'
import { stockTransferColumns } from '../../config/stock-transfer-columns'
import StockTransferFormDialog from './StockTransferFormDialog.vue'
import StockTransferDetailDialog from './StockTransferDetailDialog.vue'

const { can } = useCan(); const options = ref<StockTransferOptions>({ warehouses: [] }); const optionsLoading = ref(false); const showForm = ref(false); const showDetail = ref(false); const selected = ref<StockTransferListItem>(); const detailId = ref<number>(); const fromFilter = ref<string>(); const toFilter = ref<string>(); const statusFilter = ref<string>();
const filters: DataTableFilterDef[] = [{ id: 'from_warehouse_id', label: 'Gudang asal', value: fromFilter, format: v => options.value.warehouses.find(w => String(w.id) === v)?.name ?? v }, { id: 'to_warehouse_id', label: 'Gudang tujuan', value: toFilter, format: v => options.value.warehouses.find(w => String(w.id) === v)?.name ?? v }, { id: 'status', label: 'Status', value: statusFilter, format: v => ({ draft: 'Draft', shipped: 'Dikirim', received: 'Diterima', cancelled: 'Dibatalkan' }[v] ?? v) }]
const columns = stockTransferColumns({ onShow: openDetail, onEdit: row => { selected.value = row; showForm.value = true }, onDelete: deleteDraft })
const { table, refetch, loading, total, search, clearFilter, clearAllFilters } = useDataTable({ endpoint: '/stock-transfers', columns, filters })
const formattedTotal = computed(() => new Intl.NumberFormat('id-ID').format(total.value))
async function loadOptions() { optionsLoading.value = true; try { options.value = await stockTransferService.getOptions() } catch (e) { toast.error(normalizeError(e).message) } finally { optionsLoading.value = false } }
function openCreate() { selected.value = undefined; showForm.value = true }
function openDetail(row: StockTransferListItem) { detailId.value = row.id; showDetail.value = true }
async function deleteDraft(row: StockTransferListItem) { if (!window.confirm(`Hapus draft ${row.document_number}?`)) return; try { await stockTransferService.delete(row.id); toast.success('Draft transfer dihapus.'); await refetch() } catch (e) { toast.error(normalizeError(e).message) } }
function onSaved(_transfer: StockTransfer) { showForm.value = false; void refetch(); toast.success('Draft transfer stok tersimpan.') }
onMounted(loadOptions)
</script>

<template>
  <main class="flex flex-col gap-6"><header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div class="flex items-start gap-3"><div class="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><HugeiconsIcon :icon="WarehouseIcon" /></div><div><h1 class="text-2xl font-semibold">Transfer Stok</h1><p class="text-sm text-muted-foreground">Pindahkan stok antar gudang melalui proses kirim dan terima.</p></div></div><div class="flex items-center gap-3"><span class="text-sm text-muted-foreground"><b class="text-foreground">{{ formattedTotal }}</b> dokumen</span><Button v-if="can('inventory.transfer.create')" :disabled="optionsLoading" @click="openCreate"><HugeiconsIcon :icon="Add01Icon" data-icon="inline-start" /> Buat transfer</Button></div></header><DataTableToolbar v-model:search="search" :table="table" :filters="filters" :on-clear-filter="clearFilter" :on-clear-all="clearAllFilters" :refresh="refetch" :loading="loading"><template #filters><Select v-model="fromFilter"><SelectTrigger class="h-8 w-[170px]"><SelectValue placeholder="Gudang asal" /></SelectTrigger><SelectContent><SelectItem v-for="warehouse in options.warehouses" :key="warehouse.id" :value="String(warehouse.id)">{{ warehouse.name }}</SelectItem></SelectContent></Select><Select v-model="toFilter"><SelectTrigger class="h-8 w-[170px]"><SelectValue placeholder="Gudang tujuan" /></SelectTrigger><SelectContent><SelectItem v-for="warehouse in options.warehouses" :key="warehouse.id" :value="String(warehouse.id)">{{ warehouse.name }}</SelectItem></SelectContent></Select><Select v-model="statusFilter"><SelectTrigger class="h-8 w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="shipped">Dikirim</SelectItem><SelectItem value="received">Diterima</SelectItem><SelectItem value="cancelled">Dibatalkan</SelectItem></SelectContent></Select></template></DataTableToolbar><DataTable :table="table" :loading="loading" empty-text="Belum ada transfer stok." /><DataTablePagination :table="table" :total="total" /><StockTransferFormDialog v-model:open="showForm" :selected-transfer="selected" :options="options" @saved="onSaved" /><StockTransferDetailDialog v-model:open="showDetail" :transfer-id="detailId" @changed="refetch" /></main>
</template>
