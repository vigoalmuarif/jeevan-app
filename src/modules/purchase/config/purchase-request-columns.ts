import { h } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { Badge } from '@/components/ui/badge'
import { actionColumn, plainColumn } from '@/lib/data-table-column'
import { useCan } from '@/core/composables/useCan'
import PurchaseRequestTableAction from '../pages/purchase-request/PurchaseRequestTableAction.vue'
import type { PurchaseRequestListItem } from '../types/purchase-request.types'

export interface PurchaseRequestActions {
  onShow: (row: PurchaseRequestListItem) => void
  onEdit: (row: PurchaseRequestListItem) => void
  onDelete: (row: PurchaseRequestListItem) => void
  onSubmit: (row: PurchaseRequestListItem) => void
  onApprove: (row: PurchaseRequestListItem) => void
  onReject: (row: PurchaseRequestListItem) => void
  onCancel: (row: PurchaseRequestListItem) => void
  onClose: (row: PurchaseRequestListItem) => void
}

const dateFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' })

const statuses: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Diajukan',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  partially_ordered: 'Dipesan Sebagian',
  ordered: 'Sudah Dipesan',
  closed: 'Ditutup',
  cancelled: 'Dibatalkan',
}

const statusVariants: Record<string, 'secondary' | 'default' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  submitted: 'outline',
  approved: 'default',
  rejected: 'destructive',
  partially_ordered: 'outline',
  ordered: 'default',
  closed: 'secondary',
  cancelled: 'destructive',
}

const { can } = useCan()

export const purchaseRequestColumns = (actions: PurchaseRequestActions): ColumnDef<PurchaseRequestListItem, any>[] => [
  plainColumn<PurchaseRequestListItem>('document_number', 'No. PR', row => row.document_number),
  plainColumn<PurchaseRequestListItem>('request_date', 'Tgl Pengajuan', row => dateFormat.format(new Date(row.request_date))),
  plainColumn<PurchaseRequestListItem>('required_date', 'Tgl Dibutuhkan', row => row.required_date ? dateFormat.format(new Date(row.required_date)) : '—'),
  plainColumn<PurchaseRequestListItem>('warehouse_name', 'Gudang', row => row.warehouse_name ?? '—'),
  plainColumn<PurchaseRequestListItem>('branch_name', 'Cabang', row => row.branch_name ?? '—'),
  plainColumn<PurchaseRequestListItem>('items_count', 'Item', row => String(row.items_count)),
  plainColumn<PurchaseRequestListItem>('status', 'Status', row => statuses[row.status] ?? row.status, {
    cell: ({ row }) => h(
      Badge,
      { variant: statusVariants[row.original.status] ?? 'secondary' },
      () => statuses[row.original.status] ?? row.original.status
    ),
  }),
  ...(can('purchase.request.view') || can('purchase.request.update') || can('purchase.request.delete') || can('purchase.request.approve')
    ? [actionColumn<PurchaseRequestListItem>(PurchaseRequestTableAction, {
        onShow: actions.onShow,
        onEdit: actions.onEdit,
        onDelete: actions.onDelete,
        onSubmit: actions.onSubmit,
        onApprove: actions.onApprove,
        onReject: actions.onReject,
        onCancel: actions.onCancel,
        onClose: actions.onClose,
      })]
    : []),
]
