export interface StockMutationListItem {
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
  mutation_type: string
  quantity: number | string
  quantity_before: number | string
  quantity_after: number | string
  unit_cost: number | string
  total_cost: number | string
  avg_cost_after: number | string
  reference_type: string | null
  reference_number: string | null
  notes: string | null
  mutated_at: string
}

export interface StockMutationFilterOptions {
  branches: Array<{ id: number; name: string; code: string }>
  warehouses: Array<{ id: number; name: string; code: string; branch_id: number }>
}
