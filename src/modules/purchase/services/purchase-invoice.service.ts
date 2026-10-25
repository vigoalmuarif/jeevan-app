import api from '@/core/api/axios'
import type { ServerTableResponse } from '@/core/types/data-table.types'
import type {
  PurchaseInvoice,
  PurchaseInvoiceListItem,
  PurchaseInvoicePayload,
  PurchaseInvoiceReceiptOption,
  PurchaseInvoiceSupplier,
} from '../types/purchase-invoice.types'

function unwrapResource<T>(response: T | { data: T }): T {
  if (response !== null && typeof response === 'object' && !Array.isArray(response) && 'data' in response) {
    return response.data as T
  }
  return response as T
}

export const purchaseInvoiceService = {
  async getSuppliers() {
    const { data } = await api.get<ServerTableResponse<PurchaseInvoiceSupplier>>(
      '/partner/suppliers',
      { params: { per_page: 100, sort: 'name' } },
    )
    return data.data
  },

  async getInvoiceableReceipts(supplierId: number) {
    const { data } = await api.get<PurchaseInvoiceReceiptOption[] | { data: PurchaseInvoiceReceiptOption[] }>(
      '/purchase/goods-receipts/invoiceable',
      { params: { supplier_id: supplierId } },
    )
    return unwrapResource(data)
  },

  async show(id: number) {
    const { data } = await api.get<PurchaseInvoice | { data: PurchaseInvoice }>(`/purchase/invoices/${id}`)
    return unwrapResource(data)
  },

  async create(payload: PurchaseInvoicePayload) {
    const { data } = await api.post<PurchaseInvoice | { data: PurchaseInvoice }>('/purchase/invoices', payload)
    return unwrapResource(data)
  },

  async update(id: number, payload: PurchaseInvoicePayload) {
    const { data } = await api.put<PurchaseInvoice | { data: PurchaseInvoice }>(`/purchase/invoices/${id}`, payload)
    return unwrapResource(data)
  },

  async delete(id: number) {
    return api.delete(`/purchase/invoices/${id}`)
  },

  async post(id: number) {
    const { data } = await api.post<PurchaseInvoice | { data: PurchaseInvoice }>(`/purchase/invoices/${id}/post`)
    return unwrapResource(data)
  },

  async void(id: number, reason: string) {
    const { data } = await api.post<PurchaseInvoice | { data: PurchaseInvoice }>(
      `/purchase/invoices/${id}/void`,
      { reason },
    )
    return unwrapResource(data)
  },

  async getData() {
    const { data } = await api.get<ServerTableResponse<PurchaseInvoiceListItem>>('/purchase/invoices')
    return data
  },
}
