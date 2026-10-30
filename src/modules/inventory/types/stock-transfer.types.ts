export type StockTransferStatus = 'draft' | 'shipped' | 'received' | 'cancelled'

export interface StockTransferListItem {
  id: number
  document_number: string
  from_warehouse_id: number
  from_warehouse_name: string
  to_warehouse_id: number
  to_warehouse_name: string
  transfer_date: string
  status: StockTransferStatus
  items_count: number
  notes: string | null
  created_at: string
}

export interface StockTransferItem {
  id?: number
  product_variant_id: number
  product_name?: string
  variant_name?: string | null
  sku?: string
  unit_id: number
  unit_name?: string
  unit_code?: string
  unit_quantity: number | string
  conversion_rate?: number | string
  base_quantity?: number | string
  received_base_quantity?: number | string | null
  variance_base_quantity?: number | string | null
  unit_cost?: number | string | null
  notes?: string | null
}

export interface StockTransfer extends StockTransferListItem {
  receive_notes: string | null
  shipped_at: string | null
  shipped_by: number | null
  received_at: string | null
  received_by: number | null
  cancelled_at: string | null
  cancelled_by: number | null
  cancel_reason: string | null
  updated_at: string
  items: StockTransferItem[]
}

export interface StockTransferItemPayload {
  product_variant_id: number
  unit_id: number
  unit_quantity: number
  notes: string | null
}

export interface StockTransferPayload {
  from_warehouse_id: number
  to_warehouse_id: number
  transfer_date: string
  notes: string | null
  items: StockTransferItemPayload[]
}

export interface StockTransferOptions {
  warehouses: Array<{ id: number; name: string; code: string }>
}

export interface StockTransferProductOption extends Record<string, unknown> {
  product_variant_id: number
  product_name: string
  variant_name: string | null
  sku: string
  label: string
  stock_quantity: number | string
  source_stock_quantity: number | string
  destination_stock_quantity: number | string | null
  units: Array<{
    unit_id: number
    unit_name: string
    unit_code: string
    conversion_rate: number | string
    is_base: boolean
    unit_cost: number | string | null
  }>
}
