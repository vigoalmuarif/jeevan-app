import { h } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { Badge } from '@/components/ui/badge'
import { actionColumn, plainColumn } from '@/lib/data-table-column'
import { useCan } from '@/core/composables/useCan'
import DataTableStockAdjustmentAction from '../pages/stok-adjusment/DataTableStockAdjustmentAction.vue' 
import type { StockAdjustmentListItem } from '../types/stock-adjustment.types'

export interface StockAdjustmentActions {
  onShow: (row: StockAdjustmentListItem) => void
  onEdit: (row: StockAdjustmentListItem) => void
  onDelete: (row: StockAdjustmentListItem) => void
  onPost: (row: StockAdjustmentListItem) => void
  onVoid: (row: StockAdjustmentListItem) => void
}

const dateFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' })
const reasons: Record<string, string> = {
  damaged: 'Rusak', expired: 'Kedaluwarsa', lost: 'Hilang', found: 'Ditemukan', correction: 'Koreksi', other: 'Lainnya',
}
const statuses: Record<string, string> = { draft: 'Draft', posted: 'Posted', voided: 'Voided' }
const statusVariants: Record<string, 'secondary' | 'default' | 'destructive' | 'outline'> = {
  draft: 'secondary', posted: 'default', voided: 'destructive',
}

const { can } = useCan()

export const stockAdjustmentColumns = (actions: StockAdjustmentActions): ColumnDef<StockAdjustmentListItem, any>[] => [
  plainColumn<StockAdjustmentListItem>('document_number', 'No. Dokumen', row => row.document_number),
  plainColumn<StockAdjustmentListItem>('adjustment_date', 'Tanggal', row => dateFormat.format(new Date(row.adjustment_date))),
  plainColumn<StockAdjustmentListItem>('branch_name', 'Cabang', row => row.branch_name || '—'),
  plainColumn<StockAdjustmentListItem>('warehouse_name', 'Gudang', row => row.warehouse_name),
  plainColumn<StockAdjustmentListItem>('reason', 'Alasan', row => reasons[row.reason] ?? row.reason),
  plainColumn<StockAdjustmentListItem>('items_count', 'Item', row => String(row.items_count ?? 0)),
  plainColumn<StockAdjustmentListItem>('status', 'Status', row => statuses[row.status] ?? row.status, {
    cell: ({ row }) => h(Badge, { variant: statusVariants[row.original.status] ?? 'outline' }, () => statuses[row.original.status] ?? row.original.status),
  }),
  ...(can('inventory.adjustment.view') || can('inventory.adjustment.create') || can('inventory.adjustment.approve')
    ? [actionColumn<StockAdjustmentListItem>(DataTableStockAdjustmentAction, {
        onShow: actions.onShow,
        onEdit: actions.onEdit,
        onDelete: actions.onDelete,
        onPost: actions.onPost,
        onVoid: actions.onVoid,
      })]
    : []),
]
