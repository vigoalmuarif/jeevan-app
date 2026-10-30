export type ReturnReason = 'damaged' | 'expired' | 'wrong_item' | 'defective' | 'other'
export type SettlementMethod = 'invoice_deduction' | 'cash_refund' | 'credit_balance'
export type DocumentStatus = 'draft' | 'posted' | 'voided'

export interface PurchaseReturnListItem {
  id: number
  document_number: string
  return_date: string
  status: DocumentStatus
  settlement_method: SettlementMethod
  reason_code: ReturnReason
  supplier_id: number
  supplier_name: string
  warehouse_id: number
  warehouse_name: string
  goods_receipt_id: number
  goods_receipt_number: string
  subtotal: number | string
  tax_amount: number | string
  grand_total: number | string
  items_count: number
  created_at: string
}

export interface PurchaseReturnItem {
  id: number
  goods_receipt_item_id: number
  product_variant_id: number
  product_name: string
  variant_name: string
  sku: string
  unit_id: number
  unit_name: string
  unit_code: string
  unit_quantity: number | string
  conversion_rate: number | string
  base_quantity: number | string
  unit_price: number | string
  unit_cost: number | string
  tax_rate: number | string
  tax_amount: number | string
  subtotal: number | string
  line_total: number | string
  reason?: string
}

export interface PurchaseReturn {
  id: number
  document_number: string
  return_date: string
  status: DocumentStatus
  settlement_method: SettlementMethod
  reason_code: ReturnReason
  supplier_id: number
  supplier?: {
    id: number
    name: string
    code?: string
    phone?: string
  }
  warehouse_id: number
  warehouse_name?: string
  branch_id?: number
  branch_name?: string
  goods_receipt_id: number
  goods_receipt?: {
    id: number
    document_number: string
    receipt_date: string
    created_at?: string
  }
  purchase_invoice_id?: number
  purchase_invoice_number?: string
  subtotal: number | string
  tax_amount: number | string
  grand_total: number | string
  notes?: string
  posted_at?: string
  voided_at?: string
  void_reason?: string
  created_at: string
  items: PurchaseReturnItem[]
}

export interface ReturnableReceiptItem {
  goods_receipt_item_id: number
  product_variant_id: number
  product_name: string
  variant_name: string
  sku: string
  unit_id: number
  unit_name: string
  conversion_rate: number
  received_unit_quantity: number
  already_returned_unit_quantity: number
  available_unit_quantity: number
  unit_price: number
  unit_cost: number
  tax_rate: number
}

export interface ReturnableReceipt {
  id: number
  document_number: string
  supplier_id: number
  warehouse_id: number
  receipt_date: string
  created_at?: string
  grand_total: number | string
  supplier?: {
    id: number
    name: string
    code?: string
  }
  warehouse?: {
    id: number
    name: string
    code?: string
  }
}

export interface PurchaseReturnPayload {
  goods_receipt_id: number
  branch_id?: number
  return_date: string
  settlement_method: SettlementMethod
  reason_code: ReturnReason
  notes?: string
  items: {
    goods_receipt_item_id: number
    unit_quantity: number
    reason?: string
  }[]
}

