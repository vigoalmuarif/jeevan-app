export type StockAdjustmentStatus = 'draft' | 'posted' | 'voided'

export interface StockAdjustmentListItem {
  id: number
  document_number: string
  branch_id: number | null
  branch_name: string | null
  warehouse_id: number
  warehouse_name: string
  adjustment_date: string
  reason: string
  status: StockAdjustmentStatus
  notes: string | null
  items_count: number
  created_at: string
}

export interface StockAdjustmentItem {
  id?: number
  product_id?: number
  product_name?: string
  product_variant_id: number
  variant_name?: string | null
  sku?: string
  unit_id: number
  unit_name?: string
  unit_code?: string
  unit_quantity: number | string
  conversion_rate?: number | string
  base_quantity?: number | string
  unit_cost?: number | string | null
  notes?: string | null
}

export interface StockAdjustment extends StockAdjustmentListItem {
  posted_at: string | null
  posted_by: number | null
  voided_at: string | null
  voided_by: number | null
  void_reason: string | null
  updated_at: string
  items: StockAdjustmentItem[]
}

export interface StockAdjustmentItemPayload {
  product_variant_id: number
  unit_id: number
  unit_quantity: number
  unit_cost: number | null
  notes: string | null
}

export interface StockAdjustmentPayload {
  branch_id?: number | null
  warehouse_id: number
  adjustment_date: string
  reason: string
  notes: string | null
  items: StockAdjustmentItemPayload[]
}

export interface StockAdjustmentOptions {
  branches: Array<{ id: number; name: string; code: string }>
  warehouses: Array<{ id: number; name: string; code: string; branch_id: number }>
  reasons: Array<{ value: string; label: string }>
}

export interface StockAdjustmentUnitOption {
  unit_id: number
  unit_name: string
  unit_code: string
  conversion_rate: number | string
  is_base: boolean
  unit_cost: number | string | null
}

export interface StockAdjustmentProductOption extends Record<string, unknown> {
  product_variant_id: number
  product_name: string
  variant_name: string | null
  sku: string
  label: string
  stock_quantity: number | string
  units: StockAdjustmentUnitOption[]
}

export interface StockAdjustmentFilterOptions {
  branches: StockAdjustmentOptions['branches']
  warehouses: StockAdjustmentOptions['warehouses']
  reasons: StockAdjustmentOptions['reasons']
}
