export type PurchaseOrderStatus =
  | 'draft'
  | 'approved'
  | 'partially_received'
  | 'received'
  | 'closed'
  | 'cancelled'

export interface PurchaseOrderItem {
  id: number
  product_variant_id: number
  product_name?: string
  variant_name?: string
  sku?: string
  unit_id: number
  unit_name?: string
  unit_code?: string
  unit_quantity: number | string
  conversion_rate: number | string
  base_quantity: number | string
  received_base_quantity: number | string
  remaining_base_quantity: number | string
  remaining_unit_quantity: number | string
  unit_price: number | string
  discount_type?: 'percent' | 'amount' | null
  discount_value: number | string
  discount_amount: number | string
  tax_rate: number | string
  tax_amount: number | string
  line_total: number | string
  notes?: string | null
}

export interface PurchaseOrder {
  id: number
  document_number: string
  supplier_id: number
  supplier_name?: string
  supplier_code?: string
  payment_term_days: number
  warehouse_id: number
  warehouse_name?: string
  warehouse_code?: string
  branch_id?: number | null
  branch_name?: string | null
  order_date: string
  expected_date?: string | null
  status: PurchaseOrderStatus
  is_tax_inclusive: boolean
  items_subtotal: number | string
  discount_type?: 'percent' | 'amount' | null
  discount_value: number | string
  discount_amount: number | string
  tax_amount: number | string
  grand_total: number | string
  notes?: string | null
  approved_at?: string | null
  cancelled_at?: string | null
  cancel_reason?: string | null
  created_at?: string
  updated_at?: string
  items: PurchaseOrderItem[]
  purchase_requests?: Array<{
    id: number
    document_number: string
    request_date: string
  }>
  goods_receipts?: Array<{
    id: number
    document_number: string
    status: string
    receipt_date: string
  }>
}

export interface PurchaseOrderListItem {
  id: number
  document_number: string
  order_date: string
  expected_date?: string | null
  supplier_id: number
  supplier_name?: string
  supplier_code?: string
  warehouse_id: number
  warehouse_name?: string
  warehouse_code?: string
  branch_id?: number | null
  branch_name?: string | null
  status: PurchaseOrderStatus
  items_count: number
  grand_total: number | string
  created_at?: string
}

export interface PurchaseOrderOptions {
  suppliers: Array<{ id: number; name: string; code: string; payment_term_days: number }>
  warehouses: Array<{ id: number; name: string; code: string }>
  branches: Array<{ id: number; name: string; code: string }>
  settings: {
    default_tax_rate: string
    tax_in_cost: boolean
    prices_include_tax: boolean
    require_po: boolean
    separate_approver: boolean
  }
}

export interface PurchaseOrderItemPayload {
  product_variant_id: number
  unit_id: number
  unit_quantity: number | string
  unit_price: number | string
  discount_type?: 'percent' | 'amount' | ''
  discount_value?: number | string
  tax_rate?: number | string
  notes?: string
}

export interface PurchaseOrderPayload {
  supplier_id: number
  warehouse_id: number
  branch_id?: number | null
  order_date: string
  expected_date?: string | null
  is_tax_inclusive?: boolean
  discount_type?: 'percent' | 'amount' | ''
  discount_value?: number | string
  notes?: string
  items: PurchaseOrderItemPayload[]
}
