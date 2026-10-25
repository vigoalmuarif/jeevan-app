import api from '@/core/api/axios'
import type {
  PayablePurchaseInvoice,
  PurchasePayment,
  PurchasePaymentPayload,
} from '../types/purchase-payment.types'

function unwrapResource<T>(response: T | { data: T }): T {
  if (response !== null && typeof response === 'object' && !Array.isArray(response) && 'data' in response) {
    return response.data as T
  }
  return response as T
}

export const purchasePaymentService = {
  async getPayableInvoices(supplierId: number) {
    const { data } = await api.get<PayablePurchaseInvoice[] | { data: PayablePurchaseInvoice[] }>(
      '/purchase/payments/payable-invoices',
      { params: { supplier_id: supplierId } },
    )
    return unwrapResource(data)
  },

  async show(id: number) {
    const { data } = await api.get<PurchasePayment | { data: PurchasePayment }>(`/purchase/payments/${id}`)
    return unwrapResource(data)
  },

  async create(payload: PurchasePaymentPayload) {
    const { data } = await api.post<PurchasePayment | { data: PurchasePayment }>('/purchase/payments', payload)
    return unwrapResource(data)
  },

  async void(id: number, reason: string) {
    const { data } = await api.post<PurchasePayment | { data: PurchasePayment }>(
      `/purchase/payments/${id}/void`,
      { reason },
    )
    return unwrapResource(data)
  },
}
