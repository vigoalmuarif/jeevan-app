export type GoodsReceiptStatus = 'draft' | 'posted' | 'voided'

export interface GoodsReceiptListItem {
  id: number
  document_number: string
  receipt_date: string
  supplier_id: number
  supplier_name: string | null
  warehouse_id: number
  warehouse_name: string | null
  status: GoodsReceiptStatus
  items_count: number
  grand_total: number | string
  created_at: string
}

export interface GoodsReceiptItem {
  id?: number
  product_variant_id: number
  product_name: string | null
  variant_name: string | null
  sku: string | null
  unit_id: number
  unit_name: string | null
  unit_code: string | null
  unit_quantity: number | string
  conversion_rate: number | string
  base_quantity: number | string
  unit_price: number | string
  discount_type: 'percent' | 'amount' | null
  discount_value: number | string
  discount_amount: number | string
  tax_rate: number | string
  tax_amount: number | string
  line_total: number | string
  unit_cost: number | string
  notes: string | null
}

export interface GoodsReceipt extends GoodsReceiptListItem {
  purchase_order_id: number | null
  delivery_note_number: string | null
  is_tax_inclusive: boolean
  tax_in_cost: boolean
  items_subtotal: number | string
  discount_type: 'percent' | 'amount' | null
  discount_value: number | string
  discount_amount: number | string
  tax_amount: number | string
  notes: string | null
  posted_at: string | null
  voided_at: string | null
  void_reason: string | null
  updated_at: string
  items: GoodsReceiptItem[]
}

export interface GoodsReceiptProductUnit {
  unit_id: number
  unit_name: string
  unit_code: string
  conversion_rate: number | string
  is_base: boolean
  unit_cost: number | string
}

export interface GoodsReceiptProductOption {
  [key: string]: unknown
  selection: string
  label: string
  product_id: number
  product_name: string
  product_variant_id: number
  variant_name: string | null
  sku: string
  units: GoodsReceiptProductUnit[]
  tax_rate: number | string | null
}

export interface GoodsReceiptOptions {
  suppliers: Array<{ id: number; name: string; code: string | null }>
  warehouses: Array<{ id: number; name: string; code: string | null }>
}

export interface GoodsReceiptItemPayload {
  product_variant_id: number
  unit_id: number
  unit_quantity: number
  unit_price: number
  discount_type: 'percent' | 'amount' | null
  discount_value: number
  tax_rate: number | null
  notes: string | null
}

export interface GoodsReceiptPayload {
  supplier_id: number
  warehouse_id: number
  receipt_date: string
  delivery_note_number: string | null
  is_tax_inclusive: boolean
  discount_type: 'percent' | 'amount' | null
  discount_value: number
  notes: string | null
  items: GoodsReceiptItemPayload[]
}
