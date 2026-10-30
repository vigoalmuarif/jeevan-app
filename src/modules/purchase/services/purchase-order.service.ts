import api from '@/core/api/axios'
import type { ServerTableResponse } from '@/core/types/data-table.types'
import type {
  PurchaseOrder,
  PurchaseOrderListItem,
  PurchaseOrderOptions,
  PurchaseOrderPayload,
} from '../types/purchase-order.types'

export const purchaseOrderService = {
  async getOptions() {
    const { data } = await api.get<{ data: PurchaseOrderOptions }>('/purchase/orders/options')
    return data.data
  },

  async getReceivable(supplierId?: number) {
    const { data } = await api.get<{ data: PurchaseOrder[] }>('/purchase/orders/receivable', {
      params: supplierId ? { supplier_id: supplierId } : undefined,
    })
    return data.data
  },

  async show(id: number) {
    const { data } = await api.get<{ data: PurchaseOrder }>(`/purchase/orders/${id}`)
    return data.data
  },

  async store(payload: PurchaseOrderPayload) {
    const { data } = await api.post<{ data: PurchaseOrder }>('/purchase/orders', payload)
    return data.data
  },

  async update(id: number, payload: PurchaseOrderPayload) {
    const { data } = await api.put<{ data: PurchaseOrder }>(`/purchase/orders/${id}`, payload)
    return data.data
  },

  async delete(id: number) {
    return api.delete(`/purchase/orders/${id}`)
  },

  async approve(id: number) {
    const { data } = await api.post<{ data: PurchaseOrder }>(`/purchase/orders/${id}/approve`)
    return data.data
  },

  async cancel(id: number, reason: string) {
    const { data } = await api.post<{ data: PurchaseOrder }>(`/purchase/orders/${id}/cancel`, { reason })
    return data.data
  },

  async close(id: number) {
    const { data } = await api.post<{ data: PurchaseOrder }>(`/purchase/orders/${id}/close`)
    return data.data
  },

  async getData() {
    const { data } = await api.get<ServerTableResponse<PurchaseOrderListItem>>('/purchase/orders')
    return data
  },
}
