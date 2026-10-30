export type PurchaseRequestStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'partially_ordered'
  | 'ordered'
  | 'closed'
  | 'cancelled'

export type PurchaseRequestSource = 'manual' | 'low_stock'

export interface PurchaseRequestListItem {
  id: number
  document_number: string
  request_date: string
  required_date: string | null
  source: PurchaseRequestSource
  status: PurchaseRequestStatus
  warehouse_id: number
  warehouse_name: string | null
  branch_id: number | null
  branch_name: string | null
  items_count: number
  notes: string | null
  created_at: string
}

export interface PurchaseRequestLinkedOrder {
  order_id: number
  document_number: string
  order_date: string
  status: string
  base_quantity: string
}

export interface PurchaseRequestItemDetail {
  id: number
  product_variant_id: number
  product_name: string
  variant_name: string | null
  sku: string
  unit_id: number
  unit_name: string
  unit_code: string
  conversion_rate: string
  unit_quantity: string
  base_quantity: string
  ordered_base_quantity: string
  remaining_base_quantity: string
  on_hand_base_quantity: string | null
  suggested_supplier_id: number | null
  suggested_supplier_name: string | null
  estimated_unit_price: string | null
  notes: string | null
  orders: PurchaseRequestLinkedOrder[]
}

export interface PurchaseRequest {
  id: number
  document_number: string
  request_date: string
  required_date: string | null
  source: PurchaseRequestSource
  status: PurchaseRequestStatus
  warehouse_id: number
  warehouse_name: string | null
  branch_id: number | null
  branch_name: string | null
  notes: string | null
  submitted_at: string | null
  approved_at: string | null
  rejected_at: string | null
  reject_reason: string | null
  cancelled_at: string | null
  cancel_reason: string | null
  closed_at: string | null
  items: PurchaseRequestItemDetail[]
  created_at: string
  updated_at: string
}

export interface PurchaseRequestItemPayload {
  product_variant_id: number
  unit_id: number
  unit_quantity: number | string
  on_hand_base_quantity?: number | string | null
  suggested_supplier_id?: number | null
  estimated_unit_price?: number | string | null
  notes?: string | null
}

export interface PurchaseRequestPayload {
  branch_id?: number | null
  warehouse_id: number
  request_date: string
  required_date?: string | null
  source?: PurchaseRequestSource
  notes?: string | null
  items: PurchaseRequestItemPayload[]
}

export interface ApprovedPurchaseRequestItem {
  purchase_request_item_id: number
  purchase_request_id: number
  document_number: string
  request_date: string
  required_date: string | null
  warehouse_id: number
  warehouse_name: string | null
  branch_id: number | null
  branch_name: string | null
  product_variant_id: number
  product_name: string
  variant_name: string | null
  sku: string
  unit_id: number
  unit_name: string
  unit_code: string
  conversion_rate: string
  base_quantity: string
  ordered_base_quantity: string
  remaining_base_quantity: string
  suggested_supplier_id: number | null
  suggested_supplier_name: string | null
  estimated_unit_price: string | null
  notes: string | null
}

export interface ConvertOrderGroupItemPayload {
  purchase_request_item_id: number
  unit_id?: number | null
  unit_quantity: number | string
  unit_price: number | string
  discount_type?: 'percent' | 'amount' | null
  discount_value?: number | string | null
  tax_rate?: number | string | null
  notes?: string | null
}

export interface ConvertOrderGroupPayload {
  supplier_id: number
  warehouse_id: number
  branch_id?: number | null
  order_date: string
  expected_date?: string | null
  is_tax_inclusive?: boolean
  discount_type?: 'percent' | 'amount' | null
  discount_value?: number | string | null
  notes?: string | null
  items: ConvertOrderGroupItemPayload[]
}

export interface ConvertPurchaseRequestPayload {
  groups: ConvertOrderGroupPayload[]
}

export interface PurchaseRequestOptions {
  warehouses: Array<{ id: number; name: string; code: string }>
  branches: Array<{ id: number; name: string; code: string }>
  suppliers: Array<{ id: number; name: string; code: string }>
  settings: {
    request_enabled: boolean
    separate_approver: boolean
  }
}
