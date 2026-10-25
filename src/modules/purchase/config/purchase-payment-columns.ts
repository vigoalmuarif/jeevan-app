import { h } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { Badge } from '@/components/ui/badge'
import { actionColumn, plainColumn } from '@/lib/data-table-column'
import { useCan } from '@/core/composables/useCan'
import PurchasePaymentTableAction from '../pages/purchase-payment/PurchasePaymentTableAction.vue'
import type { PurchasePaymentListItem } from '../types/purchase-payment.types'

export interface PurchasePaymentActions {
  onShow: (row: PurchasePaymentListItem) => void
  onVoid: (row: PurchasePaymentListItem) => void
}

const dateFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' })
const currencyFormat = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})
const paymentMethods: Record<string, string> = {
  cash: 'Tunai',
  transfer: 'Transfer Bank',
  giro: 'Giro / Cek',
  other: 'Lainnya',
}
const { can } = useCan()

export const purchasePaymentColumns = (actions: PurchasePaymentActions): ColumnDef<PurchasePaymentListItem, any>[] => [
  plainColumn<PurchasePaymentListItem>('document_number', 'No. Pembayaran', row => row.document_number),
  plainColumn<PurchasePaymentListItem>('supplier_name', 'Supplier', row => row.supplier_name),
  plainColumn<PurchasePaymentListItem>('payment_date', 'Tanggal', row => dateFormat.format(new Date(row.payment_date))),
  plainColumn<PurchasePaymentListItem>('payment_method', 'Metode', row => paymentMethods[row.payment_method] ?? row.payment_method),
  plainColumn<PurchasePaymentListItem>('reference_number', 'Referensi', row => row.reference_number || '—'),
  plainColumn<PurchasePaymentListItem>('invoices_count', 'Jumlah Faktur', row => String(row.invoices_count)),
  plainColumn<PurchasePaymentListItem>('amount', 'Nominal', row => currencyFormat.format(Number(row.amount))),
  plainColumn<PurchasePaymentListItem>('status', 'Status', row => row.status === 'voided' ? 'Dibatalkan' : 'Diposting', {
    cell: ({ row }) => h(Badge, {
      variant: row.original.status === 'voided' ? 'destructive' : 'default',
    }, () => row.original.status === 'voided' ? 'Dibatalkan' : 'Diposting'),
  }),
  ...(can('purchase.payment.view') || can('purchase.payment.void')
    ? [actionColumn<PurchasePaymentListItem>(PurchasePaymentTableAction, {
        onShow: actions.onShow,
        onVoid: actions.onVoid,
      })]
    : []),
]
