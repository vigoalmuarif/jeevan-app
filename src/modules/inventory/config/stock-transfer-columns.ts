import { h } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { Badge } from '@/components/ui/badge'
import { actionColumn, plainColumn } from '@/lib/data-table-column'
import { useCan } from '@/core/composables/useCan'
import DataTableStockTransferAction from '../pages/stock-transfer/DataTableStockTransferAction.vue'
import type { StockTransferListItem } from '../types/stock-transfer.types'

const statuses: Record<string, string> = { draft: 'Draft', shipped: 'Dikirim', received: 'Diterima', cancelled: 'Dibatalkan' }
const variants: Record<string, 'secondary' | 'default' | 'destructive' | 'outline'> = { draft: 'secondary', shipped: 'default', received: 'default', cancelled: 'destructive' }
const dateFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' })
const { can } = useCan()
export const stockTransferColumns = (actions: { onShow: (row: StockTransferListItem) => void; onEdit: (row: StockTransferListItem) => void; onDelete: (row: StockTransferListItem) => void }): ColumnDef<StockTransferListItem, any>[] => [
  plainColumn('document_number', 'No. Transfer', row => row.document_number),
  plainColumn('transfer_date', 'Tanggal', row => dateFormat.format(new Date(row.transfer_date))),
  plainColumn('from_warehouse_name', 'Asal', row => row.from_warehouse_name),
  plainColumn('to_warehouse_name', 'Tujuan', row => row.to_warehouse_name),
  plainColumn('items_count', 'Item', row => String(row.items_count ?? 0)),
  plainColumn('status', 'Status', row => statuses[row.status] ?? row.status, { cell: ({ row }) => h(Badge, { variant: variants[row.original.status] ?? 'outline' }, () => statuses[row.original.status] ?? row.original.status) }),
  ...(can('inventory.transfer.view') || can('inventory.transfer.create') ? [actionColumn<StockTransferListItem>(DataTableStockTransferAction, { onShow: actions.onShow, onEdit: actions.onEdit, onDelete: actions.onDelete })] : []),
]
