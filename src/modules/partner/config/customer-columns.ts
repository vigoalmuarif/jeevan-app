import type { ColumnDef } from '@tanstack/vue-table'
import { h } from 'vue'
import { Badge } from '@/components/ui/badge'
import { actionColumn, plainColumn, sortableColumn } from '@/lib/data-table-column'
import type { CustomerListItem } from '@/core/types/customer.types'
import DataTableCustomerAction from '../pages/customer/DataTableCustomerAction.vue'
import { useCan } from '@/core/composables/useCan'
import ColumnStatus from '@/components/ColumnStatus.vue'

type CustomerActions = {
  onShow: (customer: CustomerListItem) => void
  onEdit: (customer: CustomerListItem) => void
  onDelete: (customer: CustomerListItem) => void
}

const formatCurrency = (value: number | string) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)

const { can } = useCan()

export const customerColumns = (actions: CustomerActions): ColumnDef<CustomerListItem, any>[] => [
  sortableColumn<CustomerListItem>('code', 'Kode'),
  sortableColumn<CustomerListItem>('name', 'Nama customer', {
    cell: ({ row }) => h('div', { class: 'flex min-w-40 flex-col gap-1' }, [
      h('span', { class: 'font-medium text-foreground' }, row.original.name),
      h('span', { class: 'text-xs text-muted-foreground' }, row.original.type === 'company' ? 'Perusahaan' : 'Perorangan'),
    ]),
  }),
  plainColumn<CustomerListItem>('contact_person', 'Kontak', (row) => row.contact_person || '—'),
  plainColumn<CustomerListItem>('phone', 'Telepon', (row) => row.phone || '—'),
  plainColumn<CustomerListItem>('credit_limit', 'Limit kredit', (row) => formatCurrency(row.credit_limit)),
  plainColumn<CustomerListItem>('payment_term_days', 'Tempo', (row) => row.payment_term_days > 0 ? `${row.payment_term_days} hari` : 'Tunai'),
  plainColumn<CustomerListItem>("is_active", "Status", (row) => row.is_active, {
       cell: ({ row }) => {
         return h(
           "div",
           { class: "relative w-fit" },
           h(ColumnStatus, {
             status: row.original.is_active,
             onExpand: row.toggleExpanded,
           }),
         );
       },
     }),
  ...(can('partner.customer.view') || can('partner.customer.update') || can('partner.customer.delete')
    ? [actionColumn<CustomerListItem>(DataTableCustomerAction, {
        onShow: (customer) => actions.onShow(customer),
        onEdit: (customer) => actions.onEdit(customer),
        onDelete: (customer) => actions.onDelete(customer),
      })]
    : []),
]
