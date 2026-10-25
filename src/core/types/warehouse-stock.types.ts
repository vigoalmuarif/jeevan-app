export interface WarehouseStockListItem {
  id: number
  product_id: number
  product_name: string
  product_variant_id: number
  variant_name: string | null
  sku: string
  branch_id: number
  branch_name: string
  warehouse_id: number
  warehouse_name: string
  quantity: number | string
  avg_cost: number | string
  last_mutated_at: string | null
}

export interface WarehouseStockFilterOptions {
  branches: Array<{ id: number; name: string; code: string }>
  warehouses: Array<{ id: number; name: string; code: string; branch_id: number }>
}
