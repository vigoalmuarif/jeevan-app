import type { ColumnDef } from '@tanstack/vue-table'
import { plainColumn } from '@/lib/data-table-column'
import type { WarehouseStockListItem } from '@/core/types/warehouse-stock.types'

const quantityFormat = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 4 })

export const warehouseStockColumns: ColumnDef<WarehouseStockListItem, any>[] = [
  plainColumn<WarehouseStockListItem>('product_name', 'Produk', row => row.product_name),
  plainColumn<WarehouseStockListItem>('variant_name', 'Varian', row => row.variant_name || 'Default'),
  plainColumn<WarehouseStockListItem>('sku', 'SKU', row => row.sku),
  plainColumn<WarehouseStockListItem>('branch_name', 'Cabang', row => row.branch_name),
  plainColumn<WarehouseStockListItem>('warehouse_name', 'Gudang', row => row.warehouse_name),
  plainColumn<WarehouseStockListItem>('quantity', 'Stok', row => quantityFormat.format(Number(row.quantity) || 0)),
]
