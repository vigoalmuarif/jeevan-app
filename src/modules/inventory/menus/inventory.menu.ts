// modules/inventory/menu.ts
import type { MenuGroup } from '@/core/types/menu.types'

export const inventoryMenu: MenuGroup = {
  key: 'inventory',
  label: 'Inventory',
  icon: 'Warehouse',
  items: [
    { key: 'inventory.product', label: 'Produk', route: 'inventory.product.index' },
    { key: 'inventory.purchase', label: 'Pembelian', route: 'inventory.purchase.index' },
    { key: 'inventory.receiving', label: 'Penerimaan', route: 'inventory.receiving.index' },
    { key: 'inventory.stock-check', label: 'Cek Stok', route: 'inventory.stock-check.index' },
  ],
}