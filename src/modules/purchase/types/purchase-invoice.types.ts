export type PurchaseInvoiceStatus = 'draft' | 'posted' | 'voided'
export type PurchaseInvoicePaymentStatus = 'unpaid' | 'partial' | 'paid'

export interface PurchaseInvoiceListItem {
  id: number
  document_number: string
  supplier_invoice_number: string
  supplier_id: number
  supplier_name: string
  invoice_date: string
  due_date: string | null
  status: PurchaseInvoiceStatus
  payment_status: PurchaseInvoicePaymentStatus
  grand_total: number | string
  paid_amount: number | string
  balance_amount: number | string
  is_overdue: boolean
  created_at: string
}

export interface PurchaseInvoiceReceiptOption {
  id: number
  document_number: string
  receipt_date: string
  delivery_note_number: string | null
  warehouse_name: string | null
  items_subtotal: number | string
  discount_amount: number | string
  tax_amount: number | string
  grand_total: number | string
}

export interface PurchaseInvoiceReceipt {
  id: number
  document_number: string
  receipt_date: string
}

export interface PurchaseInvoiceItem {
  id: number
  goods_receipt_id: number
  goods_receipt_number: string
  receipt_date: string
  product_name: string
  variant_name: string | null
  sku: string
  unit_name: string
  unit_quantity: number | string
  unit_price: number | string
  discount_amount: number | string
  allocated_discount_amount: number | string
  tax_rate: number | string
  tax_amount: number | string
  subtotal: number | string
  line_total: number | string
}

export interface PurchaseInvoicePayment {
  id: number
  document_number: string
  payment_date: string
  payment_method: string
  reference_number: string | null
  status: string
  amount: number | string
}

export interface PurchaseInvoice extends PurchaseInvoiceListItem {
  branch_id: number | null
  is_overdue: boolean
  items_subtotal: number | string
  discount_amount: number | string
  tax_amount: number | string
  rounding_amount: number | string
  notes: string | null
  posted_at: string | null
  voided_at: string | null
  void_reason: string | null
  updated_at: string
  receipts: PurchaseInvoiceReceipt[]
  items: PurchaseInvoiceItem[]
  payments: PurchaseInvoicePayment[]
}

export interface PurchaseInvoicePayload {
  supplier_id?: number
  supplier_invoice_number: string
  invoice_date: string
  due_date: string | null
  rounding_amount: number
  notes: string | null
  goods_receipt_ids?: number[]
}

export interface PurchaseInvoiceSupplier {
  id: number
  name: string
  code: string | null
}
