import type { MenuNode } from '@/core/types/menu.types'

export const inventoryMenu: MenuNode = {
  key: 'inventory',
  label: 'Inventory',
  icon: 'Warehouse',
  module: 'inventory',
  children: [
    {
      key: 'inventory.warehouse-stocks',
      label: 'Stok Produk',
      icon: 'Warehouse',
      routeName: 'inventory.warehouse-stocks.index',
      permission: 'inventory.view',
    },
    {
      key: 'inventory.stock-mutations',
      label: 'Mutasi Stok',
      icon: 'History',
      routeName: 'inventory.stock-mutations.index',
      permission: 'inventory.movement.view',
    },
    {
      key: 'inventory.stock-adjustments',
      label: 'Stock Adjustment',
      icon: 'ClipboardCheck',
      routeName: 'inventory.stok-adjusment.index',
      permission: 'inventory.adjustment.view',
    },
    {
      key: 'inventory.stock-transfers',
      label: 'Transfer Stok',
      icon: 'ArrowRightLeft',
      routeName: 'inventory.stock-transfers.index',
      permission: 'inventory.transfer.view',
    },
  ],
}
