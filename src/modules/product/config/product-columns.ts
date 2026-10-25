import type { ColumnDef } from '@tanstack/vue-table'
import { h } from 'vue'
import type { Product } from '@/core/types/product.types'
import { actionColumn, plainColumn, sortableColumn } from '@/lib/data-table-column'
import ProductTableAction from '../pages/product/ProductTableAction.vue'
import ColumnStatus from '@/components/ColumnStatus.vue'
import { useCan } from '@/core/composables/useCan'

type ProductActions = {
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}

export const productColumns = (actions: ProductActions): ColumnDef<Product, any>[] => {
  const { can } = useCan()
  return [
    sortableColumn<Product>('name', 'Nama Produk'),
    plainColumn<Product>('type', 'Jenis', (product) => product.type === 'service' ? 'Jasa' : 'Produk'),
    plainColumn<Product>('variants', 'Varian / SKU', (product) => product.variants?.length
      ? product.variants.map((variant) => variant.sku).join(', ')
      : '-'),
    plainColumn<Product>('categories', 'Kategori', (product) => product.categories?.map((category) => category.name).join(', ') || '-'),
    plainColumn<Product>('is_active', 'Status', (product) => product.is_active, {
      cell: ({ row }) => h('div', { class: 'relative w-fit' }, h(ColumnStatus, {
        status: row.original.is_active,
        onExpand: row.toggleExpanded,
      })),
    }),
    ...(can('product.update') || can('product.delete')
      ? [actionColumn<Product>(ProductTableAction, {
          onEdit: (product: Product) => actions.onEdit(product),
          onDelete: (product: Product) => actions.onDelete(product),
        })]
      : []),
  ]
}
