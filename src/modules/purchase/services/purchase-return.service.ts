import api from '@/core/api/axios'
import type { ServerTableResponse } from '@/core/types/data-table.types'
import type {
  PurchaseReturn,
  PurchaseReturnListItem,
  PurchaseReturnPayload,
  ReturnableReceipt,
  ReturnableReceiptItem,
} from '../types/purchase-return.types'

export const purchaseReturnService = {
  async getReturnableReceipts(search?: string, params?: Record<string, unknown>) {
    const { data } = await api.get<{ data: ReturnableReceipt[] }>('/purchase/returns/returnable-receipts', {
      params: { search, ...params },
    })
    return data.data
  },

  async getReturnableItems(receiptId: number) {
    const { data } = await api.get<{ data: ReturnableReceiptItem[] }>(`/purchase/returns/returnable-items/${receiptId}`)
    return data.data
  },

  async show(id: number) {
    const { data } = await api.get<{ data: PurchaseReturn }>(`/purchase/returns/${id}`)
    return data.data
  },

  async store(payload: PurchaseReturnPayload) {
    const { data } = await api.post<{ data: PurchaseReturn }>('/purchase/returns', payload)
    return data.data
  },

  async update(id: number, payload: PurchaseReturnPayload) {
    const { data } = await api.put<{ data: PurchaseReturn }>(`/purchase/returns/${id}`, payload)
    return data.data
  },

  async delete(id: number) {
    return api.delete(`/purchase/returns/${id}`)
  },

  async post(id: number) {
    const { data } = await api.post<{ data: PurchaseReturn }>(`/purchase/returns/${id}/post`)
    return data.data
  },

  async void(id: number, reason: string) {
    const { data } = await api.post<{ data: PurchaseReturn }>(`/purchase/returns/${id}/void`, { reason })
    return data.data
  },

  async getData(params?: Record<string, unknown>) {
    const { data } = await api.get<ServerTableResponse<PurchaseReturnListItem>>('/purchase/returns', { params })
    return data
  },
}
