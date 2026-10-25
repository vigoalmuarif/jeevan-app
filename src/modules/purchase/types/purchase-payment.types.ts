export type PurchasePaymentStatus = 'posted' | 'voided'
export type PurchasePaymentMethod = 'cash' | 'transfer' | 'giro' | 'other'

export interface PayablePurchaseInvoice {
  id: number
  document_number: string
  supplier_invoice_number: string
  invoice_date: string
  due_date: string | null
  grand_total: number | string
  paid_amount: number | string
  balance_amount: number | string
  payment_status: 'unpaid' | 'partial'
  is_overdue: boolean
}

export interface PurchasePaymentAllocation {
  id: number
  amount: number | string
  purchase_invoice_id: number
  invoice_number: string
  supplier_invoice_number: string
  invoice_date: string
  due_date: string | null
  grand_total: number | string
  paid_amount: number | string
  balance_amount: number | string
  payment_status: 'unpaid' | 'partial' | 'paid'
}

export interface PurchasePaymentListItem {
  id: number
  document_number: string
  supplier_id: number
  supplier_name: string
  payment_date: string
  payment_method: PurchasePaymentMethod
  amount: number | string
  reference_number: string | null
  status: PurchasePaymentStatus
  invoices_count: number
  created_at: string
}

export interface PurchasePayment extends PurchasePaymentListItem {
  notes: string | null
  voided_at: string | null
  void_reason: string | null
  allocations: PurchasePaymentAllocation[]
}

export interface PurchasePaymentPayload {
  supplier_id: number
  payment_date: string
  payment_method: PurchasePaymentMethod
  reference_number: string | null
  notes: string | null
  amount: number
  allocations: Array<{
    purchase_invoice_id: number
    amount: number
  }>
}
